import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialized clients to avoid build-time errors
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Supabase client for browser (uses anon key)
export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    _supabase = createClient(url, key);
  }
  return _supabase;
};

// Supabase admin client for server-side operations (uses service key)
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase admin environment variables');
    }
    
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
};

// Legacy exports for backward compatibility (lazy initialized)
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const client = getSupabase();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Storage helper functions
export const storage = {
  screenshots: {
    upload: async (executionId: string, filename: string, buffer: Buffer) => {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.storage
        .from('screenshots')
        .upload(`${executionId}/${filename}`, buffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) throw error;
      return data;
    },
    
    getPublicUrl: (path: string) => {
      const admin = getSupabaseAdmin();
      const { data } = admin.storage
        .from('screenshots')
        .getPublicUrl(path);
      return data.publicUrl;
    },
    
    delete: async (paths: string[]) => {
      const admin = getSupabaseAdmin();
      const { error } = await admin.storage
        .from('screenshots')
        .remove(paths);
      
      if (error) throw error;
    }
  },
  
  videos: {
    upload: async (executionId: string, filename: string, buffer: Buffer) => {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.storage
        .from('videos')
        .upload(`${executionId}/${filename}`, buffer, {
          contentType: 'video/webm',
          upsert: true
        });
      
      if (error) throw error;
      return data;
    },
    
    getPublicUrl: (path: string) => {
      const admin = getSupabaseAdmin();
      const { data } = admin.storage
        .from('videos')
        .getPublicUrl(path);
      return data.publicUrl;
    },
    
    delete: async (paths: string[]) => {
      const admin = getSupabaseAdmin();
      const { error } = await admin.storage
        .from('videos')
        .remove(paths);
      
      if (error) throw error;
    }
  }
};

// Realtime subscription helper
export const subscribeToExecutions = (
  workspaceId: string,
  callback: (payload: any) => void
) => {
  const client = getSupabase();
  return client
    .channel(`executions:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Execution',
        filter: `workspaceId=eq.${workspaceId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToTests = (
  workspaceId: string,
  callback: (payload: any) => void
) => {
  const client = getSupabase();
  return client
    .channel(`tests:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Test',
        filter: `workspaceId=eq.${workspaceId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToScheduledTests = (
  workspaceId: string,
  callback: (payload: any) => void
) => {
  const client = getSupabase();
  return client
    .channel(`scheduled:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ScheduledTest',
        filter: `workspaceId=eq.${workspaceId}`
      },
      callback
    )
    .subscribe();
};

