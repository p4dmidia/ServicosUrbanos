import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { businessRules } from '../lib/businessRules';

interface Profile {
  id: string;
  full_name: string;
  email?: string;
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
  isMerchantAuthorized: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMerchantAuthorized, setIsMerchantAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setIsMerchantAuthorized(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
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

      if (data) {
        let userEmail = email || data.email;
        if (!userEmail) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          userEmail = authUser?.email;
        }
        const isAuth = await businessRules.checkMerchantAccess(data.id, userEmail);
        setIsMerchantAuthorized(isAuth);
      } else {
        setIsMerchantAuthorized(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsMerchantAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (userId?: string) => {
    const targetId = userId || user?.id || (await supabase.auth.getUser()).data.user?.id;
    if (targetId) {
      const authUser = (await supabase.auth.getUser()).data.user;
      await fetchProfile(targetId, authUser?.email);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsMerchantAuthorized(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isMerchantAuthorized, signOut, refreshProfile }}>
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
