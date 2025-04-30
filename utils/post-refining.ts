import { GoogleGenAI } from "@google/genai";

/**
 * Stage 6: Evaluates and refines the blog post draft using an LLM.
 * @param genAI Initialized GoogleGenerativeAI client.
 * @param originalDraft The Markdown draft generated in Stage 5.
 * @param outlineMarkdown The original outline used for generation.
 * @param topic The main topic of the blog post.
 * @returns The refined blog post draft as a Markdown string, or null on failure.
 */
export async function refineDraft(
  genAI: GoogleGenAI,
  originalDraft: string,
  outlineMarkdown: string,
  topic: string
): Promise<string | null> {
  // --- Craft the Refinement Prompt ---

  const refinementPrompt = `
    You are an expert copy editor and content refiner for a technology blog.
    Your task is to evaluate and significantly improve the provided blog post draft based on the original outline and topic, while carefully preserving embedded reference markers.

    **Topic:**
    ${topic}

    **Original Outline (Ensure the refined draft still follows this structure):**
    \`\`\`markdown
    ${outlineMarkdown}
    \`\`\`

    **Original Draft (Contains [ref:ID] markers that MUST be preserved):**
    \`\`\`markdown
    ${originalDraft} 
    \`\`\`

    **Evaluation Criteria & Refinement Instructions:**
    1.  **Clarity & Conciseness:** Is the language clear, precise, and easy for a technical audience (e.g., developers) to understand? Remove jargon where possible or explain it simply. Eliminate wordiness and redundant phrases. Ensure arguments are presented logically.
    2.  **Engagement & Flow:** Is the writing engaging? Does the introduction hook the reader? Do paragraphs transition smoothly? Is the tone appropriate (informative yet accessible)? Enhance sentence variety.
    3.  **Structure & Outline Adherence:** Does the draft strictly follow the provided Original Outline? Are all sections and key points from the outline covered appropriately? Ensure headings match the outline structure.
    4.  **Completeness & Depth:** While adhering to the outline, does each section feel sufficiently developed? (You don't need external knowledge, evaluate based on the content present). Are the explanations thorough enough?
    5.  **Grammar & Style:** Correct any grammatical errors, spelling mistakes, punctuation issues, and awkward phrasing. Improve sentence structure for better readability. Maintain a professional and consistent style.
    6.  **Maintain Core Information:** Do NOT change the core facts or technical information presented in the original draft. Your goal is to improve the *presentation*, clarity, and flow, not the underlying substance.
    7.  **PRESERVE REFERENCE MARKERS:** The Original Draft contains important reference markers in the format \`[ref:ID]\` (e.g., \`[ref:ref-12]\`). These markers link statements to research sources.
        *   **You MUST preserve these markers exactly as they appear.**
        *   **DO NOT remove, change, or reformat these \`[ref:ID]\` markers.**
        *   **Crucially, ensure these markers remain immediately adjacent to the specific sentence or phrase they originally followed.** Even if you rephrase a sentence, the marker associated with its core information must stay directly connected to that rephrased text. 
    8.  **Markdown Formatting:** Ensure standard Markdown syntax is used correctly throughout (list spacing, heading levels, etc.).

    **Your Action:**
    Rewrite the *entire* Original Draft, applying improvements based on the criteria above, paying special attention to preserving the \`[ref:ID]\` markers and their exact positions relative to the text they reference. Ensure the final output is a complete, refined blog post in Markdown format, including the preserved markers.

    **Output ONLY the refined Markdown blog post.** Do not include your evaluation notes, introductory phrases ("Here is the refined draft..."), or anything other than the final Markdown content (which must include the original \`[ref:ID]\` markers). Start directly with the first line of the refined post.
  `;

  try {
    const refinedResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: refinementPrompt,
      config: { temperature: 0.5 },
    });
    const refinedMarkdown = refinedResponse.text;

    if (!refinedMarkdown) {
      console.error("❌ LLM returned an empty refined draft.");
      return null;
    }

    // Basic cleanup (remove potential fences)
    const cleanedRefinedDraft = refinedMarkdown
      .replace(/^```markdown\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    console.log("✅ Blog post draft refined successfully.");
    return cleanedRefinedDraft;
  } catch (error: any) {
    console.error(
      "❌ Error refining blog post draft:",
      error?.message || error
    );
    const candidate = error.response?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      console.error("   -> Blocked due to safety settings.");
    } else if (candidate?.finishReason === "MAX_TOKENS") {
      console.error("   -> Refinement stopped due to maximum token limit.");
    } else if (candidate?.finishReason) {
      console.error(`   -> Finished with reason: ${candidate.finishReason}`);
    }
    return null;
  }
}

/**
 * Stage 7: Performs a final polish pass to remove meta-commentary from the draft.
 * @param genAI Initialized GoogleGenerativeAI client.
 * @param potentiallyUnpolishedDraft The draft potentially containing LLM notes (output of refineDraft).
 * @returns The polished blog post draft as a Markdown string, or null on failure.
 */
export async function finalPolish(
  genAI: GoogleGenAI,
  potentiallyUnpolishedDraft: string
): Promise<string | null> {
  if (!potentiallyUnpolishedDraft) {
    console.warn("Skipping polish stage due to empty input draft.");
    return potentiallyUnpolishedDraft; // Return empty or null as received
  }

  // --- Craft the Polishing Prompt ---

  const polishPrompt = `
  You are a meticulous final proofreader. Your ONLY task is to clean up the provided Markdown text by REMOVING any sentences or paragraphs that are NOT part of the actual blog post content intended for the reader, while carefully preserving specific reference markers.

  Specifically, REMOVE text that matches these descriptions:
  - Notes about the writing process itself (e.g., "Note: I focused on...", "As requested...", "This section covers...")
  - Commentary on the instructions received (e.g., "Based on the outline provided...", "The research indicated...")
  - Apologies or explanations for missing information (e.g., "I couldn't find specific data on...", "Further research would be needed for...")
  - Self-correction remarks or alternative phrasings considered (e.g., "Alternatively, one could say...", "A better way might be...")
  - Any other meta-commentary or text clearly not intended for the final published blog post reader.

  **CRITICAL INSTRUCTIONS:**
  1.  **PRESERVE REFERENCE MARKERS:** The Input Text contains important reference markers in the format \`[ref:ID]\` (e.g., \`[ref:ref-12]\`). These markers are PART OF THE INTENDED CONTENT and MUST NOT BE REMOVED OR ALTERED. They are *not* meta-commentary.
  2.  **DO NOT rewrite, rephrase, or change the actual blog post content** (other than removing the specific types of meta-commentary listed above).
  3.  **Preserve all original Markdown formatting** of the remaining content, including the exact placement and formatting of the \`[ref:ID]\` markers.
  4.  If the input text contains NO meta-commentary (only blog content and markers), return the input text exactly as is.

  **Input Text (Contains [ref:ID] markers to preserve, may need meta-commentary removed):**
  \`\`\`markdown
  ${potentiallyUnpolishedDraft}
  \`\`\`

  **Output ONLY the cleaned Markdown content including the preserved [ref:ID] markers.** Do not include any explanations, introductions, or confirmations. Start directly with the first line of the cleaned content.
  `;

  try {
    const polishResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: polishPrompt,
      config: { temperature: 0.1 },
    });
    const polishedMarkdown = polishResponse.text;

    if (!polishedMarkdown) {
      // It's possible valid input resulted in empty output if the LLM removed everything
      // Check if the input was non-trivial
      if (potentiallyUnpolishedDraft.length > 50) {
        // Arbitrary threshold
        console.warn(
          "⚠️ LLM returned an empty polished draft from non-empty input. Check original draft."
        );
        // Decide: return original? return null? For safety, let's return original with warning
        console.warn(
          "   Returning the pre-polish draft due to empty polish result."
        );
        return potentiallyUnpolishedDraft;
      } else {
        // Input was likely already empty or just meta-commentary
        return ""; // Return empty string
      }
    }

    // Basic cleanup (remove potential fences, though less likely with low temp)
    const cleanedPolishedDraft = polishedMarkdown
      .replace(/^```markdown\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Simple check to see if significant content was removed (optional)
    if (cleanedPolishedDraft.length < potentiallyUnpolishedDraft.length * 0.8) {
      // If more than 20% shorter
      console.log(
        `   Note: Polish stage significantly shortened the content (original: ${potentiallyUnpolishedDraft.length} chars, polished: ${cleanedPolishedDraft.length} chars).`
      );
    } else {
      console.log("Polish stage completed.");
    }
    return cleanedPolishedDraft;
  } catch (error: any) {
    console.error(
      "❌ Error during final polish stage:",
      error?.message || error
    );
    const candidate = error.response?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      console.error("   -> Blocked due to safety settings.");
    } else if (candidate?.finishReason) {
      console.error(`   -> Finished with reason: ${candidate.finishReason}`);
    }
    // Fallback: Return the original draft if polishing fails
    console.warn("   Returning the pre-polish draft due to error.");
    return potentiallyUnpolishedDraft;
  }
}
