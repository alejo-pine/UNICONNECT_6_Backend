import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase.from('event').update({ capacity: 2, available_spots: 2 }).neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error(error);
  else console.log('Actualizados cupos a 2 para hacer pruebas.');
}

main();
