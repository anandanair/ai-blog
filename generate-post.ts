import fs from "fs";
import path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
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

function generateFileName(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "") + `.md`
  );
}

async function main() {
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

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  const text = response.text ?? "";

  // More flexible parsing regex
  const titleMatch = text.match(/TITLE:\s*(.*?)(?=\n|$)/);
  const descMatch = text.match(/DESCRIPTION:\s*(.*?)(?=\n|$)/);
  const imageDescMatch = text.match(/IMAGE_DESCRIPTION:\s*(.*?)(?=\n|$)/);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]*$)/);

  if (!titleMatch || !descMatch || !imageDescMatch || !contentMatch) {
    console.error("Failed to parse Gemini response");
    return;
  }

  const title = titleMatch[1].trim();
  const description = descMatch[1].trim();
  const imageDescription = imageDescMatch[1].trim();
  const content = contentMatch[1].trim();

  // Define directory paths
  const postsDir = path.join(process.cwd(), "posts"); // Use process.cwd() for consistency
  const publicDir = path.join(process.cwd(), "public"); // Define public directory
  const imagesDir = path.join(publicDir, "images"); // Images should go inside public/images

  // Ensure posts directory exists
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true }); // Add recursive just in case
    console.log(`✅ Created directory: ${postsDir}`);
  }

  // Ensure public/images directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true }); // Use recursive to create public and images if needed
    console.log(`✅ Created directory: ${imagesDir}`);
  }

  const fileName = generateFileName(title);
  const imageFileName = fileName.replace(".md", ".png");
  const filePath = path.join(postsDir, fileName);
  const imagePath = path.join(imagesDir, imageFileName); // Correct image path for saving

  // Generate image
  const imageResponse = await genAI.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: `Generate an image for: ${imageDescription}`,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  // Generate and save image with error handling
  let imageGenerated = false; // Flag to track if image was saved
  try { // Add try-catch for image generation/saving
    const imageResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation", // Ensure this model is available/correct
      contents: `Generate an image for: ${imageDescription}`,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    for (const part of imageResponse.candidates?.[0].content?.parts ?? []) {
      if (part.text) {
        console.log(`Image generation model text response: ${part.text}`); // Log any text part from image generation
      } else if (part.inlineData) {
        const imageData = part.inlineData.data ?? "";
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(imagePath, buffer); // Save to public/images/imageFileName.png
        console.log(`✅ Generated image: ${imagePath}`);
        imageGenerated = true; // Set flag to true
        break; // Exit loop once image is saved
      }
    }
  } catch (error) {
    console.error("❌ Error during image generation or saving:", error);
  }


  if (!imageGenerated) {
    console.warn("⚠️ Failed to generate or save image. Skipping image inclusion in post.");
  }

  // Include image path in markdown frontmatter only if generated
  // The path used here ("/images/...") is correct for web access via the public dir
  const markdown = `---
title: "${title}"
date: "${dateStr}"
description: "${description}"
${imageGenerated ? `image: "/images/${imageFileName}"` : ""} 
---

${
  imageGenerated ? `![${title}](/images/${imageFileName})\n\n` : "" // Path is correct for web access
}${content.trim()}
`;

  fs.writeFileSync(filePath, markdown);
  console.log(`✅ Generated blog post: ${filePath}`);
}

main().catch(console.error); // Added catch for the main async function
