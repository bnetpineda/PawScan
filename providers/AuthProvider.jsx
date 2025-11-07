// providers/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // make sure this points to your client
import { Session, User } from "@supabase/supabase-js";

const AuthContext = createContext(null);

// Define constants for roles and table names to avoid magic strings
const ROLES = {
  VETERINARIAN: 'veterinarian',
  PENDING_VETERINARIAN: 'pending_veterinarian',
};

const TABLE_NAMES = {
  VET_PROFILES: 'vet_profiles',
  USER_PROFILES: 'user_profiles',
};

/**
 * Creates or updates a user or vet profile in the database after authentication.
 * This function is designed to be idempotent, using Supabase's `upsert` functionality.
 * It determines the user's role from their metadata and populates the correct table.
 * @param {User} user - The Supabase user object.
 */
const createProfileAfterAuth = async (user) => {
  try {
    const userRole = user.user_metadata?.role;
    const isVet = userRole === ROLES.VETERINARIAN || userRole === ROLES.PENDING_VETERINARIAN;

    const tableName = isVet ? TABLE_NAMES.VET_PROFILES : TABLE_NAMES.USER_PROFILES;
    
    const profileData = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || (isVet ? 'Veterinarian' : 'Pet Owner'),
      updated_at: new Date().toISOString(),
    };

    if (isVet) {
      profileData.license_number = user.user_metadata?.license_number;
    }

    const { error } = await supabase
      .from(tableName)
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.error(`Error upserting ${isVet ? 'veterinarian' : 'user'} profile:`, error);
    } else {
      console.log(`${isVet ? 'Veterinarian' : 'User'} profile handled successfully.`);
    }
  } catch (error) {
    console.error('Error in createProfileAfterAuth:', error);
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // The first event fired is the initial session state.
      // Set loading to false only on this initial check.
      if (isMounted) {
        setLoading(false);
        isMounted = false;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await createProfileAfterAuth(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Email not confirmed") {
        await supabase.auth.resend({
          type: "signup",
          email: email,
          options: {
            emailRedirectTo: 'https://pawscan-dashboard.vercel.app/confirm-email',
          }
        });
        throw new Error(
          "Email not confirmed. A new confirmation email has been sent."
        );
      }
      throw error;
    }

    return { data, error };
  };

  const signUpWithEmail = async (email, password, userData = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://pawscan-dashboard.vercel.app/confirm-email',
        data: userData, // Pass username, role, etc.
      },
    });
  };

  const resetPassword = async (email) => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) throw new Error("Email is required");
  
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error(`"${trimmedEmail}" is not a valid email address`);
    }
  
    // TODO: Move this URL to an environment variable for better configuration.
    const redirectTo = "https://pawscan-dashboard.vercel.app/reset-password";
  
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
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};