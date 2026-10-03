import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublication() {
  // Login first
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'gokkull04@gmail.com', // user from screenshot
    password: 'password' // guess or create a new user
  });
  
  if (authErr) {
    // If login fails, create a new test user
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: 'test_realtime@example.com',
      password: 'password123'
    });
    if (signUpErr) { console.error('Auth error:', signUpErr); process.exit(1); }
  }

  console.log('Testing realtime...');
  
  const channel = supabase.channel('test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
      console.log('Got message:', payload);
    })
    .subscribe((status) => {
      console.log('Status:', status);
    });

  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Inserting message...');
  // Find a group I'm in
  const { data: groups } = await supabase.from('groups').select('id').limit(1);
  
  let groupId;
  if (!groups || groups.length === 0) {
    console.log('Creating a group...');
    const { data: newGroup, error: grpErr } = await supabase.from('groups').insert({ name: 'Test Group' }).select().single();
    if (grpErr) { console.error('Group create error:', grpErr); process.exit(1); }
    groupId = newGroup.id;
  } else {
    groupId = groups[0].id;
  }
  
  const { data: msg, error: insErr } = await supabase.from('messages').insert({
    group_id: groupId,
    body: 'Test Realtime publication',
  }).select().single();
  
  if (insErr) { console.error('Insert error:', insErr); }
  else { console.log('Inserted:', msg.id); }
  
  await new Promise(r => setTimeout(r, 5000));
  process.exit(0);
}

checkPublication();
