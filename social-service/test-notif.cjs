require('dotenv').config({path: 'c:/Backend_uniconnect_6/UNICONNECT_6_Backend/social-service/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
test();
