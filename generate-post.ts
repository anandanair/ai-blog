import fs from "fs";
import path from "path";
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai"; // Added GenerateContentResponse
import dotenv from "dotenv";
dotenv.config();

// Load your Gemini API key from env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
// Get today's date
const today = new Date();
const dateStr = today.toISOString().split("T")[0];
const USED_TOOLS_PATH = path.join(process.cwd(), "used-ai-tools.json"); // Path for tracking used tools

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

// --- Helper Functions for Tool Tracking ---
function loadUsedTools(): string[] {
  try {
    if (fs.existsSync(USED_TOOLS_PATH)) {
      const data = fs.readFileSync(USED_TOOLS_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading used tools file:", error);
  }
  return []; // Return empty array if file doesn't exist or error occurs
}

function saveUsedTools(tools: string[]): void {
  // Added return type
  try {
    fs.writeFileSync(USED_TOOLS_PATH, JSON.stringify(tools, null, 2));
  } catch (error) {
    console.error("Error saving used tools file:", error);
  }
}

// --- Function to Generate General Post ---
async function generateGeneralPost(genAIInstance: GoogleGenAI) {
  // Pass genAI instance
  console.log("\n--- Generating General Post ---");
  const prompt = `
    You are a helpful AI blogger. Write a creative, useful and engaging blog post.
    1. Choose a tech-related or productivity topic yourself.
    2. Generate a catchy title, short description, and the full blog content.
    3. Also provide an image description that represents your blog post's main theme.
    4. Return it in this format:

    TITLE: Your Title Here
    DESCRIPTION: Short 1-liner summary here
    IMAGE_DESCRIPTION: A detailed description for image generation
    CONTENT:
    Your markdown content goes here. Add some structure like headings, bullet points, code blocks if needed.
    `;

  try {
    const response = await genAIInstance.models.generateContent({
      model: "gemini-2.0-flash", // Using flash for general post
      contents: prompt,
    });
    await processAndSavePost(response, "general", null); // Pass type and null category
  } catch (error) {
    console.error("❌ Error generating general post:", error);
  }
}

// --- Function to Generate AI Tool Post ---
async function generateAiToolPost(
  genAIInstance: GoogleGenAI,
  usedTools: string[]
) {
  // Pass genAI and usedTools
  console.log("\n--- Generating AI Tool of the Day Post ---");
  const usedToolsList =
    usedTools.length > 0 ? usedTools.join(", ") : "None yet";
  const prompt = `
    You are an AI blogger specializing in AI tools. Your goal is to feature a specific "AI Tool of the Day".
    1. Using your knowledge base, select a specific, interesting AI tool (could be for productivity, creativity, development, etc.). Prioritize real tools people can find and use.
    2. **CRITICAL: Do NOT choose any tool from this list of previously featured tools: [${usedToolsList}]**. Pick something new.
    3. Generate a catchy title for the blog post about this tool. The title MUST clearly mention the tool's name.
    4. Write a short, engaging description (1-2 sentences).
    5. Provide a detailed description for generating a relevant image (e.g., the tool's logo, UI, or a conceptual representation).
    6. Write the full blog content in markdown format. Explain what the tool does, its key features, potential use cases, and if possible, mention its website or how to find it (do not make up links). Use headings, lists, etc., for structure.
    7. Return the response strictly in this format:

    TOOL_NAME: Name Of The AI Tool Featured
    TITLE: Your Title Here (Must include the tool name)
    DESCRIPTION: Short 1-liner summary here
    IMAGE_DESCRIPTION: A detailed description for image generation
    CONTENT:
    Your markdown content goes here.
    `;
  // NOTE: For true internet search, this is where you'd implement a multi-step process:
  // 1. Ask Gemini for search queries based on the prompt and usedTools.
  // 2. Execute search using an external API (e.g., SerpApi, Google Search API).
  // 3. Feed search results back into a new prompt for Gemini.
  // 4. Ask Gemini to select ONE tool from the results (checking against usedTools again) and generate the post.

  try {
    const response = await genAIInstance.models.generateContent({
      model: "gemini-2.0-flash", // Using Pro potentially gives better adherence to instructions and knowledge
      contents: prompt,
      // Consider adding safetySettings if needed
    });
    const newToolName = await processAndSavePost(
      response,
      "tool",
      "AI Tool of the Day"
    ); // Pass type and category

    // If post generation was successful and we got a tool name, add it to the list
    if (newToolName) {
      usedTools.push(newToolName);
      saveUsedTools(usedTools);
      console.log(`✅ Added "${newToolName}" to used tools list.`);
    }
  } catch (error) {
    console.error("❌ Error generating AI tool post:", error);
  }
}

// --- Refactored Function to Process Response and Save Post ---
// Returns the extracted tool name if applicable, otherwise null
async function processAndSavePost(
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
  // Adjusted content regex to be less greedy and stop before potential metadata
  const contentMatch = text.match(
    /CONTENT:\s*([\s\S]*?)(?=\n(?:TOOL_NAME:|TITLE:|DESCRIPTION:|IMAGE_DESCRIPTION:)|$)/
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
  const content = contentMatch[1].trim();

  // Define directory paths based on type
  const basePostsDir = path.join(process.cwd(), "posts");
  const publicDir = path.join(process.cwd(), "public");
  const imagesDir = path.join(publicDir, "images");
  const outputDir =
    type === "tool"
      ? path.join(basePostsDir, "ai-tools-of-the-day")
      : basePostsDir;

  // Ensure directories exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}`);
  }
  if (!fs.existsSync(imagesDir)) {
    // Ensure images dir exists too
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`✅ Created directory: ${imagesDir}`);
  }

  const fileName = generateFileName(title);
  const imageFileName = fileName.replace(".md", ".png");
  const filePath = path.join(outputDir, fileName);
  const imagePath = path.join(imagesDir, imageFileName);

  // --- Image Generation --- (Moved inside this function)
  let imageGenerated = false;
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
        fs.writeFileSync(imagePath, buffer);
        console.log(`✅ Generated image: ${imagePath}`);
        imageGenerated = true;
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

  if (!imageGenerated) {
    console.warn(
      "⚠️ Failed to generate or save image. Skipping image inclusion in post."
    );
  }

  // --- Generate Markdown ---
  const frontmatter = [
    `title: "${title.replace(/"/g, '\\"')}"`, // Escape quotes in title
    `date: "${dateStr}"`,
    `description: "${description.replace(/"/g, '\\"')}"`, // Escape quotes in description
    category ? `category: "${category}"` : null, // Add category if present
    imageGenerated ? `image: "/images/${imageFileName}"` : null, // Add image if generated
  ]
    .filter(Boolean)
    .join("\n"); // Filter out null lines and join

  const markdown = `---
${frontmatter}
---

${
  imageGenerated
    ? `![${title.replace(/"/g, '\\"')}](/images/${imageFileName})\n\n`
    : ""
}${content}
`;

  fs.writeFileSync(filePath, markdown);
  console.log(`✅ Generated blog post: ${filePath}`);

  return toolName ?? ""; // Return the extracted tool name (or null)
}

// --- Main Execution ---
async function main() {
  const genAIInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); // Create instance once
  const usedTools = loadUsedTools();

  // Generate both posts
  await generateGeneralPost(genAIInstance);
  await generateAiToolPost(genAIInstance, usedTools); // Pass the loaded list

  console.log("\n--- Script Finished ---");
}

main().catch(console.error);
