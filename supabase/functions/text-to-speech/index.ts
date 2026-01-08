import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default voice ID if not provided
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah

// Input validation constants
const MAX_TEXT_LENGTH = 5000;
const VOICE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional authentication - log user if authenticated
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    
    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      
      if (claimsData?.claims?.sub) {
        userId = claimsData.claims.sub;
      }
    }
    
    console.log(`Request from user: ${userId}`);

    const { text, voiceId, voiceSettings } = await req.json();

    // Validate text is provided
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate text length
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate voiceId format if provided
    if (voiceId && !VOICE_ID_PATTERN.test(voiceId)) {
      return new Response(
        JSON.stringify({ error: "Invalid voice ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate voice settings ranges if provided
    if (voiceSettings) {
      const { stability, similarity, style, speed } = voiceSettings;
      
      if (stability !== undefined && (stability < 0 || stability > 1)) {
        return new Response(
          JSON.stringify({ error: "Stability must be between 0 and 1" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (similarity !== undefined && (similarity < 0 || similarity > 1)) {
        return new Response(
          JSON.stringify({ error: "Similarity must be between 0 and 1" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (style !== undefined && (style < 0 || style > 1)) {
        return new Response(
          JSON.stringify({ error: "Style must be between 0 and 1" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (speed !== undefined && (speed < 0.5 || speed > 2)) {
        return new Response(
          JSON.stringify({ error: "Speed must be between 0.5 and 2" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "TTS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedVoiceId = voiceId || DEFAULT_VOICE_ID;

    // Use provided voice settings or defaults
    const settings = {
      stability: voiceSettings?.stability ?? 0.5,
      similarity_boost: voiceSettings?.similarity ?? 0.75,
      style: voiceSettings?.style ?? 0.0,
      use_speaker_boost: true,
      speed: voiceSettings?.speed ?? 1.0,
    };

    console.log(`Generating TTS for ${text.length} characters with voice ID: ${selectedVoiceId}`, settings);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: settings,
        }),
      }
    );

    if (!response.ok) {
      // Log only status code, not full error text to avoid leaking sensitive info
      console.error(`TTS API request failed with status: ${response.status}`);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    console.log("TTS generated successfully, audio size:", audioBuffer.byteLength);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log error type only, not full message to prevent information leakage
    console.error("TTS processing error:", error instanceof Error ? error.constructor.name : "Unknown");
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
