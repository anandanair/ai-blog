import { GoogleGenAI } from "@google/genai";
import { normalizeMarkdown } from "./helpers";
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Validates and corrects markdown formatting, especially for code blocks
 * @param genAI The Google GenAI instance
 * @param content The blog post content to validate
 * @param title The blog post title for context
 * @returns Corrected markdown content
 */
export async function validateAndCorrectMarkdown(
  genAI: GoogleGenAI,
  content: string,
  title: string
): Promise<string> {
  try {
    console.log("Starting multi-model markdown validation process...");

    // Step 1: Initial validation with more capable Gemini model
    let correctedContent = await performGeminiMarkdownValidation(
      genAI,
      content,
      title
    );

    // Step 2: Secondary validation with Groq's Llama model
    correctedContent = await performGroqLlamaValidation(
      correctedContent,
      title
    );

    // Step 3: Apply minimal programmatic fixes for critical issues
    correctedContent = applyEssentialProgrammaticFixes(correctedContent);

    console.log("✅ Multi-model markdown validation completed");
    return correctedContent;
  } catch (error) {
    console.error("❌ Error in markdown validation process:", error);
    // Return original content if validation fails
    return content;
  }
}

/**
 * Performs initial markdown validation using Gemini
 */
async function performGeminiMarkdownValidation(
  genAI: GoogleGenAI,
  content: string,
  title: string
): Promise<string> {
  console.log("Performing Gemini markdown validation...");

  const validationPrompt = `
    You are an expert in markdown formatting and React-compatible content. Your task is to validate and correct the markdown in this blog post,
    ensuring it will render perfectly in a React application without hydration errors.
    
    TITLE: ${title}
    
    CONTENT:
    ${content}
    
    Please correct any markdown formatting issues, with special attention to:
    1. Code blocks:
       - Ensure all code blocks use triple backticks with appropriate language identifiers (e.g. \`\`\`javascript)
       - Verify code blocks are properly closed with matching backticks
       - Ensure code inside blocks is syntactically valid for the specified language
       - Remove any HTML comments or special characters that might cause rendering issues
    
    2. Structure:
       - Ensure proper heading hierarchy (h1, h2, h3, etc.) with no skipped levels
       - Add a single space after heading markers (e.g., "# Title" not "#Title")
       - Ensure consistent spacing between sections (one blank line between paragraphs/sections)
    
    3. Lists:
       - Ensure proper indentation for nested lists
       - Add a space after list markers (e.g., "- Item" not "-Item")
       - Maintain consistent list style (don't mix bullet types)
    
    4. Tables:
       - Verify all tables have proper column alignment markers
       - Ensure all rows have the same number of columns
    
    5. Special elements:
       - Remove any HTML tags except those explicitly supported by markdown
       - Ensure blockquotes use proper markdown syntax (> with a space after)
       - DO NOT include any hyperlinks - convert all links to plain text
    
    6. Formatting:
       - Ensure consistent use of emphasis markers (* or _)
       - Properly escape special characters that aren't meant to be markdown syntax
       - Ensure all opening formatting marks have corresponding closing marks
    
    IMPORTANT: 
    - Return ONLY the corrected content in markdown format WITHOUT any code block delimiters around the entire response
    - DO NOT include \`\`\`markdown or \`\`\` around your entire response
    - Just return the raw markdown content directly
    - DO NOT add any explanations or comments about what you fixed
    - Ensure the content will render correctly in a React application
  `;

  try {
    const validationResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      // model: "gemini-2.0-flash",
      contents: validationPrompt,
    });

    let correctedContent =
      validationResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? content;

    // Remove markdown code block delimiters if present around the entire response
    correctedContent = normalizeMarkdown(correctedContent);

    console.log("✅ Gemini markdown validation completed");
    return correctedContent;
  } catch (error) {
    console.error("❌ Error in Gemini markdown validation:", error);
    // Fall back to original content if this step fails
    return content;
  }
}

/**
 * Performs secondary markdown validation using Groq's Llama model
 */
async function performGroqLlamaValidation(
  content: string,
  title: string
): Promise<string> {
  console.log("Performing Llama markdown validation via Groq...");

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const validationPrompt = `
    You are an expert in markdown formatting for React applications. Your task is to validate and correct the markdown in this blog post,
    focusing specifically on ensuring proper code blocks, lists, and formatting.
    
    TITLE: ${title}
    
    CONTENT:
    ${content}
    
    Please correct any markdown formatting issues, with special attention to:
    1. Code blocks - ensure they are properly formatted with language identifiers and closed correctly
    2. Lists - ensure proper spacing and indentation
    3. Headings - ensure proper hierarchy and spacing
    4. Remove any HTML or special characters that might cause React hydration errors
    5. Remove any hyperlinks - convert all links to plain text
    
    Return ONLY the corrected markdown content without any explanations or code block delimiters around your entire response.
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a markdown formatting expert for React applications.",
        },
        {
          role: "user",
          content: validationPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    let correctedContent = completion.choices[0]?.message?.content || content;

    // Remove markdown code block delimiters if present around the entire response
    correctedContent = normalizeMarkdown(correctedContent);

    console.log("✅ Llama markdown validation completed");
    return correctedContent;
  } catch (error) {
    console.error("❌ Error in Llama markdown validation:", error);
    // Fall back to the input content if this step fails
    return content;
  }
}

/**
 * Applies only essential programmatic fixes to markdown content
 */
function applyEssentialProgrammaticFixes(content: string): string {
  console.log("Applying essential programmatic fixes...");

  let fixedContent = content;

  // 1. Ensure all code blocks are properly closed
  const codeBlockCount = (fixedContent.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    fixedContent += "\n```";
  }

  // 2. Remove any links and replace with just the text
  fixedContent = fixedContent.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 3. Ensure proper spacing around headings
  fixedContent = fixedContent.replace(/^(#{1,6})([^#\s])/gm, "$1 $2");

  // 4. Ensure proper line breaks before and after code blocks
  fixedContent = fixedContent.replace(/([^\n])```/g, "$1\n```");
  fixedContent = fixedContent.replace(/```([^\n])/g, "```\n$1");

  console.log("✅ Essential programmatic fixes applied");
  return fixedContent;
}
