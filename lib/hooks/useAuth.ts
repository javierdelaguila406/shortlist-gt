import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/lib/auth';

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          setUser(userData as AuthUser);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser(userData as AuthUser);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
