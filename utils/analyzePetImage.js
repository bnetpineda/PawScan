import OpenAI from "openai";
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase"; // Adjust the import path as needed
import { Buffer } from "buffer"; // Ensure you have buffer polyfill for React Native\

global.Buffer = Buffer; // Set global Buffer for React Native

// Helper to upload image to Supabase Storage and return the public URL
async function uploadImageToSupabase(imageUri, userId) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("Authenticated user:", user?.id);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const actualUserId = user.id;

    if (!imageUri || !actualUserId) {
      throw new Error("Image URI and authentication required");
    }

    const imageExt = imageUri.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp", "gif"];

    if (!imageExt || !validExtensions.includes(imageExt)) {
      throw new Error("Invalid image format");
    }

    // ✅ Simpler fileName (requires updated RLS policy)
    const fileName = `${actualUserId}/${Date.now()}.${imageExt}`;
    console.log("Upload path:", fileName);

    const fileData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileBuffer = Buffer.from(fileData, "base64");
    const contentType = `image/${imageExt === "jpg" ? "jpeg" : imageExt}`;

    const { data, error } = await supabase.storage
      .from("pet-images")
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("pet-images")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to retrieve public URL");
    }

    console.log("Upload successful:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export async function analyzePetImage(imageUri, userId) {
  try {
    console.log("Starting pet image analysis...");

    // 1. Upload image to Supabase Storage
    const imageUrl = await uploadImageToSupabase(imageUri, userId);
    console.log("Image uploaded successfully:", imageUrl);

    // 2. Read the original image as base64 for OpenAI
    // This bypasses the URL access issue entirely
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine image format
    const imageExt = imageUri.split(".").pop()?.toLowerCase();
    const mimeType = `image/${imageExt === "jpg" ? "jpeg" : imageExt}`;
    const base64Url = `data:${mimeType};base64,${base64Data}`;

    console.log("Preparing image for OpenAI analysis...");

    const prompt = `
You are a pet health assistant AI. Analyze the provided image of a cat or dog and answer **only** the following points.

Always provide a direct and clear answer for each. If uncertain, **still give your best guess** based on the image — it's okay to be speculative or even incorrect.

**Important: Do NOT say "I don't know", "I'm not sure", or express uncertainty in any form. Just answer confidently.**

1. Breed of the pet  
2. Diseases detected (if any) — guess if unsure  
3. Confidence score (e.g., 60%, 80%)  
4. Three suggested treatments — even speculative ones  
5. Urgency level: low / medium / emergency — choose one  
6. Essential first aid care steps  
7. Recommended medication (if applicable)  
8. Indicators that a veterinarian should be contacted

Respond strictly with just the answers to these points. No explanations, no disclaimers, and no advice to consult a vet. Be direct.
    `;

    const openai = new OpenAI({
      apiKey:
        "REMOVED_SECRET",
    });

    console.log("Sending request to OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: base64Url } }, // Use base64 instead of URL
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const analysisResult =
      response.choices[0]?.message?.content || "No analysis result returned.";
    console.log("OpenAI analysis completed");

    // 3. Save to Supabase (with the Supabase imageUrl for storage reference)
    const { error } = await supabase.from("analysis_history").insert([
      {
        user_id: userId,
        image_url: imageUrl, // Store the Supabase URL for reference
        analysis_result: analysisResult,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Supabase insert failed:", error.message);
      // Don't throw here, still return the analysis
    } else {
      console.log("Analysis saved to database");
    }

    return analysisResult;
  } catch (err) {
    console.error("Image analysis failed:", err);

    // More specific error handling
    if (err.message?.includes("OpenAI")) {
      return "OpenAI analysis failed. Please try again.";
    } else if (err.message?.includes("upload")) {
      return "Image upload failed. Please check your connection.";
    } else {
      return "Image analysis failed. Please try again.";
    }
  }
}
