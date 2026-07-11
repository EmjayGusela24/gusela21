const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ooxnbpninqfyqafovitn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veG5icG5pbnFmeXFhZm92aXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTA1NjgsImV4cCI6MjA4OTU4NjU2OH0.pqaJoIT1dmH0bBFR0DRGd4Xln5TpXyhqmGhh6JRiOmM';
const supabase = createClient(supabaseUrl, supabaseKey);

const dummyStudent = {
  id: "999999999999",
  name: "Test Photo Insert",
  password: "dummy_hashed_password",
  grade: "G7",
  section: "Test",
  age: 15,
  has_voted: false,
  photo: "\\x89504e470d0a1a0a0000000d49484",
  photo_url: null,
};

supabase.from('students').insert([dummyStudent]).then(({ data, error }) => {
  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESSFUL!");
    supabase.from('students').delete().eq('id', dummyStudent.id).then(() => {
      console.log("Cleanup done.");
    });
  }
});
