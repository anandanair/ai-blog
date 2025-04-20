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
  console.log("\n✨ Evaluating and Refining Blog Post Draft...");

  // --- Craft the Refinement Prompt ---
  const refinementPrompt = `
    You are an expert copy editor and content refiner for a technology blog.
    Your task is to evaluate and significantly improve the provided blog post draft based on the original outline and topic.

    **Topic:**
    ${topic}

    **Original Outline (Ensure the refined draft still follows this structure):**
    \`\`\`markdown
    ${outlineMarkdown}
    \`\`\`

    **Original Draft (To be evaluated and refined):**
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

    **Your Action:**
    Rewrite the *entire* Original Draft, applying improvements based on the criteria above. Ensure the final output is a complete, refined blog post in Markdown format.

    **Output ONLY the refined Markdown blog post.** Do not include your evaluation notes, introductory phrases ("Here is the refined draft..."), or anything other than the final Markdown content. Start directly with the first line of the refined post (likely the title).
  `;

  try {
    console.log("   Sending request to Gemini for draft refinement...");
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
