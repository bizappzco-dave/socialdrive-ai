const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Query information_schema directly
  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'submissions')
    .order('ordinal_position', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in submissions table:');
    columns.forEach(c => console.log(' -', c.column_name, '|', c.data_type));
  }
}

check();
