const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('Checking clients...');
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found', data?.length, 'clients:');
    data?.forEach(c => console.log(' -', c.id, '|', c.name));
  }
}

check();
