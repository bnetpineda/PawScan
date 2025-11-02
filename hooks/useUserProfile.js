import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useUserProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createDefaultProfile = useCallback(async (user) => {
    try {
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: user.id,
            name:
              user?.user_metadata?.options?.data?.display_name ||
              user?.email?.split("@")[0] ||
              "Pet Owner",
            created_at: new Date().toISOString(),
            profile_image_url: null,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // Fetch the newly created profile
      await fetchProfile();
    } catch (err) {
      console.error("Error creating default profile:", err);
      setError(err.message);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Profile doesn't exist, create it
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await createDefaultProfile(user);
          }
        } else {
          throw fetchError;
        }
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, createDefaultProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
  };
};
