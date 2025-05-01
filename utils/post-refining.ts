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
  You are an expert copy editor and content refiner for a professional technology blog. Your task is to improve the quality of the following blog post draft while strictly preserving structure, factual accuracy, and embedded reference markers.
  
  **Topic:**
  ${topic}
  
  **Original Outline (The refined draft MUST follow this structure):**
  \`\`\`markdown
  ${outlineMarkdown}
  \`\`\`
  
  **Original Draft (Contains important [ref:ID] markers that MUST be preserved):**
  \`\`\`markdown
  ${originalDraft}
  \`\`\`
  
  **Refinement Instructions:**
  
  1. **Clarity & Conciseness:**  
     Simplify language without losing technical accuracy. Eliminate redundancy and wordiness. Use clear, precise language appropriate for a tech-savvy audience (e.g., developers, engineers).
  
  2. **Engagement & Flow:**  
     Improve narrative flow and readability. Hook the reader in the introduction. Ensure smooth transitions between paragraphs. Vary sentence structure and maintain a professional yet engaging tone.
  
  3. **Structure & Outline Adherence:**  
     Follow the original outline exactly. Use the same heading structure and ensure all outlined sections and points are fully addressed.
  
  4. **Completeness & Depth:**  
     Ensure explanations are well-developed but not overly verbose. Focus on clarity and informativeness without adding unnecessary content.
  
  5. **Grammar & Style:**  
     Correct grammar, spelling, punctuation, and awkward phrasing. Improve readability and maintain consistent technical blog style.
  
  6. **Preserve Reference Markers and Semantic Tags:**
     - Keep all \`[ref:ref-ID]\` markers **unchanged and directly attached** to their corresponding facts.
     - Do **not** delete, rename, or shift any reference markers from their intended sentences.
     - Also preserve structural tags:
       - \`<!-- PULL_QUOTE: “…” -->\`
       - \`<!-- DIAGRAM: … -->\`
       - Callout box labels (e.g., **Quick Quiz**, **Pro Tip**)  
     - Leave any **bolded tweetable insights** intact (typically at the end).
  
  7. **Markdown Formatting:**  
     Use standard Markdown syntax consistently:
     - Correct list indentation
     - Proper heading hierarchy
     - No malformed elements, stray characters, or spacing issues
  
  **Your Action:**  
  Rewrite the **entire draft** using the above criteria. Produce a refined, high-quality Markdown blog post that maintains all original structure, semantic tags, and reference markers.
  
  **Output ONLY the final Markdown blog post.**  
  Start directly with the first line of content—no explanations, notes, or extra text.
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
  You are a meticulous final proofreader. Your ONLY task is to clean up the provided Markdown blog post by removing any **meta-commentary** that does not belong in the final published article, while preserving the intended content and reference markers.
  
  **REMOVE any text that fits the following types of non-content:**
  - Comments about the writing process (e.g., "Note: I focused on...", "This draft covers...")
  - Explanations of instructions followed (e.g., "Based on the outline provided...")
  - Apologies or limitations (e.g., "I couldn't find exact data...", "More research might be needed...")
  - Self-corrections or alternate phrasing (e.g., "Another way to put this is...", "Alternatively...")
  - Any sentence or paragraph clearly not written for the final reader of the blog post
  
  **CRITICAL INSTRUCTIONS:**
  1. **Preserve all \`[ref:ID]\` markers exactly** — these are part of the final content and must not be removed, changed, or moved.
  2. **Do NOT rephrase or rewrite any of the remaining content** — your only task is to delete unintended meta-commentary.
  3. **Do NOT remove pull quotes, diagram tags, or tweetable insights.** These are part of the final blog experience.
  4. **Maintain all original Markdown formatting**, including headings, lists, emphasis, and code blocks.
  5. If no meta-commentary is found, return the original input content exactly as it is.
  
  **Input Markdown (with [ref:ID] markers to preserve):**
  \`\`\`markdown
  ${potentiallyUnpolishedDraft}
  \`\`\`
  
  **Output ONLY the cleaned Markdown content — no comments, notes, or introductions. Start directly with the first line of the cleaned blog post.**
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
