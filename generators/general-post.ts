import { GoogleGenAI } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  generateAndUploadImage,
  extractMarkdownContent,
  generateSlug,
} from "../utils/helpers";
import { getExistingPostTitles, savePostToDatabase } from "../utils/database";
import { getCurrentTechContext } from "../utils/topic-selection";
import {
  GroundedResearchResult,
  researchTopicWithGrounding,
} from "../utils/topic-research";
import { finalPolish, refineDraft } from "../utils/post-refining";
import { validateMarkdownSyntax } from "../utils/post-validation";
import { generateMetadata } from "../utils/metadata-generation";

/**
 * Generates a general blog post using a multi-stage approach:
 * 1. Topic selection based on current tech trends
 * 2. Research gathering on the selected topic
 * 3. Detailed post generation with the research
 * 4. Post refinement and validation
 * 5. Image generation and database storage
 *
 * @param genAI - Google Generative AI client instance
 * @param supabase - Supabase client for database operations
 * @returns Promise<boolean> - Success status of the post generation process
 */
export async function generateGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log("\n--- Generating General Post ---");

  // STAGE 1: Topic Selection
  console.log("Stage 1: Fetch & Summarize Tech Context");

  // 1.1 Get current tech context to inform topic selection
  console.log("1.1 - Fetching current tech context...");
  const techContext = await getCurrentTechContext();

  // 1.2 Summarize for topic selection
  console.log("1.2 - Summarizing tech context for topic selection");
  const techContextSummarizePrompt = `You are an expert tech analyst. I will provide you a detailed text containing the latest news, trends, and discussions happening in the tech industry. 

This text is compiled from sources like Reddit, GitHub, StackOverflow, HackerNews, RSS feeds from major tech news outlets, and other platforms.

Your tasks are:

1. Summarize the overall tech landscape covered in the provided text in 5-10 bullet points.
2. Identify and list the top emerging **key themes** or **trending topics** from the information. Group similar topics together if necessary.
3. Highlight any notable events, innovations, or controversies mentioned.
4. Focus on providing a clean, structured summary that can later be used to decide on blog topics.

Important Instructions:
- Be concise but insightful.
- Do not add any extra information not present in the input.
- Stick to the actual content and context provided.

Here is the tech context:

${techContext}
`;
  const techContextSummaryRespone = await genAI.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    // model: "gemini-2.0-flash",
    contents: techContextSummarizePrompt,
  });

  const summarizedTechContext = techContextSummaryRespone.text;

  // 1.3 Get existing post titles to avoid duplication
  console.log("1.3 - Fetching existing post titles..");
  const existingTitles = await getExistingPostTitles(supabase);

  // Create a context string of existing topics to avoid in the prompt
  const existingTopicsContext =
    existingTitles.length > 0
      ? `\nAVOID these topics as they've been covered recently:\n${existingTitles
          .map((title) => `- ${title}`)
          .join("\n")}\n`
      : "";

  // STAGE 2: Topic Ideation & Selection
  console.log("Stage 2: Topic Ideation & Selection");
  const topicSelectionPrompt = `
    You are an AI blog topic selector. Your primary job is to choose ONE interesting, relevant tech topic for a new blog post.

    Here is some current context about technology trends to help you choose:
    ${summarizedTechContext}

    ${existingTopicsContext}

    SELECTION CRITERIA:
    1. Choose a specific tech-related topic that is relevant today based on the provided context.
    2. IMPORTANT: Choose a topic that is distinct and NOT substantially similar to any of the existing post titles listed above.
    3. Be specific - don't just say "Cloud Computing" but rather something like "Cost Optimization Strategies for Multi-Cloud Environments" or "Comparing Serverless Providers for Real-time Data Processing".
    4. Choose topics that would provide value to tech professionals, developers, or serious tech enthusiasts.
    5. Prioritize topics with practical applications, how-tos, comparisons, or deep dives rather than just surface-level news summaries.

    Your response MUST contain ONLY the following fields, formatted exactly like this:

    TOPIC: Your Chosen Topic Here
    DESCRIPTION: A concise (1-2 sentence) description of what the blog post should cover, highlighting its value proposition.
    SEARCH_TERMS: 3-5 specific phrases someone could use in a search engine (like Google) to find detailed technical information, tutorials, or case studies about this topic.

    Do not include any introductory phrases, explanations, or closing remarks. Just provide the structured output.
    `;

  try {
    // Generate topic selection using AI
    const topicSelectionResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      // model: "gemini-2.0-flash",
      contents: topicSelectionPrompt,
    });

    // Extract text from the response
    const topicText = topicSelectionResponse.text || "";

    // Parse the topic selection using regex to extract key components
    const topicMatch = topicText.match(/TOPIC:\s*(.*?)(?:\n|$)/);
    const descriptionMatch = topicText.match(/DESCRIPTION:\s*(.*?)(?:\n|$)/);
    const searchTermsMatch = topicText.match(/SEARCH_TERMS:\s*(.*?)(?:\n|$)/);

    // Validate that all required components were extracted
    if (!topicMatch || !descriptionMatch || !searchTermsMatch) {
      console.error("❌ Failed to parse topic selection");
      return false;
    }

    // Extract and clean the topic components
    const selectedTopic = topicMatch[1].trim();
    const topicDescription = descriptionMatch[1].trim();
    const searchTerms = searchTermsMatch[1].trim();
    console.log("- Selected Topic:", selectedTopic);

    // Stage 3: Outline Generation
    console.log("STAGE 3: Generating Blog Post Outline...");

    const outlinePrompt = `
    Generate a detailed blog post outline for the following topic.

    **Topic:** ${selectedTopic}

    **Description:** ${topicDescription}

    **Key Areas/Search Terms to Consider:** ${searchTerms}

    **Instructions:**
    - Create a logical flow from introduction to conclusion.
    - Use Markdown format with headings (e.g., ## Section Title) and bullet points (* or -) for sub-topics.
    - Include an Introduction, several Main Body sections covering key aspects, and a Conclusion.
    - Break down main points into specific sub-points that suggest areas for research (e.g., instead of just "Benefits", list specific benefits like "* Improved latency for real-time processing", "* Reduced bandwidth costs").
    - The outline should be comprehensive enough to guide the writing of a ~1000-1500 word blog post.

    **Output the outline below:**
    **Important: Output *only* the raw Markdown content for the outline, starting directly with the first heading (e.g., ## Introduction). Do not include any introductory text, concluding remarks, or explanations outside of the Markdown structure itself.**
  `;

    const outlineResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      // model: "gemini-2.0-flash",
      contents: outlinePrompt,
    });

    const outlineText =
      extractMarkdownContent(outlineResponse.text || "") || "";

    // Stage 4: Research
    console.log("STAGE 4: Research...");
    const researchResults = await researchTopicWithGrounding(
      genAI,
      outlineText,
      selectedTopic
    );

    // Stage 5: Draft Generation
    console.log("STAGE 5: Draft Generation...");
    const blogDraft = await generateDraft(
      genAI,
      selectedTopic,
      outlineText,
      researchResults
    );

    // STAGE 6: Content Evaluation & Refinement
    console.log("Stage 6: Polishing and improving the blog post...");
    const refinedBlogDraft = await refineDraft(
      genAI,
      blogDraft || "",
      outlineText,
      selectedTopic
    );

    // STAGE 7: Final Polish (Removing Meta-Commentary)
    console.log("Stage 7: Performing final polish...");
    const polishedDraft = await finalPolish(genAI, refinedBlogDraft || "");

    // STAGE 8: Generate Metadata
    console.log("Stage 8: Generating metadata...");
    const blogMetadata = await generateMetadata(
      genAI,
      polishedDraft || "",
      selectedTopic
    );

    // STAGE 9: Markdown Validation
    console.log("Stage 9: Validating markdown...");
    const validatedMarkdown = await validateMarkdownSyntax(
      polishedDraft || "",
      selectedTopic
    );

    // STAGE 10: Image Generation and Upload
    console.log("Stage 10: Generating image and uploading...");
    const imageUrl = await generateAndUploadImage(
      genAI,
      supabase,
      blogMetadata?.imagePrompt || "",
      blogMetadata?.title || ""
    );

    // STAGE 11: Save to Supabase Database
    console.log("Stage 11: Saving to Supabase Database...");
    return await savePostToDatabase(supabase, {
      title: blogMetadata?.title || "",
      slug: generateSlug(blogMetadata?.title || ""),
      description: blogMetadata?.metaDescription || "",
      content: validatedMarkdown,
      category: null,
      image_url: imageUrl,
      tool_name: null,
      read_time: blogMetadata?.readTimeMinutes || 0,
      tags: blogMetadata?.tags || [],
    });
  } catch (error) {
    return false;
  }
}

