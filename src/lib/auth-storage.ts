import type { SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Native session storage backed by the Keychain / Android Keystore.
//
// SecureStore can reject values over ~2KB, and a Supabase session (access
// token + refresh token + user object) is usually bigger than that. Rather
// than dropping down to unencrypted AsyncStorage, the value is split into
// chunks and a count key is written last, so a half-finished write reads
// back as "no session" instead of a corrupt one.
const CHUNK_SIZE = 1000;

// SecureStore keys may only contain letters, numbers, ".", "-" and "_".
const toKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

async function readCount(base: string) {
  const raw = await SecureStore.getItemAsync(`${base}.count`);
  const count = Number(raw);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function deleteChunks(base: string, from: number, to: number) {
  for (let i = from; i < to; i++) {
    await SecureStore.deleteItemAsync(`${base}.${i}`);
  }
}

export const authStorage: SupportedStorage | undefined = {
  async getItem(key) {
    const base = toKey(key);
    const count = await readCount(base);
    if (!count) return null;

    let value = '';
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${base}.${i}`);
      if (chunk === null) return null;
      value += chunk;
    }
    return value;
  },

  async setItem(key, value) {
    const base = toKey(key);
    const previous = await readCount(base);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    if (chunks.length === 0) chunks.push('');

    await SecureStore.deleteItemAsync(`${base}.count`);
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${base}.${i}`, chunks[i]);
    }
    await deleteChunks(base, chunks.length, previous);
    await SecureStore.setItemAsync(`${base}.count`, String(chunks.length));
  },

  async removeItem(key) {
    const base = toKey(key);
    const count = await readCount(base);
    await SecureStore.deleteItemAsync(`${base}.count`);
    await deleteChunks(base, 0, count);
  },
};
