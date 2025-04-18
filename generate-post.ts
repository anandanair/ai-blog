import { GoogleGenAI } from "@google/genai"; // Added GenerateContentResponse
import dotenv from "dotenv";
import { initSupabase } from "./utils/database";
import { generateGeneralPost } from "./generators/general-post";
import { generateAiToolPost } from "./generators/tool-post";

// Load environment variables
dotenv.config();

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

async function main() {
  // Initialize clients
  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const supabase = initSupabase();

  console.log("Starting post generation process...");

  // Generate posts
  await generateGeneralPost(genAI, supabase);
  // await generateAiToolPost(genAI, supabase);

  console.log("\n--- Script Finished ---");
}

main().catch(console.error);
