import { createClient } from '@supabase/supabase-js';

// Consider moving these to a .env file (e.g., import.meta.env.VITE_SUPABASE_URL)
const supabaseUrl = 'https://xqbjtjklbupryletpwcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYmp0amtsYnVwcnlsZXRwd2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTYzODAsImV4cCI6MjA5MTQzMjM4MH0.pPYjHABAm8iw2AZbr_9bvMY51-3L0zJZVxejX5e02v4';

export const supabase = createClient(supabaseUrl, supabaseKey);