/**
 * Stage 5: Generates the first draft of the blog post using the outline and research findings.
 * @param genAI Initialized GoogleGenerativeAI client.
 * @param topic The main topic of the blog post.
 * @param outlineMarkdown The structured outline in Markdown.
 * @param researchResults Map containing grounded research for outline points.
 * @returns The generated blog post draft as a Markdown string, or null on failure.
 */
export async function generateDraft(
  genAI: GoogleGenAI,
  topic: string,
  outlineMarkdown: string,
  researchResults: Map<string, GroundedResearchResult>
): Promise<string | null> {
  // --- 1. Prepare Research Input for Prompt ---
  let researchFindingsString = "RESEARCH FINDINGS:\n\n";
  if (researchResults.size === 0) {
    researchFindingsString +=
      "No specific research data was gathered for this topic.\n";
  } else {
    researchResults.forEach((result, point) => {
      researchFindingsString += `Outline Point: "${point}"\n`;
      if (result.groundedText && !result.groundedText.startsWith("Error")) {
        researchFindingsString += `Grounded Text: ${result.groundedText}\n`;
        if (result.sources && result.sources.length > 0) {
          const sourceTitles = result.sources
            .map((s) => s.title || s.uri?.split("/")[2] || "Unknown Source") // Extract domain if title missing
            .filter(Boolean);
          if (sourceTitles.length > 0) {
            researchFindingsString += `Sources: [${sourceTitles.join(", ")}]\n`;
          }
        }
      } else {
        researchFindingsString += `Grounded Text: (No specific data found or error: ${result.groundedText})\n`; // Indicate missing/error data
      }
      researchFindingsString += "\n"; // Add blank line between points
    });
  }

  // --- 2. Craft the Generation Prompt ---
  const generationPrompt = `
    You are an expert technical writer specializing in creating engaging and informative blog posts about technology topics.

    Your task is to write a first draft of a blog post based on the provided topic, outline, and research findings.

    **Topic:**
    ${topic}

    **Blog Post Outline (Structure to follow):**
    \`\`\`markdown
    ${outlineMarkdown}
    \`\`\`

    **Research Findings (Use this information to elaborate on outline points):**
    ${researchFindingsString}

    **Instructions:**
    1.  **Follow the Outline:** Adhere strictly to the structure provided in the Blog Post Outline. Use the headings and cover the points mentioned under each heading.
    2.  **Integrate Research:** Where an "Outline Point" in the research findings matches a point in the outline, use the corresponding "Grounded Text" to provide details, facts, examples, or explanations for that section. Weave this information naturally into the text.
    3.  **Handle Missing/Error Research:** If the "Grounded Text" for a point indicates "(No specific data found or error...)" or if a point from the outline is not present in the research findings, use your general knowledge to write about that point. You don't necessarily need to state that data was missing, just write the section as best you can.
    4.  **Expand and Elaborate:** The outline provides the structure; the research provides specific facts. Expand on these points to create flowing paragraphs. Don't just list the research findings; synthesize them into a coherent narrative.
    5.  **Tone:** Maintain an informative, engaging, and technically accurate tone suitable for developers or tech enthusiasts (adjust based on the specific topic's audience if known).
    6.  **Format:** Output the entire blog post draft in **Markdown format**. Ensure proper Markdown syntax for headings, lists, bold text, etc.
    7.  **Completeness:** Aim for a comprehensive draft covering all sections of the outline. Assume a target length appropriate for a typical tech blog post (~1000-1500 words, but prioritize covering the outline well over hitting an exact word count).
    8.  **Citations:** For this first draft, do not worry about adding formal inline citations or a reference list based on the 'Sources' provided in the research. Focus on incorporating the *information*. Source attribution can be handled later.
    9.  **Introduction and Conclusion:** Ensure the draft has a compelling introduction that hooks the reader and sets the stage, and a conclusion that summarizes key takeaways and offers final thoughts.

    **Output only the final Markdown blog post draft.** Do not include any introductory phrases like "Okay, here is the draft..." or any explanations outside the Markdown content itself. Start directly with the first line of the Markdown (likely the main title).
  `;

  try {
    // --- 3. Call Gemini API ---
    const countTokensResponse = await genAI.models.countTokens({
      model: "gemini-2.5-flash-preview-04-17",
      contents: generationPrompt,
    });
    console.log("Tokens:", countTokensResponse);

    const draftResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: generationPrompt,
      config: {
        temperature: 0.6,
      },
    });
    const draftMarkdown = draftResponse.text;

    if (!draftMarkdown) {
      console.error("❌ LLM returned an empty draft.");
      return null;
    }

    // --- 4. Basic Cleanup  ---
    const cleanedDraft = draftMarkdown
      .replace(/^```markdown\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return cleanedDraft;
  } catch (error: any) {
    console.error(
      "❌ Error generating blog post draft:",
      error?.message || error
    );
    if (error.response?.candidates?.[0]?.finishReason === "SAFETY") {
      console.error("   -> Blocked due to safety settings.");
    } else if (error.response?.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      console.error(
        "   -> Draft generation stopped due to maximum token limit."
      );
    }
    return null;
  }
}
