const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const token = '65d4595a1ddeab4ba72a1148bc746d1e';
  console.log('Checking token:', token);
  const { data, error } = await supabase
    .from('submissions')
    .select('id, client_id, client_name, upload_token, status, created_at')
    .eq('upload_token', token)
    .single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found:', data);
  }
}

check();
