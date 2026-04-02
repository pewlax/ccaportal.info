import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const db = {
  async get(key) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('cc_store').select('value').eq('key', key).single();
        if (error || !data) return null;
        return data.value;
      } catch { return null; }
    }
    try { const v = localStorage.getItem('cc_' + key); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  async set(key, value) {
    if (supabase) {
      try {
        const { error } = await supabase.from('cc_store').upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) localStorage.setItem('cc_' + key, JSON.stringify(value));
      } catch { localStorage.setItem('cc_' + key, JSON.stringify(value)); }
    } else {
      localStorage.setItem('cc_' + key, JSON.stringify(value));
    }
  },
};
