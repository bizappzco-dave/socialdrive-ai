const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('Checking submissions...');
  const { data, error } = await supabase
    .from('submissions')
    .select('upload_token, client_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found', data?.length, 'submissions:');
    data?.forEach(s => console.log(' -', s.upload_token, '|', s.client_id, '|', s.status));
  }
}

check();
