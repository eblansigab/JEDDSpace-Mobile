import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Session, User } from "@supabase/supabase-js";

export type EmployeeData = {
  employee_id: string;
  first_name: string | null;
  last_name: string | null;
  registration_status: string | null;
  role: string | null;
  avatar_url: string | null;
  department: string | null;
  position: string | null;
  email: string | null;
  username: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  employee: EmployeeData | null;
  authReady: boolean;
  refreshEmployeeData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  employee: null,
  authReady: false,
  refreshEmployeeData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const fetchEmployeeData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("employee")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setEmployee(data as EmployeeData);
      } else {
        setEmployee(null);
      }
    } catch (err) {
      console.error("[AuthContext] Error fetching employee data:", err);
      setEmployee(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user?.id) {
          await fetchEmployeeData(session.user.id);
        }
      } catch (error) {
        console.error("[AuthContext] Error checking session:", error);
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    void initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (event === "SIGNED_OUT") {
        setEmployee(null);
      } else if (nextSession?.user?.id) {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await fetchEmployeeData(nextSession.user.id);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const refreshEmployeeData = async () => {
    if (user?.id) {
      await fetchEmployeeData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, employee, authReady, refreshEmployeeData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
