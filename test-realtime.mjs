import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Listening to Supabase Realtime...');
  
  const channel = supabase.channel('public:messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
      console.log('\n[REALTIME] messages:', payload.eventType, payload.new?.id || payload.old?.id);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'action_requests' }, payload => {
      console.log('\n[REALTIME] action_requests:', payload.eventType, payload.new?.id || payload.old?.id);
    })
    .subscribe((status) => {
      console.log('Subscribe Status:', status);
    });

  // Give it a second to connect
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Fetching a group id...');
  const { data: groups } = await supabase.from('groups').select('id').limit(1);
  const groupId = groups[0].id;
  
  console.log('Inserting a message...');
  const { data: msg } = await supabase.from('messages').insert({
    group_id: groupId,
    body: 'Hello test realtime',
  }).select().single();
  
  console.log('Message inserted:', msg.id);
  
  // Wait for events
  await new Promise(r => setTimeout(r, 5000));
  process.exit(0);
}

test();
