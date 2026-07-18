import { createClient } from '@supabase/supabase-js';

// Consider moving these to a .env file (e.g., import.meta.env.VITE_SUPABASE_URL)
const supabaseUrl = 'https://ooxnbpninqfyqafovitn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veG5icG5pbnFmeXFhZm92aXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTA1NjgsImV4cCI6MjA4OTU4NjU2OH0.pqaJoIT1dmH0bBFR0DRGd4Xln5TpXyhqmGhh6JRiOmM';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Convert a browser File into a Uint8Array for Supabase storage uploads
export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

// Convert a photo File into binary (Uint8Array)
// Useful if you want to inspect/transform bytes before uploading.
export async function photoToBinary(file: File): Promise<Uint8Array> {
  return fileToUint8Array(file);
}



