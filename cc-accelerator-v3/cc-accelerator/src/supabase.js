import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/*
 * Simple key-value database layer.
 * With Supabase: stores in cc_store table (persists everywhere).
 * Without Supabase: falls back to localStorage (browser-only).
 *
 * Keys used:
 *   "clients"  → array of all client objects
 *   "users"    → array of all user account objects
 */

export const db = {
  async get(key) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cc_store')
          .select('value')
          .eq('key', key)
          .single();
        if (error || !data) return null;
        return data.value;
      } catch {
        return null;
      }
    }
    // localStorage fallback
    try {
      const v = localStorage.getItem('cc_' + key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('cc_store')
          .upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) {
          console.error('Supabase write error:', error);
          // Fallback to localStorage on error
          localStorage.setItem('cc_' + key, JSON.stringify(value));
        }
      } catch (e) {
        console.error('Supabase connection error:', e);
        localStorage.setItem('cc_' + key, JSON.stringify(value));
      }
    } else {
      localStorage.setItem('cc_' + key, JSON.stringify(value));
    }
  },

  // Convenience: get array, push item, save
  async addToArray(key, item) {
    const arr = (await this.get(key)) || [];
    arr.push(item);
    await this.set(key, arr);
    return arr;
  },

  // Convenience: update an item in an array by id
  async updateInArray(key, id, updates) {
    const arr = (await this.get(key)) || [];
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...updates };
      await this.set(key, arr);
    }
    return arr;
  },

  isConnected() {
    return !!supabase;
  }
};
