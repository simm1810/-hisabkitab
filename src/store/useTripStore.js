import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateJoinCode } from '../utils/settlement';

export const useTripStore = create((set, get) => ({
  trips: [],
  currentTrip: null,
  members: [],
  expenses: [],
  settlements: [],
  loading: false,
  realtimeChannel: null,

  // ---------------- Dashboard: fetch all trips the user belongs to ----------------
  fetchMyTrips: async (userId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('trip_members')
      .select('trip_id, role, trips(*)')
      .eq('user_id', userId);

    if (error) {
      set({ loading: false });
      throw error;
    }

    const trips = (data || [])
      .filter((row) => row.trips)
      .map((row) => ({ ...row.trips, myRole: row.role }));

    set({ trips, loading: false });
    return trips;
  },

  // ---------------- Create a new trip ----------------
  createTrip: async ({ name, destination, startDate, endDate, expectedMembers }, userId) => {
    let joinCode = generateJoinCode(destination);

    // Ensure uniqueness (retry a few times client-side; DB unique constraint is the real guard)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: existing } = await supabase.from('trips').select('id').eq('join_code', joinCode).maybeSingle();
      if (!existing) break;
      joinCode = generateJoinCode(destination);
    }

    const inviteLink = `${window.location.origin}/join/${joinCode}`;

    const tripPayload = {
      name,
      destination,
      start_date: startDate || null,
      end_date: endDate || null,
      expected_members: expectedMembers || 2,
      created_by: userId,
      join_code: joinCode,
      invite_link: inviteLink,
    };

    let { data: trip, error } = await supabase
      .from('trips')
      .insert(tripPayload)
      .select()
      .single();

    if (error?.message?.includes("'created_by' column")) {
      const legacyTripPayload = { ...tripPayload };
      delete legacyTripPayload.created_by;

      ({ data: trip, error } = await supabase
        .from('trips')
        .insert(legacyTripPayload)
        .select()
        .single());
    }

    if (error) throw error;

    const { error: memberError } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: userId,
      role: 'admin',
    });
    if (memberError) throw memberError;

    return trip;
  },

  // ---------------- Join an existing trip via code ----------------
  findTripByCode: async (code) => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('join_code', code.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  joinTrip: async (tripId, userId) => {
    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return existing; // already a member

    const { data, error } = await supabase
      .from('trip_members')
      .insert({ trip_id: tripId, user_id: userId, role: 'member' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---------------- Load a single trip's full detail ----------------
  loadTripDetail: async (tripId) => {
    set({ loading: true });

    const [{ data: trip }, { data: memberRows }, { data: expenses }, { data: settlements }] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('trip_members').select('id, role, joined_at, profiles(*)').eq('trip_id', tripId),
      supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('settlements').select('*').eq('trip_id', tripId).order('settled_at', { ascending: false }),
    ]);

    const members = (memberRows || [])
      .filter((r) => r.profiles)
      .map((r) => ({ ...r.profiles, role: r.role, joined_at: r.joined_at, member_row_id: r.id }));

    set({
      currentTrip: trip,
      members,
      expenses: expenses || [],
      settlements: settlements || [],
      loading: false,
    });

    return { trip, members, expenses, settlements };
  },

  // ---------------- Realtime subscription for a trip ----------------
  subscribeToTrip: (tripId) => {
    get().unsubscribeFromTrip();

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` }, () => {
        get().loadTripDetail(tripId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` }, () => {
        get().loadTripDetail(tripId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `trip_id=eq.${tripId}` }, () => {
        get().loadTripDetail(tripId);
      })
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromTrip: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },

  // ---------------- Expenses ----------------
  addExpense: async ({ tripId, paidByUserId, addedByUserId, amount, description, category, date, receiptFile }) => {
    let receiptUrl = null;

    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop();
      const path = `${tripId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, receiptFile);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(path);
      receiptUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        paid_by_user_id: paidByUserId,
        added_by_user_id: addedByUserId,
        amount,
        description,
        category,
        expense_date: date,
        receipt_url: receiptUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteExpense: async (expenseId) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
  },

  // ---------------- Members ----------------
  removeMember: async (memberRowId) => {
    const { error } = await supabase.from('trip_members').delete().eq('id', memberRowId);
    if (error) throw error;
  },

  // ---------------- Settlements ----------------
  recordSettlement: async ({ tripId, fromUserId, toUserId, amount, note }) => {
    const { data, error } = await supabase
      .from('settlements')
      .insert({ trip_id: tripId, from_user_id: fromUserId, to_user_id: toUserId, amount, note })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  reset: () => set({ currentTrip: null, members: [], expenses: [], settlements: [] }),
}));
