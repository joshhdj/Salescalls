import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import FormData from 'npm:form-data@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const uploadToStorage = async (buffer: ArrayBuffer, filename: string) => {
  const { data, error } = await supabase.storage
    .from('consultations')
    .upload(`recordings/${filename}`, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) throw error;
  return data.path;
};

const processEmail = async (req: Request) => {
  const formData = await req.formData();
  
  // Get sender email
  const from = formData.get('sender') as string;
  if (!from) throw new Error('No sender email found');
  
  // Get attachment
  const attachment = formData.get('attachment-1') as File;
  if (!attachment || attachment.type !== 'audio/mpeg') {
    throw new Error('No valid MP3 attachment found');
  }

  if (attachment.size > 50 * 1024 * 1024) { // 50MB limit
    throw new Error('File size exceeds 50MB limit');
  }

  // Upload audio file to Supabase Storage
  const audioPath = await uploadToStorage(
    await attachment.arrayBuffer(),
    attachment.name || 'recording.mp3'
  );
  
  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('consultations')
    .getPublicUrl(`recordings/${audioPath}`);

  // Process consultation
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-consultation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: from,
      audioUrl: publicUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to process consultation');
  }

  return { success: true };
};

// Handle incoming webhook from Mailgun
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await processEmail(req);

    return new Response(
      JSON.stringify({ message: 'Email processed successfully', ...result }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});