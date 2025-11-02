import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { supabase } from "../lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const validateImage = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      if (fileInfo.size > MAX_FILE_SIZE) {
        throw new Error("Image size must be less than 5MB");
      }

      // Check file extension
      const extension = uri.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
        throw new Error("Invalid image format. Use JPG, PNG, or WebP");
      }

      return true;
    } catch (err) {
      throw err;
    }
  };

  const pickImage = useCallback(async () => {
    try {
      setError(null);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        throw new Error("Camera roll permission is required");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        await validateImage(uri);
        return uri;
      }

      return null;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const uploadImage = useCallback(async (uri, userId, folder = "profile-images") => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      await validateImage(uri);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setProgress(30);

      const buffer = Buffer.from(base64, "base64");
      const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}_${Date.now()}.${extension}`;
      const filePath = `${folder}/${fileName}`;

      setProgress(50);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, buffer, {
          contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProgress(100);
      return publicUrl;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, []);

  const deleteImage = useCallback(async (imageUrl) => {
    try {
      setError(null);
      
      if (!imageUrl) return;

      // Extract file path from URL
      const urlParts = imageUrl.split("/avatars/");
      if (urlParts.length < 2) return;

      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    pickImage,
    uploadImage,
    deleteImage,
    uploading,
    progress,
    error,
  };
};
