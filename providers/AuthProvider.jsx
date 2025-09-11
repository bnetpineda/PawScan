// providers/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // make sure this points to your client
import { Session, User } from "@supabase/supabase-js";
import notificationService from "../services/notificationService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Initialize notifications when user is authenticated
      if (session?.user && !initialized) {
        setInitialized(true);
        notificationService.initialize();
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Initialize notifications when user signs in
      if (session?.user && !initialized) {
        setInitialized(true);
        notificationService.initialize();
      }
      
      // Reset notification service when user logs out
      if (!session?.user) {
        notificationService.reset();
        setInitialized(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      // Clean up notification listeners
      notificationService.removeNotificationListeners();
    };
  }, [initialized]);

  const signInWithEmail = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithEmail = async (email, password, userData = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // Pass username, role, etc.
      },
    });
  };

  const resetPassword = async (email) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      throw new Error("Email is required");
    }
    
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error(`"${trimmedEmail}" is not a valid email address`);
    }

    // Ensure we have a valid redirect URL
    let redirectTo;
    try {
      redirectTo = `${window.location.origin}/reset-password`;
    } catch (error) {
      // Fallback for environments where window.location.origin is not available
      redirectTo = "https://pawscan.app/reset-password"; // Replace with your actual domain
    }
    
    return await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    } else {
      console.log("User logged out successfully");
      // Reset notification service
      notificationService.reset();
      setInitialized(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};