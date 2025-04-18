import { GoogleGenAI } from "@google/genai";
import { normalizeMarkdown } from "./helpers";

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
    console.log("Starting enhanced markdown validation process...");

    // Step 1: Initial LLM-based formatting correction
    let correctedContent = await performLLMMarkdownValidation(
      genAI,
      content,
      title
    );

    // Step 2: Apply programmatic fixes for common issues
    correctedContent = applyProgrammaticMarkdownFixes(correctedContent);

    // Step 3: Final sanity check with specific focus on problematic patterns
    correctedContent = performFinalSanityCheck(correctedContent);

    console.log("✅ Enhanced markdown validation and correction completed");
    return correctedContent;
  } catch (error) {
    console.error("❌ Error in markdown validation process:", error);
    // Return original content if validation fails
    return content;
  }
}

/**
 * Performs initial markdown validation using LLM
 */
async function performLLMMarkdownValidation(
  genAI: GoogleGenAI,
  content: string,
  title: string
): Promise<string> {
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
    // Use a more capable model if available
    const validationResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: validationPrompt,
    });

    let correctedContent =
      validationResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? content;

    // Remove markdown code block delimiters if present around the entire response
    correctedContent = normalizeMarkdown(correctedContent);

    console.log("✅ LLM markdown validation completed");
    return correctedContent;
  } catch (error) {
    console.error("❌ Error in LLM markdown validation:", error);
    // Fall back to original content if this step fails
    return content;
  }
}

/**
 * Applies programmatic fixes to markdown content to address common issues
 */
function applyProgrammaticMarkdownFixes(content: string): string {
  console.log("Applying programmatic markdown fixes...");

  let fixedContent = content;

  // 1. Fix headings without space after #
  fixedContent = fixedContent.replace(/^(#{1,6})([^#\s])/gm, "$1 $2");

  // 2. Remove any HTML tags except those explicitly supported by markdown
  fixedContent = fixedContent.replace(
    /<(?!\/?(code|pre|em|strong|blockquote)>)[^>]+>/g,
    ""
  );

  // 3. Fix list items without space after marker
  fixedContent = fixedContent.replace(/^(\s*[-*+])([^\s])/gm, "$1 $2");

  // 4. Remove any links and replace with just the text
  fixedContent = fixedContent.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 5. Ensure code blocks have language identifiers and are properly formatted
  fixedContent = fixedContent.replace(/```\s*\n/g, "```plaintext\n");

  // 6. Fix blockquotes without space after >
  fixedContent = fixedContent.replace(/^(>\s*)([^>\s])/gm, "$1 $2");

  // 7. Ensure consistent spacing between sections (one blank line)
  fixedContent = fixedContent.replace(/\n{3,}/g, "\n\n");

  // 8. Ensure all code blocks are properly closed
  let codeBlockCount = (fixedContent.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    // Find unclosed code blocks and close them
    const lines = fixedContent.split("\n");
    let openBlocks = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("```")) {
        openBlocks = openBlocks === 0 ? 1 : 0;
      }
    }

    if (openBlocks > 0) {
      fixedContent += "\n```";
    }
  }

  // 9. Fix inconsistent emphasis markers (standardize on *)
  fixedContent = fixedContent.replace(/_([^_]+)_/g, "*$1*");

  // 10. Simplified special character handling
  // Only handle the most problematic characters in non-code contexts
  const parts = fixedContent.split("```");
  for (let i = 0; i < parts.length; i += 2) {
    // Only process non-code parts
    // Replace unescaped asterisks that aren't for emphasis
    parts[i] = parts[i].replace(/(?<!\*)\*(?!\*)/g, "\\*");

    // Replace unescaped underscores that aren't for emphasis
    parts[i] = parts[i].replace(/(?<!_)_(?!_)/g, "\\_");

    // Replace unescaped backticks that aren't for code
    parts[i] = parts[i].replace(/(?<!`)`(?!`)/g, "\\`");
  }
  fixedContent = parts.join("```");

  console.log("✅ Programmatic fixes applied");
  return fixedContent;
}

/**
 * Performs final sanity check on markdown content
 */
function performFinalSanityCheck(content: string): string {
  console.log("Performing final markdown sanity check...");

  let sanitizedContent = content;

  // 1. Check for and fix unclosed code blocks again (more thorough check)
  const codeBlockMatches =
    sanitizedContent.match(/```[a-z]*\n[\s\S]*?```/g) || [];
  const totalBacktickGroups = (sanitizedContent.match(/```/g) || []).length;

  if (totalBacktickGroups % 2 !== 0) {
    // Find the last unclosed code block and close it
    const lastOpeningIndex = sanitizedContent.lastIndexOf("```");
    const contentAfterLastOpening =
      sanitizedContent.substring(lastOpeningIndex);

    if (!contentAfterLastOpening.includes("```", 3)) {
      // No closing backticks after opening
      sanitizedContent += "\n```";
    }
  }

  // 2. Check for and fix unclosed formatting markers
  const asteriskCount = (sanitizedContent.match(/\*/g) || []).length;
  if (asteriskCount % 2 !== 0) {
    // Find unclosed asterisks and escape them
    sanitizedContent = sanitizedContent.replace(/(?<!\*)\*(?!\*)/g, "\\*");
  }

  // 3. Remove any remaining HTML-like content that might cause hydration issues
  sanitizedContent = sanitizedContent.replace(/<[^>]*>/g, "");

  // 4. Ensure proper spacing around headings
  sanitizedContent = sanitizedContent.replace(/^(#{1,6})([^#\s])/gm, "$1 $2");

  // 5. Ensure proper line breaks before and after code blocks
  sanitizedContent = sanitizedContent.replace(/([^\n])```/g, "$1\n```");
  sanitizedContent = sanitizedContent.replace(/```([^\n])/g, "```\n$1");

  console.log("✅ Final sanity check completed");
  return sanitizedContent;
}
