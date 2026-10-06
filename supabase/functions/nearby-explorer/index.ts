// Supabase Edge Function: nearby-explorer
// Deploy with: supabase functions deploy nearby-explorer
// Set secret with: supabase secrets set GEMINI_API_KEY=your_key_here
//
// This keeps the Gemini/OpenAI API key OFF the client. The React app calls
// this function via supabase.functions.invoke('nearby-explorer', { body }).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { destination, mode } = await req.json();
    // mode: 'places' | 'eats' | 'petrol' | 'atm'

    const modePrompts: Record<string, string> = {
      places: `Suggest the top 10 nearby tourist places to visit near ${destination}, ideal for a group of friends on a budget trip.`,
      eats: `Suggest 10 cheap and popular local eateries / street food spots near ${destination}, good for a group of friends on a budget.`,
      petrol: `Suggest well-known petrol pumps / fuel stations near ${destination}.`,
      atm: `Suggest well-known ATMs / banks near ${destination}.`,
    };

    const prompt = `${modePrompts[mode] || modePrompts.places}

Respond ONLY with a valid JSON array (no markdown, no commentary) of exactly 10 objects, each shaped like:
{"name": string, "type": string, "rating": number (1-5, one decimal), "distance_km": number (one decimal), "note": string (one short budget-friendly tip, under 15 words)}`;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured on the server. Run: supabase secrets set GEMINI_API_KEY=...' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    let places;
    try {
      places = JSON.parse(text);
    } catch {
      places = [];
    }

    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
