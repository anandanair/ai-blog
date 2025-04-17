import fs from "fs";
import path from "path";
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai"; // Added GenerateContentResponse
import dotenv from "dotenv";
// Import SupabaseClient type and createClient function directly
import { createClient, SupabaseClient } from "@supabase/supabase-js";
// Remove the import from server.ts
// import { createSupabaseServiceRoleClient } from "@/utils/supabase/server";
dotenv.config();

// Load your Gemini API key from env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Supabase Setup ---
// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate Supabase credentials
if (!SUPABASE_URL) {
  throw new Error("Missing environment variable: SUPABASE_URL");
}
if (!SUPABASE_SERVICE_KEY) {
  throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
}

// Initialize Supabase client directly - NO top-level await needed here
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// --- End Supabase Setup ---

function generateFileName(title: string): string {
  // Added return type
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Allow spaces initially
      .trim() // Trim whitespace
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/--+/g, "-") // Replace multiple hyphens
      .replace(/^-|-$/g, "") + `.md` // Remove leading/trailing hyphens
  );
}

// Add this new function to generate slugs
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove non-alphanumeric characters (except spaces)
    .trim() // Trim leading/trailing whitespace
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
// --- Function to Generate General Post ---
async function generateGeneralPost(
  genAIInstance: GoogleGenAI,
  supabase: SupabaseClient
) {
  // Pass genAI instance
  console.log("\n--- Generating General Post ---");
  const prompt = `
    You are a helpful AI blogger. Write a creative, useful and engaging blog post.
    1. Choose a tech-related or productivity topic yourself.
    2. Generate a catchy title, short description, and the full blog content.
    3. Also provide an image description that represents your blog post's main theme.
    4. Estimate the read time in minutes for your content.
    5. Provide 3-5 relevant tags for the post (single words or short phrases).
    6. Return it in this format:

    TITLE: Your Title Here
    DESCRIPTION: Short 1-liner summary here
    IMAGE_DESCRIPTION: A detailed description for image generation
    READ_TIME: Estimated read time in minutes (just the number)
    TAGS: tag1, tag2, tag3, tag4, tag5
    CONTENT:
    Your markdown content goes here. Add some structure like headings, bullet points, code blocks if needed.
    `;

  try {
    const response = await genAIInstance.models.generateContent({
      model: "gemini-2.0-flash", // Using flash for general post
      contents: prompt,
    });
    await processAndSavePost(supabase, response, "general", null); // Pass type and null category
  } catch (error) {
    console.error("❌ Error generating general post:", error);
  }
}

// --- Function to Generate AI Tool Post ---
async function generateAiToolPost(
  genAIInstance: GoogleGenAI,
  supabase: SupabaseClient
) {
  console.log("\n--- Generating AI Tool of the Day Post ---");

  // Query previously used tools from Supabase instead of using the JSON file
  const { data: previousTools, error: toolsError } = await supabase
    .from("posts")
    .select("tool_name")
    .eq("category", "AI Tool of the Day")
    .not("tool_name", "is", null);

  if (toolsError) {
    console.error("❌ Error fetching previously used tools:", toolsError);
    return;
  }

  // Extract tool names from the query result
  const usedTools = previousTools.map((post) => post.tool_name).filter(Boolean);
  const usedToolsList =
    usedTools.length > 0 ? usedTools.join(", ") : "None yet";

  console.log(`Previously used tools (from database): ${usedToolsList}`);
  const prompt = `
    You are an AI blogger specializing in AI tools. Your goal is to feature a specific "AI Tool of the Day".
    1. Using your knowledge base, select a specific, interesting AI tool (could be for productivity, creativity, development, etc.). Prioritize real tools people can find and use.
    2. **CRITICAL: Do NOT choose any tool from this list of previously featured tools: [${usedToolsList}]**. Pick something new.
    3. Generate a catchy title for the blog post about this tool. The title MUST clearly mention the tool's name.
    4. Write a short, engaging description (1-2 sentences).
    5. Provide a detailed description for generating a relevant image (e.g., the tool's logo, UI, or a conceptual representation).
    6. Estimate the read time in minutes for your content.
    7. Provide 3-5 relevant tags for the post (single words or short phrases).
    8. Explain what the tool does, its key features, potential use cases, and if possible, mention its website or how to find it (do not make up links). Use headings, lists, etc., for structure.
    9. Return the response strictly in this format:

    TOOL_NAME: Name Of The AI Tool Featured
    TITLE: Your Title Here (Must include the tool name)
    DESCRIPTION: Short 1-liner summary here
    IMAGE_DESCRIPTION: A detailed description for image generation
    READ_TIME: Estimated read time in minutes (just the number)
    TAGS: tag1, tag2, tag3, tag4, tag5
    CONTENT:
    Your markdown content goes here. Add some structure like headings, bullet points, code blocks if needed.
    `;

  try {
    const response = await genAIInstance.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    // No need to update the JSON file anymore, just process and save the post
    await processAndSavePost(supabase, response, "tool", "AI Tool of the Day");
  } catch (error) {
    console.error("❌ Error generating AI tool post:", error);
  }
}

