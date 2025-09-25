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
    // Function to create profile after user authentication
    const createProfileAfterAuth = async (user) => {
      try {
        // Check if user profile already exists to avoid duplicates
        // Check for veterinarian profile first
        const { data: vetProfileData, error: vetCheckError } = await supabase
          .from('vet_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!vetCheckError && vetProfileData) {
          // Veterinarian profile already exists, no need to create anything
          return;
        }

        // Check for user profile
        const { data: userProfileData, error: userCheckError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!userCheckError && userProfileData) {
          // User profile already exists, no need to create anything
          return;
        }

        // If no profile exists, create one based on user metadata from registration
        const userRole = user.user_metadata?.role;
        
        if (userRole === 'veterinarian' || userRole === 'pending_veterinarian') {
          // Create veterinarian profile with data from user metadata
          const { error: insertError } = await supabase
            .from('vet_profiles')
            .upsert([{
              id: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Veterinarian',
              license_number: user.user_metadata?.license_number,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }], {
              onConflict: 'id'
            });
          
          if (insertError) {
            console.error('Error creating/updating veterinarian profile:', insertError);
          } else {
            console.log('Veterinarian profile created/updated successfully');
          }
        } else {
          // Create user profile with data from user metadata
          const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert([{
              id: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pet Owner',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }], {
              onConflict: 'id'
            });
          
          if (insertError) {
            console.error('Error creating/updating user profile:', insertError);
          } else {
            console.log('User profile created/updated successfully');
          }
        }
      } catch (error) {
        console.error('Error in createProfileAfterAuth:', error);
      }
    };

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
      
      // Create profile if user doesn't have one, using data from registration
      if (session?.user) {
        await createProfileAfterAuth(session.user);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Initialize notifications when user signs in
      if (session?.user && !initialized) {
        setInitialized(true);
        notificationService.initialize();
      }
      
      // Create profile if user doesn't have one, using data from registration
      if (session?.user) {
        await createProfileAfterAuth(session.user);
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
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) throw new Error("Email is required");
  
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error(`"${trimmedEmail}" is not a valid email address`);
    }
  
    // ✅ Redirect user to your frontend reset page
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