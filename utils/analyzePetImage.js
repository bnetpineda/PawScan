import { Buffer } from "buffer"; 
import * as FileSystem from "expo-file-system";
import OpenAI from "openai";
import { supabase } from "../lib/supabase";

global.Buffer = Buffer;

// ✅ Upload image to Supabase Storage
async function uploadImageToSupabase(imageUri, userId) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const imageExt = imageUri.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!imageExt || !validExtensions.includes(imageExt)) {
      throw new Error("Invalid image format");
    }

    const fileName = `${user.id}/${Date.now()}.${imageExt}`;
    const fileData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileBuffer = Buffer.from(fileData, "base64");
    const contentType = `image/${imageExt === "jpg" ? "jpeg" : imageExt}`;

    const { error } = await supabase.storage
      .from("pet-images")
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: publicUrlData } = supabase.storage
      .from("pet-images")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) throw new Error("Failed to retrieve public URL");

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// ✅ Main Pet Image Analysis
export async function analyzePetImage(imageUri, userId) {
  try {
    console.log("Starting pet image analysis...");

    // 1. Upload to Supabase
    const imageUrl = await uploadImageToSupabase(imageUri, userId);
    console.log("Image uploaded:", imageUrl);

    // 2. Convert local file to Base64
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imageExt = imageUri.split(".").pop()?.toLowerCase();
    const mimeType = `image/${imageExt === "jpg" ? "jpeg" : imageExt}`;
    const base64Url = `data:${mimeType};base64,${base64Data}`;

    // 3. JSON schema prompt
    const prompt = `
You are an AI pet health assistant. Analyze the provided image of a cat or dog and return results in strict JSON.

Rules:
- Always provide values for all 8 fields.
- Never say "I don’t know" or "uncertain".
- Do not add extra text outside of JSON.
- Follow this exact schema:

{
  "Breed": "<string>",
  "SkinDisease": "<No disease detected OR a disease from the allowed list>",
  "ConfidenceScore": "<number>%",
  "SuggestedTreatments": ["<treatment1>", "<treatment2>", "<treatment3>"],
  "UrgencyLevel": "<none | low | medium | emergency>",
  "FirstAidSteps": ["<step1>", "<step2>", "<step3>"],
  "RecommendedMedication": ["<med1>", "<med2>", "<med3>"],
  "VetIndicators": ["<indicator1>", "<indicator2>", "<indicator3>"]
}

Example:
{
  "Breed": "Golden Retriever",
  "SkinDisease": "No disease detected",
  "ConfidenceScore": "85%",
  "SuggestedTreatments": ["Regular grooming", "Balanced diet", "Hydration"],
  "UrgencyLevel": "none",
  "FirstAidSteps": ["Brush coat daily", "Check skin weekly", "Provide fresh water"],
  "RecommendedMedication": [],
  "VetIndicators": ["Sudden hair loss", "Open wounds", "Persistent itching"]
}

Now return only the JSON.
`;

    const openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });

    console.log("Sending request to OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: base64Url } },
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.5,
    });

    let analysisResult;
    try {
      analysisResult = JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (err) {
      console.error("JSON parsing failed:", err);
      throw new Error("Invalid AI response format");
    }

    // ✅ Validate required fields
    const requiredKeys = [
      "Breed",
      "SkinDisease",
      "ConfidenceScore",
      "SuggestedTreatments",
      "UrgencyLevel",
      "FirstAidSteps",
      "RecommendedMedication",
      "VetIndicators",
    ];
    const isValid = requiredKeys.every((k) => analysisResult.hasOwnProperty(k));
    if (!isValid) throw new Error("Analysis missing required fields");

    // 4. Save to Supabase (JSON storage)
    const { data: analysisData, error } = await supabase
      .from("analysis_history")
      .insert([
        {
          user_id: userId,
          image_url: imageUrl,
          analysis_result: analysisResult, // 👈 JSON, not string
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert failed:", error.message);
      return { analysis: analysisResult, analysisId: null };
    }

    console.log("Analysis saved to DB:", analysisData.id);
    return { analysis: analysisResult, analysisId: analysisData.id };
  } catch (err) {
    console.error("Image analysis failed:", err);
    return {
      analysis: { error: "Image analysis failed. Please try again." },
      analysisId: null,
    };
  }
}
