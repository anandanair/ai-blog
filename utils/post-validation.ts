import { lint as lintSync } from "markdownlint/sync";
import { applyFixes } from "markdownlint";
import { GoogleGenAI } from "@google/genai";

/**
 * Stage 8 : Uses AI to validate and potentially fix common Markdown formatting issues.
 * @param genAI Initialized GoogleGenerativeAI client.
 * @param markdownContent The Markdown string to validate.
 * @param contentIdentifier A name for logging purposes.
 * @returns The potentially corrected Markdown string.
 */

/**
 * Stage 8: Validates the Markdown syntax of the blog post content.
 * @param markdownContent The Markdown string to validate.
 * @param contentIdentifier A name for logging purposes (e.g., the topic or 'refinedDraft').
 * @returns True if the Markdown is valid (no errors found), false otherwise.
 */
export async function validateMarkdownSyntax(
  genAI: GoogleGenAI,
  markdownContent: string,
  contentIdentifier: string = "blogPostDraft"
): Promise<string> {
  // AI Validation
  const validationPrompt = `You are a Markdown formatting validator and fixer.

  Your job is to carefully review the provided Markdown content and fix common formatting errors. You must strictly enforce proper Markdown syntax, paragraph structure, and correct reference marker formatting.
  
  **Validation Rules (Strictly Apply):**
  
  1. **Indentation & Paragraphs:**
     - Remove any unintended indentation that causes normal text to render as a code block.
     - All paragraphs should begin flush with the margin unless they follow a list item or heading.
     - Avoid unnecessary blank lines between list items or within paragraphs.
  
  2. **List Formatting:**
     - Ensure consistent use of list markers (\`- \`, \`* \`, or \`1. \`) and correct indentation for nested items.
     - List items should not be incorrectly treated as headings or code blocks.
  
  3. **Headings:**
     - Ensure logical heading levels (\`#\`, \`##\`, \`###\`, etc.).
     - Do not skip heading levels (e.g., going from \`##\` directly to \`####\`).
     - Remove extra spacing between heading markers and text.
  
  4. **Code Block Syntax:**
     - Ensure all code blocks use proper \`\`\` delimiters.
     - Specify language if known (e.g., \`\`\`ts, \`\`\`javascript).
     - Inline code must use backticks (\`like this\`), not apostrophes or quotation marks.
  
  5. **Reference Markers (CRITICAL):**
     - Correct malformed reference markers such as:
       - \`[ref:ref:ID]\` → \`[ref:ID]\`
       - \`ref:ref:ref-ID\` → \`ref:ID\`
       - \`[ref:ref:ref:ref-3]\` → \`[ref:ref-3]\`
     - Ensure reference markers are:
       - Always in the format \`[ref:ref-ID]\` (e.g., \`[ref:ref-5]\`)
       - Not inside code blocks or headings
       - Positioned at the **end of the relevant sentence**, before punctuation if needed
     - Remove duplicate or malformed markers.
  
  **Final Output Instructions:**
  
  - Return only the corrected **Markdown content**.
  - Do **not** include any commentary, explanations, or notes.
  - Preserve all valid headings, formatting, structure, and intended meaning.
  - If no changes are needed, return the content exactly as it is.
  
  **Markdown Content to Review:**
  \`\`\`markdown
  ${markdownContent}
  \`\`\`
  
  **Corrected Markdown Output:**`;

  const options = {
    strings: {
      [contentIdentifier]: markdownContent,
    },
    resultVersion: 3,
  };

  try {
    const validationResponse = await genAI.models.generateContent({
      // model: "gemini-2.5-pro-exp-03-25",
      model: "gemini-2.5-flash",
      contents: validationPrompt,
      config: {
        // thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.1,
      },
    });
    const polishedMarkdown = validationResponse.text ?? "";

    // Basic cleanup (remove potential fences, though less likely with low temp)
    const finalMarkdown = polishedMarkdown
      .replace(/^```markdown\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const results = lintSync(options);
    const errors = results[contentIdentifier];

    let fixedContent = finalMarkdown;

    if (errors && errors.length > 0) {
      console.warn(
        `❌ Markdown validation found ${errors.length} issue(s) in "${contentIdentifier}":`
      );

      // Try applying fixes
      fixedContent = applyFixes(markdownContent, errors);
      console.log(`🔧 Applied fixes where possible.`);
    } else {
      console.log(`✅ Markdown syntax is valid for "${contentIdentifier}".`);
    }

    return fixedContent;
  } catch (error: any) {
    console.error(
      `❌ An unexpected error occurred during Markdown validation:`,
      error?.message || error
    );
    return markdownContent;
  }
}
