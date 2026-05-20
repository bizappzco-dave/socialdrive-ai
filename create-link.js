const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createLink() {
  const uploadToken = crypto.randomBytes(16).toString('hex');
  const reviewToken = crypto.randomBytes(16).toString('hex');
  
  // Use LED Lights Dublin client
  const clientId = '870546da-d178-4a41-a6cc-78edd8b6cec2';
  
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      client_id: clientId,
      client_name: 'LED Lights Dublin',
      upload_token: uploadToken,
      review_token: reviewToken,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    const baseUrl = 'https://socialdrive-ai.vercel.app';
    console.log('\n✅ Upload Link Created!\n');
    console.log('Upload URL:', `${baseUrl}/upload/${uploadToken}`);
    console.log('Review URL:', `${baseUrl}/review/${reviewToken}`);
    console.log('\nToken:', uploadToken);
  }
}

createLink();
