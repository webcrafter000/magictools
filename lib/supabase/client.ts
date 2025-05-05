// lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a single instance of Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const createSchemaClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
};

// Add a function to execute SQL directly
export async function executeSQL(sql: string): Promise<void> {
  // Use service role client for extension-related operations
  if (sql.toLowerCase().includes('create extension')) {
    const schemaClient = createSchemaClient();
    try {
      const { error } = await schemaClient.rpc('execute_sql', { sql });
      if (error) {
        throw new Error(`Failed to execute SQL: ${error.message}`);
      }
    } catch (error) {
      console.error("SQL execution error:", error);
      throw error;
    }
  } else {
    // For other SQL operations, use regular client
    const supabase = createClient();
    try {
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        throw new Error(`Failed to execute SQL: ${error.message}`);
      }
    } catch (error) {
      console.error("SQL execution error:", error);
      throw error;
    }
  }
}