// --- Refactored Function to Process Response and Save Post ---
async function processAndSavePost(
  supabase: SupabaseClient,
  response: GenerateContentResponse,
  type: "general" | "tool",
  category: string | null
): Promise<string | null> {
  // Added return type Promise<string | null>

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ""; // Safer access to text

  // Parsing logic - Adjusted for potential TOOL_NAME field
  const toolNameMatch = text.match(/TOOL_NAME:\s*(.*?)(?=\n|$)/);
  const titleMatch = text.match(/TITLE:\s*(.*?)(?=\n|$)/);
  const descMatch = text.match(/DESCRIPTION:\s*(.*?)(?=\n|$)/);
  const imageDescMatch = text.match(/IMAGE_DESCRIPTION:\s*(.*?)(?=\n|$)/);
  const readTimeMatch = text.match(/READ_TIME:\s*(\d+)(?=\n|$)/);
  const tagsMatch = text.match(/TAGS:\s*(.*?)(?=\n|$)/);
  // Adjusted content regex to be less greedy and stop before potential metadata
  const contentMatch = text.match(
    /CONTENT:\s*([\s\S]*?)(?=\n(?:TOOL_NAME:|TITLE:|DESCRIPTION:|IMAGE_DESCRIPTION:|READ_TIME:|TAGS:)|$)/
  );

  // Basic validation
  if (!titleMatch || !descMatch || !imageDescMatch || !contentMatch) {
    console.error(
      "❌ Failed to parse essential fields (Title, Desc, ImageDesc, Content) from Gemini response. Raw text:"
    );
    console.error(text);
    return null; // Indicate failure
  }
  // Specific validation for tool post
  const toolName = type === "tool" ? toolNameMatch?.[1].trim() : null;
  if (type === "tool" && !toolName) {
    console.error(
      "❌ Failed to parse TOOL_NAME field for AI Tool post. Raw text:"
    );
    console.error(text);
    return null; // Indicate failure
  }

  const title = titleMatch[1].trim();
  const description = descMatch[1].trim();
  const imageDescription = imageDescMatch[1].trim();
  let content = contentMatch[1].trim();

  // Parse read time or default to a calculated value if not provided
  let readTime = 3; // Default read time in minutes
  if (readTimeMatch && readTimeMatch[1]) {
    const parsedReadTime = parseInt(readTimeMatch[1], 10);
    if (!isNaN(parsedReadTime) && parsedReadTime > 0) {
      readTime = parsedReadTime;
    } else {
      console.warn("⚠️ Invalid read time provided, using default value.");
    }
  } else {
    console.warn("⚠️ No read time provided, using default value.");
  }

  // Parse tags or use empty array if not provided
  let tags: string[] = [];
  if (tagsMatch && tagsMatch[1]) {
    tags = tagsMatch[1]
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (tags.length > 0) {
      console.log(`✅ Parsed ${tags.length} tags: ${tags.join(", ")}`);
    } else {
      console.warn("⚠️ Tags were provided but none were valid.");
    }
  } else {
    console.warn("⚠️ No tags provided, using empty array.");
  }

  // Clean up the content by removing the title if it appears at the beginning
  // This prevents duplicate titles when displaying the post
  if (content.startsWith(`# ${title}`) || content.startsWith(`## ${title}`)) {
    // Remove the title line and any blank lines that follow
    content = content.replace(
      new RegExp(
        `^(?:#+\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n+)`,
        "i"
      ),
      ""
    );
  }

  // Generate the slug from the title
  const slug = generateSlug(title);

  // --- Image Generation ---
  let publicImageUrl: string | null = null;
  const baseImageFileName = generateFileName(title); // Generate a base name from title
  const imageFileName = `${baseImageFileName}-${Date.now()}.png`; // Add timestamp for uniqueness
  const imageBucket = "blogs"; // *** Your bucket name ***
  // Define the full path within the bucket, including the filename
  const imagePathInBucket = `${imageFileName}`; // Use just the filename as the path within the bucket

  if (imageDescription) {
    // Only try if description exists
    console.log(`⏳ Generating image for: "${imageDescription}"`);
    try {
      const imageGenResponse = await genAI.models.generateContent({
        // Use the global genAI instance
        model: "gemini-2.0-flash-exp-image-generation", // Or your preferred image model
        contents: `Generate an image for: ${imageDescription}`,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Extract and save image data (using safer access)
      const imagePart = imageGenResponse.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData
      );
      if (imagePart?.inlineData?.data) {
        const imageData = imagePart.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        // Use the correct path for uploading
        console.log(
          `⏳ Uploading image to Supabase Storage: ${imageBucket}/${imagePathInBucket}`
        );

        // Upload to Supabase Storage using the bucket name and the desired path/filename
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(imageBucket) // Specify the bucket
          .upload(imagePathInBucket, buffer, {
            // Specify the path/filename within the bucket
            contentType: "image/png",
            upsert: true, // Overwrite if exists (optional)
          });

        if (uploadError) {
          throw uploadError; // Throw error to be caught below
        }

        // Get public URL using the correct path/filename
        const { data: urlData } = supabase.storage
          .from(imageBucket) // Specify the bucket
          .getPublicUrl(imagePathInBucket); // Specify the path/filename within the bucket

        if (urlData?.publicUrl) {
          publicImageUrl = urlData.publicUrl;
          console.log(`✅ Image uploaded: ${publicImageUrl}`);
        } else {
          console.warn("⚠️ Could not get public URL for the uploaded image.");
        }
      } else {
        console.warn(
          "⚠️ Image generation response did not contain image data."
        );
        // Log text response if available
        const textPart = imageGenResponse.candidates?.[0]?.content?.parts?.find(
          (part) => part.text
        );
        if (textPart?.text) {
          console.log(`Image generation model text response: ${textPart.text}`);
        }
      }
    } catch (error) {
      console.error("❌ Error during image generation or saving:", error);
    }
  } else {
    console.warn(
      "⚠️ No image description provided. Skipping image generation."
    );
  }

  // --- Save Post to Supabase Database ---
  console.log(
    `⏳ Saving post "${title}" (slug: ${slug}) to Supabase database...`
  ); // Log slug too
  try {
    // Add the 'slug' field to the insert object
    // 'status' will default to 'draft' in the database
    const { data, error } = await supabase
      .from("posts") // Your table name
      .insert([
        {
          title: title,
          slug: slug, // Add the generated slug here
          description: description,
          content: content,
          category: category,
          image_url: publicImageUrl,
          tool_name: toolName,
          author: "Gemini", // Add the author field (model name)
          read_time: readTime, // Add the read time from the AI model
          tags: tags, // Add the parsed tags array
          status: "published", // Optionally set status here if you don't want the default 'draft'
          // published_at: new Date().toISOString(), // Optionally set publish time
        },
      ])
      .select(); // Optionally select the inserted data

    if (error) {
      // Check for unique constraint violation on slug specifically
      if (error.code === "23505" && error.message.includes("posts_slug_key")) {
        console.error(
          `❌ Error saving post: Slug "${slug}" already exists. Post "${title}" not saved.`
        );
        // Decide how to handle duplicate slugs (e.g., skip, retry with modified slug)
        return null; // Indicate failure due to duplicate slug
      }
      throw error; // Throw other errors
    }

    console.log(`✅ Post saved successfully to Supabase.`);
    if (data) {
      // console.log("Inserted data:", data); // Optional: log inserted data
    }
  } catch (error) {
    // Catch block might need adjustment based on the error handling above
    console.error(`❌ Error saving post "${title}" to Supabase:`, error);
    return null; // Indicate failure if database insert fails
  }

  // Return the tool name if it was a tool post and successfully processed
  if (type === "tool" && toolName) {
    console.log(`✅ Successfully generated post for AI tool: "${toolName}"`);
  }
  return toolName ?? null;
}

// --- Main Execution ---
async function main() {
  // Supabase client (supabaseAdmin) is already initialized above
  const genAIInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // No need to load used tools from JSON file anymore
  console.log("Fetching AI tool data from Supabase...");

  // Generate both posts, passing the initialized Supabase client
  await generateGeneralPost(genAIInstance, supabaseAdmin);
  await generateAiToolPost(genAIInstance, supabaseAdmin);

  console.log("\n--- Script Finished ---");
}

main().catch(console.error);
