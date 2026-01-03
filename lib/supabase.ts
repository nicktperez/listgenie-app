import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  plan: 'free' | 'pro' | 'enterprise';
  usage_count: number;
  last_used: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  style: string;
  features?: string;
  generated_content: {
    listing: string;
    email: string;
    social: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  input: string;
  output: string;
  model: string;
  tokens_used: number;
  cost: number;
  created_at: string;
}

// Create Supabase client
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Database operations with error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleSupabaseError = (error: unknown): never => {
  if (error && typeof error === 'object' && 'code' in error) {
    const errorObj = error as { code: string; message?: string; details?: unknown };
    throw new DatabaseError(
      errorObj.message || 'Database operation failed',
      errorObj.code,
      errorObj.details
    );
  }
  throw new DatabaseError(
    'An unexpected database error occurred',
    'UNKNOWN_ERROR',
    error
  );
};

// User operations
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Listing operations
export const getListings = async (userId: string): Promise<Listing[]> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const createListing = async (listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert([listingData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const deleteListing = async (listingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) throw error;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Generation tracking
export const createGeneration = async (generationData: Omit<Generation, 'id' | 'created_at'>): Promise<Generation> => {
  try {
    const { data, error } = await supabase
      .from('generations')
      .insert([generationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const getUserUsage = async (userId: string): Promise<{ count: number; total_cost: number }> => {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('tokens_used, cost')
      .eq('user_id', userId);

    if (error) throw error;

    const totalCost = data?.reduce((sum, gen) => sum + (gen.cost || 0), 0) || 0;

    return {
      count: data?.length || 0,
      total_cost: totalCost,
    };
  } catch (error) {
    return handleSupabaseError(error);
  }
};
