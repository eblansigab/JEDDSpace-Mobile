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

/**
 * Module-level cache of the resolved employee. Populated by AuthProvider once
 * at sign-in (and on refresh), so non-React services can reuse the same
 * resolution without re-querying the database on every call.
 */
let cachedEmployee: EmployeeData | null = null;

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
        const resolved = data as EmployeeData;
        cachedEmployee = resolved;
        setEmployee(resolved);
      } else {
        cachedEmployee = null;
        setEmployee(null);
      }
    } catch (err) {
      console.error("[AuthContext] Error fetching employee data:", err);
      cachedEmployee = null;
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
        cachedEmployee = null;
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

/**
 * Centralized, cached auth-UUID -> employee resolver.
 *
 * The reaction tables (announcement_reactions, message_reactions) are keyed on
 * employee_id (integer FK -> employee.employee_id), NOT on the Supabase auth
 * user UUID. Every mobile feature that needs employee data must resolve it
 * through this same mapping so identity handling stays consistent with the web.
 *
 * Reuses the same "employee.user_id = auth user id" mapping already used across
 * the app (email.tsx, business-form.tsx, leave-form.tsx, profile.tsx).
 *
 * Resolution is cached: the employee record is loaded once at sign-in (and on
 * TOKEN_REFRESHED / refreshEmployeeData) into AuthContext, so callers here do
 * NOT re-query the database on every reaction toggle or lookup. Only when no
 * cached employee exists (e.g. called before AuthProvider initialized) does it
 * fall back to a single live lookup.
 */
export const getCurrentEmployee = async (): Promise<EmployeeData | null> => {
  if (cachedEmployee) {
    return cachedEmployee;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("employee")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    cachedEmployee = data as EmployeeData;
    return cachedEmployee;
  } catch {
    return null;
  }
};

/**
 * Convenience accessor for just the employee_id. Backed by the same cached
 * resolution as getCurrentEmployee(). Returns null when unauthenticated or the
 * employee record is missing.
 */
export const getCurrentEmployeeId = async (): Promise<string | null> => {
  const employee = await getCurrentEmployee();
  return employee?.employee_id ? String(employee.employee_id) : null;
};
