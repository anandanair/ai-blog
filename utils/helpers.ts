import { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI, Modality } from "@google/genai";

// String manipulation utilities
export function generateFileName(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "") + `.md`
  );
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

// Image generation utility
export async function generateAndUploadImage(
  genAI: GoogleGenAI,
  supabase: SupabaseClient,
  imageDescription: string,
  title: string
): Promise<string | null> {
  let publicImageUrl: string | null = null;
  const baseImageFileName = generateFileName(title);
  const imageFileName = `${baseImageFileName}-${Date.now()}.png`;
  const imageBucket = "blogs";
  const imagePathInBucket = `${imageFileName}`;

  if (!imageDescription) {
    console.warn(
      "⚠️ No image description provided. Skipping image generation."
    );
    return null;
  }

  console.log(`⏳ Generating image`);
  // console.log(`⏳ Generating image for: "${imageDescription}"`);
  try {
    const imageGenResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: `Generate an image for: ${imageDescription}`,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const imagePart = imageGenResponse.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    );
    if (imagePart?.inlineData?.data) {
      const imageData = imagePart.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");

      console.log(
        `⏳ Uploading image to Supabase Storage: ${imageBucket}/${imagePathInBucket}`
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(imageBucket)
        .upload(imagePathInBucket, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from(imageBucket)
        .getPublicUrl(imagePathInBucket);

      if (urlData?.publicUrl) {
        publicImageUrl = urlData.publicUrl;
        console.log(`✅ Image uploaded: ${publicImageUrl}`);
      } else {
        console.warn("⚠️ Could not get public URL for the uploaded image.");
      }
    } else {
      console.warn("⚠️ Image generation response did not contain image data.");
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

  return publicImageUrl;
}

// Response parsing utility
export function parsePostResponse(text: string, type: "general" | "tool") {
  const toolNameMatch = text.match(/TOOL_NAME:\s*(.*?)(?=\n|$)/);
  const titleMatch = text.match(/TITLE:\s*(.*?)(?=\n|$)/);
  const descMatch = text.match(/DESCRIPTION:\s*(.*?)(?=\n|$)/);
  const imageDescMatch = text.match(/IMAGE_DESCRIPTION:\s*(.*?)(?=\n|$)/);
  const readTimeMatch = text.match(/READ_TIME:\s*(\d+)(?=\n|$)/);
  const tagsMatch = text.match(/TAGS:\s*(.*?)(?=\n|$)/);
  const contentMatch = text.match(
    /CONTENT:\s*([\s\S]*?)(?=\n(?:TOOL_NAME:|TITLE:|DESCRIPTION:|IMAGE_DESCRIPTION:|READ_TIME:|TAGS:)|$)/
  );

  // Basic validation
  if (!titleMatch || !descMatch || !imageDescMatch || !contentMatch) {
    console.error(
      "❌ Failed to parse essential fields (Title, Desc, ImageDesc, Content) from Gemini response."
    );
    return null;
  }

  // Specific validation for tool post
  const toolName = (type === "tool" ? toolNameMatch?.[1]?.trim() : null) || "";
  if (type === "tool" && !toolName) {
    console.error("❌ Failed to parse TOOL_NAME field for AI Tool post.");
    return null;
  }

  const title = titleMatch[1].trim();
  const description = descMatch[1].trim();
  const imageDescription = imageDescMatch[1].trim();
  let content = contentMatch[1].trim();

  // Parse read time or default to a calculated value
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

  // Parse tags
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
  if (content.startsWith(`# ${title}`) || content.startsWith(`## ${title}`)) {
    content = content.replace(
      new RegExp(
        `^(?:#+\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n+)`,
        "i"
      ),
      ""
    );
  }

  return {
    toolName,
    title,
    description,
    imageDescription,
    content,
    readTime,
    tags,
    slug: generateSlug(title),
  };
}
