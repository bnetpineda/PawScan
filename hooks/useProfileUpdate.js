import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useProfileUpdate = (userId) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = useCallback(async (updates) => {
    try {
      setUpdating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [userId]);

  const updateEmail = useCallback(async (newEmail) => {
    try {
      setUpdating(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      }, {
        emailRedirectTo: 'https://pawscan-dashboard.vercel.app/confirm-email',
      });

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setUpdating(true);
      setError(null);

      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const updateProfileImage = useCallback(async (imageUrl) => {
    try {
      setUpdating(true);
      setError(null);

      const cacheBustedUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          profile_image_url: cacheBustedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [userId]);

  return {
    updateProfile,
    updateEmail,
    updatePassword,
    updateProfileImage,
    updating,
    error,
  };
};
