import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const useUserContext = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { session }, error: userError } = await supabase.auth.getSession();
        
        if (userError) {
          throw userError;
        }
        
        if (session?.user) {
          // Get the profile data if available
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
          });
        } else {
          setUser(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error getting user:', err);
        setError((err as Error).message || 'An unexpected error occurred');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getUser();
    
    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          // Don't have full_name or avatar_url until we fetch profile
        });
        
        // Fetch profile data
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile after auth change:', profileError);
            return;
          }
          
          if (profile) {
            setUser(prev => prev ? {
              ...prev,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            } : null);
          }
        } catch (err) {
          console.error('Error fetching profile after auth change:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError((err as Error).message || 'An error occurred while signing out');
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </UserContext.Provider>
  );
} 