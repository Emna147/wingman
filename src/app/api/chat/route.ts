import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_CHAT_PREAMBLE } from "@/lib/ai/prompts";
import { parseSuggestionFromText } from "@/lib/ai/suggestions";

// Try environment variable first, then fallback to common model names
// Common options: "gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"
const PRIMARY_MODEL = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
// Fallback models to try if primary is overloaded
const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

const getModel = (modelName: string) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: modelName,
    systemInstruction: GEMINI_CHAT_PREAMBLE,
  });
};

interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message.toLowerCase();
      
      // Only retry on 503 (overloaded) or 429 (rate limit) errors
      if (
        (errorMessage.includes("503") || 
         errorMessage.includes("overloaded") ||
         errorMessage.includes("429") ||
         errorMessage.includes("rate limit")) &&
        attempt < maxRetries - 1
      ) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[chat.api] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry for other errors
      throw lastError;
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

// Check if error is retryable (overloaded/rate limit)
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("503") ||
    message.includes("overloaded") ||
    message.includes("429") ||
    message.includes("rate limit")
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const messages: ChatMessagePayload[] | undefined = body?.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing chat messages" }, { status: 400 });
    }

    const history = messages.slice(0, -1).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const latest = messages[messages.length - 1];

    // Try primary model first, then fallbacks if overloaded
    // Remove primary model from fallbacks to avoid duplicates
    const uniqueFallbacks = FALLBACK_MODELS.filter(m => m !== PRIMARY_MODEL);
    const modelsToTry = [PRIMARY_MODEL, ...uniqueFallbacks];
    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[chat.api] Trying model: ${modelName}`);
        const model = getModel(modelName);

        const chat = model.startChat({
          history,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
          },
        });

        // Use retry logic for sending the message
        const response = await retryWithBackoff(async () => {
          return await chat.sendMessage(latest.content);
        });

        const text = response.response.text();
        const suggestion = parseSuggestionFromText(text);

        console.log(`[chat.api] Success with model: ${modelName}`);
        return NextResponse.json({
          message: text,
          suggestion,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`[chat.api] Model ${modelName} failed:`, lastError.message);

        // If it's a retryable error and we have more models to try, continue
        if (isRetryableError(lastError) && modelsToTry.indexOf(modelName) < modelsToTry.length - 1) {
          console.log(`[chat.api] Model ${modelName} is overloaded, trying next fallback...`);
          continue;
        }

        // If it's not a retryable error or it's the last model, break and handle the error
        break;
      }
    }

    // All models failed, return appropriate error
    const message = lastError?.message || "Unknown error";
    console.error("[chat.api] All models failed, last error:", message);

    // Handle specific error types with user-friendly messages
    if (message.includes("not found") || message.includes("404")) {
      return NextResponse.json(
        { 
          error: `Model not found. Please check your GEMINI_API_KEY and GEMINI_MODEL_NAME settings.`,
          details: message 
        },
        { status: 400 }
      );
    }
    
    if (message.includes("503") || message.includes("overloaded")) {
      return NextResponse.json(
        { 
          error: "The AI service is currently busy. We've tried multiple models and they're all overloaded. Please try again in a few moments.",
          details: "All available models are temporarily overloaded. Please wait a bit and try again."
        },
        { status: 503 }
      );
    }
    
    if (message.includes("429") || message.includes("rate limit")) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please wait a moment before trying again.",
          details: message 
        },
        { status: 429 }
      );
    }
    
    const status = message.includes("Missing GEMINI_API_KEY") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  } catch (error) {
    console.error("[chat.api] Unexpected error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


