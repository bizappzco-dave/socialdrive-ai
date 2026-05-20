const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Try querying with just * to see what columns exist
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in submissions:', Object.keys(data[0]));
    console.log('Sample data:', data[0]);
  }
}

check();
