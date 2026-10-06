import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const getAuthError = (error) => {
  if (!error) return null;

  const message = error.message || '';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return new Error('Email or password is incorrect. If this is your first time, use Sign Up first.');
  }

  if (
    normalizedMessage.includes('provider') ||
    normalizedMessage.includes('oauth') ||
    normalizedMessage.includes('unsupported')
  ) {
    return new Error('Google sign-in is not configured in Supabase yet. Enable the Google provider in Supabase Authentication settings.');
  }

  if (
    normalizedMessage.includes('email not confirmed')
  ) {
    return new Error('Please confirm your email first, then sign in.');
  }

  if (
    normalizedMessage.includes('rate limit') ||
    error.status === 429
  ) {
    return new Error('Too many email requests. Please wait a few minutes, then try again.');
  }

  if (
    message === 'Failed to fetch' ||
    error.name === 'AuthRetryableFetchError'
  ) {
    return new Error(
      'Could not reach Supabase. Check your internet connection and VITE_SUPABASE_URL in .env.'
    );
  }

  return error;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const { data, error } = await supabase.auth.getSession();
    const authError = getAuthError(error);
    if (authError) {
      set({ user: null, profile: null, loading: false, initialized: true });
      console.error(authError);
      return;
    }

    const user = data?.session?.user || null;
    set({ user, profile: null, loading: false, initialized: true });
    if (user) get().fetchProfile(user.id);

    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      set({ user: nextUser, profile: null, loading: false });

      if (nextUser) {
        setTimeout(() => {
          get().fetchProfile(nextUser.id);
        }, 0);
      }
    });
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error) set({ profile: data });
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    });
    const authError = getAuthError(error);
    if (authError) throw authError;

    if (data?.url) {
      window.location.assign(data.url);
      return data;
    }

    throw new Error('Google sign-in could not start. Check your Supabase Google provider setup.');
  },

  signUpWithEmail: async (email, password, name) => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: name.trim() } },
    });
    const authError = getAuthError(error);
    if (authError) throw authError;
    const user = data?.session?.user || null;
    if (user) {
      set({ user, profile: null, loading: false });
      get().fetchProfile(user.id);
    }
    return data;
  },

  signInWithEmail: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    const authError = getAuthError(error);
    if (authError) throw authError;
    const user = data?.session?.user || null;
    if (user) {
      set({ user, profile: null, loading: false });
      get().fetchProfile(user.id);
    }
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
