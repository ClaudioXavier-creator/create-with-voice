import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";


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

      const userRoles = (rolesData ?? []).map((item) => item.role);
      setRoles(userRoles);
      setUserType(profileData?.tipo_usuario ?? null);

      if (userId) {
        Sentry.setUser({
          id: userId,
          email: session?.user?.email,
          roles: userRoles,
          userType: profileData?.tipo_usuario
        });
      }

    } catch (error) {
      console.error("Erro ao carregar contexto de acesso:", error);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: nunca usar await dentro do callback do onAuthStateChange.
    // Causa deadlock quando o refresh token falha (erro 500), gerando spinner infinito.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          setTimeout(() => {
            loadAccessContext(newSession.user.id).catch((err) =>
              console.error("Erro ao carregar contexto:", err)
            );
          }, 0);
        } else {
          setRoles([]);
          setUserType(null);
        }
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        if (initialSession) {
          loadAccessContext(initialSession.user.id).catch((err) =>
            console.error("Erro ao carregar contexto inicial:", err)
          );
        }
      })
      .catch((error) => console.error("Erro ao inicializar sessão:", error))
      .finally(() => setLoading(false));

    // Failsafe: libera o spinner em 5s caso algo trave
    const failsafe = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
  }, [loadAccessContext]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Limpeza manual para garantir que o estado local seja resetado imediatamente
      setSession(null);
      setRoles([]);
      setUserType(null);
      Sentry.setUser(null);

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
