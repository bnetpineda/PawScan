import { Buffer } from "buffer"; // Ensure you have buffer polyfill for React Native
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import OpenAI from "openai";
import { supabase } from "../lib/supabase"; // Adjust the import path as needed

global.Buffer = Buffer; // Set global Buffer for React Native

// Cache for OpenAI client
let openaiClient = null;

// Helper to get OpenAI client instance
function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not set in environment variables");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Helper for exponential backoff retry logic
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) or auth errors
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Calculate delay with exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Helper to optimize image before upload (resize to 1024px max dimension)
async function optimizeImage(imageUri) {
  try {
    console.log("Optimizing image...");
    
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }], // Resize to max 1024px width (maintains aspect ratio)
      { 
        compress: 0.8, // 80% quality - good balance between quality and size
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    
    console.log("Image optimized:", manipulatedImage.uri);
    return manipulatedImage.uri;
  } catch (error) {
    console.warn("Image optimization failed, using original:", error);
    return imageUri; // Fallback to original if optimization fails
  }
}

// Helper to upload image to Supabase Storage and return the public URL
async function uploadImageToSupabase(imageUri, userId) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("Authenticated user:", user?.id);

    if (authError) {
      console.error("Authentication error:", authError);
      throw new Error("Authentication failed");
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    const actualUserId = user.id;

    if (!imageUri || !actualUserId) {
      throw new Error("Image URI and authentication required");
    }

    // Validate image URI format
    if (!imageUri.startsWith('file://') && !imageUri.startsWith('data:')) {
      throw new Error("Invalid image URI format");
    }

    // Optimize image before upload
    const optimizedUri = await optimizeImage(imageUri);

    const imageExt = "jpg"; // Always JPG after optimization
    const fileName = `${actualUserId}/${Date.now()}.${imageExt}`;
    console.log("Upload path:", fileName);

    const fileData = await FileSystem.readAsStringAsync(optimizedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Validate file data
    if (!fileData) {
      throw new Error("Failed to read image data");
    }
    
    const fileBuffer = Buffer.from(fileData, "base64");
    const contentType = "image/jpeg";

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

// Helper function to share analysis to newsfeed
export async function shareToNewsfeed(
  analysisId,
  petName = null,
  isAnonymous = false
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Authentication error:", authError);
      throw new Error("Authentication failed");
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the analysis record
    const { data: analysisData, error: analysisError } = await supabase
      .from("analysis_history")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single();

    if (analysisError || !analysisData) {
      throw new Error("Analysis not found or access denied");
    }

    // Validate that this is a proper pet analysis using regex pattern matching
    const analysisResult = analysisData.analysis_result;
    
    // Quick check for invalid analysis message
    if (/unable to analyze.*does not contain a cat or dog/i.test(analysisResult)) {
      throw new Error("Only valid pet analyses can be shared. This analysis doesn't appear to be of a cat or dog.");
    }
    
    // Use comprehensive regex to validate required format (matches at least 6 of 8 sections)
    const validFormatPattern = /(?=.*Breed of the pet)(?=.*Specific Skin Disease Detected)(?=.*Confidence score)(?=.*suggested treatments)(?=.*Urgency level)(?=.*first aid care steps)/is;
    
    if (!validFormatPattern.test(analysisResult)) {
      throw new Error("Only valid pet analyses can be shared. This analysis doesn't have the required format.");
    }

    // Create newsfeed post
    let displayName = isAnonymous 
      ? "Anonymous"
      : user.user_metadata?.full_name || 
        user.user_metadata?.display_name || 
        user.email?.split("@")[0] || 
        "Pet Owner";
    
    // Determine role and get proper display name based on which profile table the user exists in
    let role = "Pet Owner"; // Default role
    
    // First check if the user exists in vet_profiles table
    const { data: vetProfile, error: vetError } = await supabase
      .from('vet_profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    if (!vetError && vetProfile) {
      // User is a veterinarian
      role = "Veterinarian";
      if (vetProfile.name) {
        displayName = vetProfile.name;
      }
    } else {
      // User is a regular pet owner, check user_profiles
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (!userError && userProfile?.name) {
        displayName = userProfile.name;
      }
    }

    const { data: postData, error: postError } = await supabase
      .from("newsfeed_posts")
      .insert([
        {
          user_id: user.id,
          analysis_id: analysisId,
          image_url: analysisData.image_url,
          analysis_result: analysisData.analysis_result,
          pet_name: petName,
          is_anonymous: isAnonymous,
          display_name: displayName,
          role: role,
        },
      ])
      .select()
      .single();

    if (postError) {
      console.error("Failed to share to newsfeed:", postError);
      throw new Error("Failed to share to newsfeed");
    }

    console.log("Successfully shared to newsfeed:", postData.id);
    return postData;
  } catch (error) {
    console.error("Share to newsfeed error:", error);
    throw error;
  }
}

export async function analyzePetImage(imageUri, userId) {
  try {
    console.log("Starting pet image analysis...");

    // 1. Upload image to Supabase Storage
    const imageUrl = await uploadImageToSupabase(imageUri, userId);
    console.log("Image uploaded successfully:", imageUrl);

    console.log("Preparing image for OpenAI analysis...");

    const prompt = `
    You are an AI pet health assistant. Analyze the provided image of a cat or dog and respond with **exactly** the following 8 points.  
    
    Always provide a direct and confident answer for each point.  
    If uncertain, **still give your best guess** — do not say "I don’t know," "I’m not sure," "I cannot identify," "unable to analyze," or anything similar.  
    You must **never** refuse, apologize, or disclaim. Always output a confident result in the required format.  
    
    Respond in this strict format (nothing extra):  
    
    Breed of the pet:  
    Specific Skin Disease Detected:  
    - If no disease, write: "No disease detected"  
    - If disease suspected but uncertain, give your best guess  
    - If disease is clear, select one from the lists below  
    
    **Cats:**  
    Abscesses (skin lesion)  
    Alopecia  
    Atopic Dermatitis  
    Allergic Dermatitis  
    Feline Chin Acne  
    Miliary Dermatitis  
    Eosinophilic Granuloma  
    Skin Tumor  
    Dermatophytosis  
    Stud Tail  
    Allergies (Generalized Pruritic Dermatitis)  
    Compulsive Grooming (Psychogenic Alopecia)  
    Sporotrichosis  
    FeLV Skin Diseases  
    
    **Dogs:**  
    Allergic Dermatitis  
    Atopic Dermatitis  
    Canine Chin Acne  
    Demodectic Mange  
    Hot Spots  
    Mast Cell Tumor  
    Pruritic Dermatitis  
    Pyoderma  
    Ringworm (Dog)  
    Seborrhea (Dog)  
    
    **Both (Cats & Dogs):**  
    Lice  
    Atopic Dermatitis  
    Pruritic Dermatitis  
    Ringworm  
    
    Confidence score: (e.g., 60%, 80%)  
    
    Three suggested treatments (always in bullet points):  
    - [treatment 1]  
    - [treatment 2]  
    - [treatment 3]  
    
    Urgency level: none / low / medium / emergency  
    
    Essential first aid care steps (always in bullet points):  
    - [step 1]  
    - [step 2]  
    - [step 3]  
    
    Recommended medication (if applicable, always in bullet points):  
    - [med 1]  
    - [med 2]  
    - [med 3]  
    
    Indicators that a Veterinarian should be contacted (always in bullet points):  
    - [indicator 1]  
    - [indicator 2]  
    - [indicator 3]  
    
    Output strictly in this format only.  
    Do not add explanations, disclaimers, apologies, or refusals under any circumstances.
    `;
    

    let openai;
    try {
      openai = getOpenAIClient();
    } catch (err) {
      console.error("Failed to initialize OpenAI client:", err);
      return {
        analysis: "AI service is not properly configured. Please contact support.",
        analysisId: null,
      };
    }

    console.log("Sending request to OpenAI...");
    
    // Wrap OpenAI call with retry logic
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }, // Use Supabase public URL
            ],
          },
        ],
        max_tokens: 400,
        temperature: 0.5,
      });
    }, 3, 1000); // 3 retries with 1s base delay

    const analysisResult =
      response.choices[0]?.message?.content || "No analysis result returned.";
    console.log("OpenAI analysis completed");

    // 3. Save to Supabase (with the Supabase imageUrl for storage reference)
    const { data: analysisData, error } = await supabase
      .from("analysis_history")
      .insert([
        {
          user_id: userId,
          image_url: imageUrl, // Store the Supabase URL for reference
          analysis_result: analysisResult,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert failed:", error.message);
      // Don't throw here, still return the analysis
      return {
        analysis: analysisResult,
        analysisId: null,
      };
    } else {
      console.log("Analysis saved to database");
      return {
        analysis: analysisResult,
        analysisId: analysisData.id,
      };
    }
  } catch (err) {
    console.error("Image analysis failed:", err);

    // Enhanced error handling with error codes
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = "Image analysis failed. Please try again.";

    // OpenAI API errors
    if (err.status === 401) {
      errorCode = "AUTH_ERROR";
      errorMessage = "AI service authentication failed. Please contact support.";
    } else if (err.status === 429) {
      errorCode = "RATE_LIMIT";
      errorMessage = "Too many requests. Please try again in a few moments.";
    } else if (err.status >= 500) {
      errorCode = "SERVER_ERROR";
      errorMessage = "AI service is temporarily unavailable. Please try again later.";
    } else if (err.message?.includes("API key")) {
      errorCode = "CONFIG_ERROR";
      errorMessage = "AI service is not properly configured. Please contact support.";
    } else if (err.message?.includes("upload") || err.message?.includes("Storage")) {
      errorCode = "UPLOAD_ERROR";
      errorMessage = "Image upload failed. Please check your connection and try again.";
    } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
      errorCode = "NETWORK_ERROR";
      errorMessage = "Network error. Please check your connection and try again.";
    } else if (err.message?.includes("Authentication")) {
      errorCode = "USER_AUTH_ERROR";
      errorMessage = "User authentication failed. Please sign in again.";
    } else if (err.message?.includes("optimize") || err.message?.includes("image")) {
      errorCode = "IMAGE_PROCESSING_ERROR";
      errorMessage = "Failed to process image. Please try a different image.";
    }

    return {
      analysis: errorMessage,
      analysisId: null,
      errorCode, // Include error code for client-side handling
    };
  }
}
