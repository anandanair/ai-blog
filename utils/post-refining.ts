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

  const refinementSystemPrompt = `
  You are an exceptional "Clarity Coach" and "Engagement Editor" for a popular technology blog that makes tech understandable and exciting for a **general, non-technical audience.** Your primary role is to take a draft written for this audience and make it even clearer, more engaging, and more enjoyable to read.

Core Refinement Principles:
- **Ultimate Readability for All:** Is every sentence crystal clear to someone with no tech background? Could anything be simpler?
- **Boost Engagement:** Does it tell a good story? Is it interesting? Are there opportunities to make it more relatable or add a touch of "wow"?
- **Jargon Demolition (or Perfect Explanation):** Hunt down any remaining jargon or complex phrasing. Either replace it with simple terms or ensure any necessary technical term (that was intentionally kept and meant to be explained) is defined with an incredibly clear analogy or example.
- **Smooth Flow & Pacing:** Ensure the post flows like a good conversation, with smooth transitions and a pace that keeps the reader interested.
- **Preserve the Core (and Citations!):** While enhancing clarity and engagement, you must maintain the original meaning, factual accuracy, the established outline structure, and all '[ref:ID]' citation markers precisely.

You are the final polish that ensures a non-technical reader not only understands the content but also enjoys the experience of learning.
  `;

  const refinementPrompt = `
  Your task is to significantly improve the quality, clarity, and engagement of the following blog post draft. This draft is intended for a **general, non-technical audience.** You must strictly preserve the original structure, factual accuracy (as supported by any research), and all embedded '[ref:ID]' reference markers.

**Blog Post Topic (for a general audience):**
${topic}

**Original Outline (The refined draft MUST strictly follow this structure):**
\`\`\`markdown
${outlineMarkdown} 
// The outline already designed for a non-technical audience.
\`\`\`

**Original Draft (Contains important [ref:ID] markers that MUST be preserved):**
\`\`\`markdown
${originalDraft}
// The draft written in Step 8 for a non-technical audience.
\`\`\`

**REFINEMENT INSTRUCTIONS (for a NON-TECHNICAL audience):**

1.  **Maximize Clarity & Simplicity:**
    *   **Is this the simplest way to say it?** Aggressively simplify complex sentences and vocabulary. Replace any lingering jargon or technical terms with everyday language.
    *   If a technical term *must* be used (per the outline's intent to explain it), is its explanation or analogy **crystal clear and instantly understandable** to a layperson?
    *   Eliminate redundancy and wordiness. Ensure every word contributes to understanding.

2.  **Enhance Engagement & Flow:**
    *   **Is it interesting from start to finish?** Strengthen the hook in the introduction if needed.
    *   Ensure smooth, natural transitions between paragraphs and ideas.
    *   Vary sentence structure to maintain reader interest.
    *   **Maintain a friendly, conversational, and enthusiastic tone** throughout. Does it sound like a helpful friend explaining something cool?

3.  **Strict Adherence to Structure & Outline:**
    *   Follow the 'Original Outline' **exactly**. Use the same heading structure.
    *   Ensure all outlined sections and points are fully addressed in a way that's clear to the target audience.

4.  **Completeness of Explanation (for a Layperson):**
    *   Are explanations well-developed enough for someone new to the topic to understand?
    *   Are there any points where a non-technical reader might get lost or need a bit more (simple) explanation or a better example? Add this *without changing the core facts or adding new research points unless it's a general clarifying statement*.

5.  **Flawless Grammar & Style (for Readability):**
    *   Correct all grammar, spelling, and punctuation errors.
    *   Fix any awkward phrasing to improve natural flow.
    *   Ensure the style is consistently engaging and easy to read (short sentences, clear language).

6.  **CRITICAL: Preserve Reference Markers ([ref:ID]):**
    *   Reference markers (e.g., '[ref:ref-12]') **MUST remain exactly as they appear in the original draft and in the same position relative to the statement they support.**
    *   **DO NOT delete, rename, reformat, or move any reference marker.**
    *   If you rephrase a sentence, the marker **must stay directly connected** to the specific fact, data point, or direct example it originally followed. This is crucial.

7.  **Maintain Markdown Formatting:**
    *   Ensure standard Markdown syntax is used consistently and correctly (headings, lists, bolding, etc.).
    *   The output must be clean, valid Markdown.

**Your Action:**
Carefully rewrite and refine the **entire draft** based on all the above criteria, focusing on making it exceptionally clear and engaging for a non-technical audience. Produce the improved Markdown blog post with all '[ref:ID]' markers perfectly preserved and correctly placed.

**Output ONLY the final refined Markdown blog post.** Do not include notes, comments, or introductory statements. Start immediately with the first line of the refined content.
  `;

  try {
    const refinedResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: refinementPrompt,
      config: {
        temperature: 0.5,
        systemInstruction: refinementSystemPrompt,
        thinkingConfig: { thinkingBudget: 0 },
      },
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
  3. **Maintain all original Markdown formatting**, including headings, lists, emphasis, and code blocks.
  4. If no meta-commentary is found, return the original input content exactly as it is.
  
  **Input Markdown (with [ref:ID] markers to preserve):**
  \`\`\`markdown
  ${potentiallyUnpolishedDraft}
  \`\`\`
  
  **Output ONLY the cleaned Markdown content — no comments, notes, or introductions. Start directly with the first line of the cleaned blog post.**
  `;

  try {
    const polishResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: polishPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.1,
      },
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
