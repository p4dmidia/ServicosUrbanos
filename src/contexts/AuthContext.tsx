import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'owner' | 'manager' | 'affiliate' | 'customer';
  branch_id?: string;
  commission_rate: number;
  cpf?: string;
  whatsapp?: string;
  description?: string;
  status: 'active' | 'blocked' | 'pending';
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  bank_name?: string;
  bank_agency?: string;
  bank_branch?: string;
  bank_account?: string;
  pix_key?: string;
  rank?: string;
  referred_by?: string;
  referral_code?: string;
  avatar_url?: string;
  store_name?: string;
  cnpj?: string;
  stock_address?: string;
  stock_number?: string;
  stock_neighborhood?: string;
  stock_city?: string;
  stock_state?: string;
  stock_zip_code?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, it might be being created by the trigger
          console.warn('Profile not found, waiting for trigger...');
          return;
        }
        throw error;
      };
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
