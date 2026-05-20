const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const token = '65d4595a1ddeab4ba72a1148bc746d1e';
  console.log('Checking for duplicates of token:', token);
  const { data, error } = await supabase
    .from('submissions')
    .select('id, upload_token, client_name')
    .eq('upload_token', token);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found', data?.length, 'rows:');
    data?.forEach(d => console.log(' -', d.id, '|', d.upload_token, '|', d.client_name));
  }
}

check();
