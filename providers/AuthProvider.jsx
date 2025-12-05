// providers/AuthProvider.jsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

// Environment-based configuration
const CONFIG = {
  EMAIL_REDIRECT_URL: process.env.EXPO_PUBLIC_EMAIL_REDIRECT_URL || 'https://pawscan-dashboard.vercel.app/confirm-email',
  PASSWORD_RESET_URL: process.env.EXPO_PUBLIC_PASSWORD_RESET_URL || 'https://pawscan-dashboard.vercel.app/reset-password',
  IS_DEV: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
};

// Conditional logging utility
const log = {
  info: (...args) => CONFIG.IS_DEV && console.log(...args),
  error: (...args) => console.error(...args),
};

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
 * @param {object} user - The Supabase user object.
 */
const createProfileAfterAuth = async (user) => {
  try {
    const userData = user.user_metadata?.options?.data || {};
    const userRole = userData.role;
    const isVet = userRole === ROLES.VETERINARIAN || userRole === ROLES.PENDING_VETERINARIAN;

    const tableName = isVet ? TABLE_NAMES.VET_PROFILES : TABLE_NAMES.USER_PROFILES;
    const fullName = userData.full_name;
    
    const profileData = {
      id: user.id,
      name: fullName || user.email?.split('@')[0] || (isVet ? 'Veterinarian' : 'Pet Owner'),
      updated_at: new Date().toISOString(),
    };

    if (isVet) {
      profileData.license_number = userData.license_number;
    }

    log.info('Creating/updating profile:', { userId: user.id, role: userRole, tableName });

    const { error } = await supabase
      .from(tableName)
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      log.error(`Error upserting ${isVet ? 'veterinarian' : 'user'} profile:`, error);
    } else {
      log.info(`Successfully created/updated profile for user:`, user.id);
    }
  } catch (error) {
    log.error('Error in createProfileAfterAuth:', error);
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isGoogleSigningInRef = useRef(false);

  // Google Sign In using native Google Sign-In + Supabase
  const signInWithGoogle = useCallback(async () => {
    try {
      isGoogleSigningInRef.current = true;
      log.info("Starting native Google Sign-In...");
      
      // Check if user is already signed in with Google
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      log.info("Google Sign-In successful:", userInfo.data?.user?.email);
      
      // Get the ID token
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error("No ID token received from Google");
      }
      
      log.info("Got Google ID token, signing into Supabase...");
      
      // Sign in to Supabase with the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) throw error;
      
      log.info("Supabase sign-in successful:", data.user?.email);
      
      // Manually update state immediately to avoid race condition
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      return { data, error: null };
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error("Google Sign-In was cancelled.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Google Sign-In is already in progress.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services is not available.");
      }
      log.error("Google sign-in error:", error);
      throw error;
    } finally {
      isGoogleSigningInRef.current = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        log.info('Initial session loaded:', session?.user?.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log.info('Auth state change:', event, session?.user?.email);
      
      if (!isMounted) return;
      
      // Skip if we're in the middle of Google sign-in (we handle state manually)
      // This prevents race conditions with the manual state update
      if (isGoogleSigningInRef.current && event === 'SIGNED_IN') {
        log.info('Skipping onAuthStateChange during Google sign-in (handled manually)');
        return;
      }
      
      // Check if user is pending veterinarian and sign them out
      const userData = session?.user?.user_metadata?.options?.data || {};
      const userRole = userData.role;
      if (userRole === ROLES.PENDING_VETERINARIAN && event !== 'SIGNED_OUT') {
        log.info('Pending veterinarian detected, signing out');
        await supabase.auth.signOut();
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'TOKEN_REFRESHED') {
        log.info('Token refreshed successfully');
      }
      
      // Only create/update profile on sign-in and initial session events
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        await createProfileAfterAuth(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
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
            emailRedirectTo: CONFIG.EMAIL_REDIRECT_URL,
          }
        });
        throw new Error(
          "Email not confirmed. A new confirmation email has been sent."
        );
      }
      throw error;
    }

    // Check if user is a pending veterinarian
    const userData = data.user?.user_metadata?.options?.data || {};
    const userRole = userData.role;
    if (userRole === ROLES.PENDING_VETERINARIAN) {
      await supabase.auth.signOut();
      throw new Error(
        "Your veterinarian account is pending verification by an administrator. You will receive an email once verified."
      );
    }

    return { data, error };
  }, []);

  const signUpWithEmail = useCallback(async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: CONFIG.EMAIL_REDIRECT_URL,
        data: userData,
      },
    });

    if (error) throw error;
    return { data, error };
  }, []);

  const resetPassword = useCallback(async (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) throw new Error("Email is required");
  
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error(`"${trimmedEmail}" is not a valid email address`);
    }
  
    return await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: CONFIG.PASSWORD_RESET_URL,
    });
  }, []);
  

  const logout = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        log.info("No active session, clearing local state");
        setSession(null);
        setUser(null);
        return;
      }

      log.info("Logging out user:", currentSession.user?.email);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If error is about missing session, just clear local state
        if (error.message.toLowerCase().includes('session')) {
          log.info("Session already expired, clearing local state");
          setSession(null);
          setUser(null);
          return;
        }
        throw error;
      }
      
      log.info("User logged out successfully");
    } catch (error) {
      log.error("Logout error:", error.message);
      // Even if there's an error, clear local state
      setSession(null);
      setUser(null);
      throw error;
    }
  }, []);

  const contextValue = useMemo(() => ({
    session,
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    logout,
  }), [session, user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
