#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getThinkingBigScience() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .ilike('title', '%thinking big science%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (events && events.length > 0) {
    const event = events[0];
    console.log('🔍 THINKING BIG SCIENCE EVENT DETAILS:');
    console.log('=====================================');
    console.log('Title:', event.title);
    console.log('Description:', event.description);
    console.log('Current Categories:', event.ai_event_types || event.ai_event_type);
    console.log('URL:', event.url);
    console.log('Platform:', event.platform);
    console.log('Location:', event.location);
    console.log('Date:', event.date);
    console.log('Organizer:', event.organizer);
  } else {
    console.log('Event not found');
  }
}

getThinkingBigScience();

