const supabaseUrl = 'https://ooxnbpninqfyqafovitn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veG5icG5pbnFmeXFhZm92aXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTA1NjgsImV4cCI6MjA4OTU4NjU2OH0.pqaJoIT1dmH0bBFR0DRGd4Xln5TpXyhqmGhh6JRiOmM';
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);
supabase.from('students').select('*').limit(1).then(({ data, error }) => {
  if (error) console.error(error);
  else console.log('Columns:', Object.keys(data[0] || {}));
  if (data[0] && data[0].photo_url) console.log('photo_url length:', data[0].photo_url.length);
});
