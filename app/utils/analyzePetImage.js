import OpenAI from "openai";
import * as FileSystem from "expo-file-system";
import { supabase } from "../../lib/supabase";

const openai = new OpenAI({
  apiKey:
    "REMOVED_SECRET",
});

export default async function analyzePetImage(imageUri, userId) {
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imageData = `data:image/jpeg;base64,${base64}`;

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData } },
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.8,
    });
    const analysisResult =
      response.choices[0]?.message?.content || "No analysis result returned.";

    // Save to Supabase
    const { error } = await supabase.from("analysis_history").insert([
      {
        user_id: userId,
        image_url: imageUri,
        analysis_result: analysisResult,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Supabase insert failed:", error.message);
    }
    return analysisResult;
  } catch (err) {
    console.error("Image analysis failed:", err);
    return "Image analysis failed.";
  }
}
