import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { email, audioUrl } = await req.json();

    // 1. Find or create consultant
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select()
      .eq('email', email)
      .single();

    if (consultantError && consultantError.code !== 'PGRST116') {
      throw consultantError;
    }

    let consultantId = consultant?.id;

    if (!consultantId) {
      const { data: newConsultant, error: createError } = await supabase
        .from('consultants')
        .insert({ email, name: email.split('@')[0] })
        .select()
        .single();

      if (createError) throw createError;
      consultantId = newConsultant.id;
    }

    // 2. Create consultation record
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        consultant_id: consultantId,
        audio_url: audioUrl,
        email_source: email,
      })
      .select()
      .single();

    if (consultationError) throw consultationError;

    // TODO: Implement actual transcription and scoring logic
    // For now, we'll just create a placeholder score
    const { error: scoreError } = await supabase
      .from('scores')
      .insert({
        consultation_id: consultation.id,
        category: 'Overall',
        score: 75,
        notes: 'Placeholder score',
      });

    if (scoreError) throw scoreError;

    return new Response(
      JSON.stringify({ message: 'Consultation processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});