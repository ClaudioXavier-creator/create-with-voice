import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: string[];
  userType: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  userType: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccessContext = useCallback(async (userId?: string) => {
    if (!userId) {
      setRoles([]);
      setUserType(null);
      return;
    }

    try {
      const [{ data: rolesData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("tipo_usuario").eq("user_id", userId).maybeSingle(),
      ]);

      setRoles((rolesData ?? []).map((item) => item.role));
      setUserType(profileData?.tipo_usuario ?? null);
    } catch (error) {
      console.error("Erro ao carregar contexto de acesso:", error);
    }
  }, []);

  useEffect(() => {
    // Tenta pegar sessão inicial de forma síncrona se disponível (pode ser null)
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        if (initialSession) {
          await loadAccessContext(initialSession.user.id);
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    void initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        try {
          setSession(newSession);
          if (newSession) {
            setLoading(true);
            await loadAccessContext(newSession.user.id);
          } else {
            setRoles([]);
            setUserType(null);
          }
        } catch (error) {
          console.error("Erro no onAuthStateChange:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadAccessContext]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Limpeza manual para garantir que o estado local seja resetado imediatamente
      setSession(null);
      setRoles([]);
      setUserType(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    roles,
    userType,
    loading,
    signOut
  }), [session, roles, userType, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
