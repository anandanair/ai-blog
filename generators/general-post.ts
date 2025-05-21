import { GoogleGenAI, Type } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  generateAndUploadImage,
  extractMarkdownContent,
  generateSlug,
  formatResearchForStorage,
} from "../src/utils/ai-helpers"; // Updated path and filename
import {
  getCategoryPostCounts,
  getExistingPostTitles,
  savePostToDatabase,
} from "../src/utils/database";
import { getCurrentTechContext } from "../src/utils/topic-selection";
import {
  GroundedResearchResult,
  researchTopicWithGrounding,
} from "../src/utils/topic-research";
import { finalPolish, refineDraft } from "../src/utils/post-refining";
import { validateMarkdownSyntax } from "../src/utils/post-validation";
import { generateMetadata } from "../src/utils/metadata-generation";

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
  const techContextSummarizeSystemPrompt = `
  You are a "Tech Translator for Everyone." Your primary mission is to take complex, potentially technical information from the tech world and distill it into summaries that are **clear, engaging, and relevant for a general, non-technical audience.**

Always prioritize:
- **Simplicity:** Explain concepts as if you're talking to a curious friend who isn't a tech expert.
- **Relatability:** Connect tech developments to everyday life, common experiences, or broader societal impacts.
- **The "So What?" Factor:** For any piece of information, focus on *why* an average person should care or what it means for them.
- **Avoiding Jargon:** If technical terms are present in the source, either rephrase them in simple language or, if essential to mention, provide an immediate, easy-to-understand analogy or definition.
- **Sparking Curiosity:** Frame information in a way that makes people want to learn more.

Your goal is to help identify potential blog topics that will resonate with people who are interested in technology's impact on their lives but don't necessarily understand the deep technical details.`;

  const techContextSummarizePrompt = `I will provide you with a compilation of recent tech news, trends, and discussions from various online sources.

Based on your role as a "Tech Translator for Everyone," process this information to achieve the following:

1.  **Overall Tech Snapshot (for a layperson):** In 3-5 bullet points, provide a high-level summary of what's buzzing in the tech world *from the perspective of how it might affect or interest an average person*.

2.  **Identify Emerging "Wow" or "Why Should I Care?" Topics:**
    *   List 3-5 key developments, trends, or innovations from the text that have strong potential to capture the interest of a non-technical reader.
    *   For each, briefly explain **what it is** (in very simple terms) and **why an average person might find it interesting, exciting, useful, or concerning.**
    *   Group similar developments if they point to a larger, relatable trend.

3.  **Spotlight on Impact:**
    *   Highlight any specific events, products, or controversies mentioned that have clear real-world implications or have sparked public discussion beyond the tech community.
    *   Focus on the human angle or societal impact.

Important Reminders for this Specific Task:
*   The output should be clean, structured, and directly usable for brainstorming blog topics for a general audience.
*   Do not add any extra information not present in the input.
*   Stick to the actual content and context provided, but *interpret and frame it* through the lens you've been given (Tech Translator for Everyone).

Here is the tech context:

${techContext}
`;
  const techContextSummaryRespone = await genAI.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    // model: "gemini-2.0-flash",
    config: {
      systemInstruction: techContextSummarizeSystemPrompt,
    },
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

  // 1.4 Get category post counts
  console.log("1.4 - Fetching category post counts...");
  let categoryCountsText = "Could not fetch category counts."; // Default text
  try {
    const categoryCounts = await getCategoryPostCounts(supabase);
    if (categoryCounts.length > 0) {
      // Sort by count, ascending
      categoryCounts.sort((a, b) => a.count - b.count);
      categoryCountsText =
        "Current post counts per category (lower count suggests potential areas for new content):\n" +
        categoryCounts
          .map((cat) => `- ${cat.title}: ${cat.count} posts`)
          .join("\n");
    } else {
      categoryCountsText = "No category data available.";
    }
  } catch (error) {
    console.error("❌ Error fetching category counts for prompt:", error);
    // Keep the default categoryCountsText
  }

  // STAGE 2: Topic Ideation & Selection
  console.log("Stage 2: Topic Ideation & Selection");
  const topicSelectionSystemPrompt = `
  You are a "Curiosity Sparker" for a popular technology blog aimed at a **general, non-technical audience.** Your mission is to identify and frame tech topics in a way that makes everyday people feel intrigued, informed, and understand the relevance of technology to their lives.

Core Principles for Topic Selection:
- **Audience First:** Always think: "Would my non-tech-savvy friend/family member find this interesting? Would they understand it? Would they care?"
- **Relatability is Key:** Prioritize topics that connect to common experiences, solve everyday problems, explain phenomena people are already noticing, or highlight surprising ways tech is shaping the world.
- **Simplicity & Clarity:** Topics should be easily understandable from the title and initial description. Avoid jargon or highly technical framing.
- **The "Wow!" or "Hmm, Interesting..." Factor:** Aim for topics that elicit curiosity, surprise, or a desire to understand something new about the technology around them.
- **Impact Over Implementation:** Focus on what the tech *does* for people or society, not the intricate details of *how* it's built.

You are NOT trying to impress tech experts. You ARE trying to make technology accessible and fascinating for everyone.`;

  const topicSelectionPrompt = `
Your task is to propose **ONE compelling blog topic** based on the provided tech context. This topic must be highly engaging for a **general, non-technical audience** – people who are curious about technology but don't have a deep technical background.

**LATEST TECH INSIGHTS (Summarized for a general audience):**
${summarizedTechContext} 

**EXISTING BLOG POST TITLES (to avoid duplication):**
${existingTopicsContext} 

**BLOG CATEGORY FOCUS (Optional Guide):**
${categoryCountsText} 

**TOPIC SELECTION GUIDELINES (for a NON-TECHNICAL audience):**

1.  **Broad Appeal & Curiosity:**
    *   Choose a topic that answers a question an average person might have, explains a common tech interaction, or reveals a surprising aspect of how tech impacts daily life, work, or society.
    *   Think: "What would make someone click and read, even if they don't consider themselves 'into tech'?"

2.  **Simple & Intriguing Framing:**
    *   The topic title should be catchy, use plain language, and clearly hint at the value or interest for the reader.
    *   Avoid technical jargon or overly niche concepts in the title.
    *   *Examples of good angles:* "The Secret Tech That Powers Your Food Delivery," "Is Your Smart Speaker *Really* Listening? What You Need to Know," "Could This AI Write Your Next Email? The Future of [X]", "What Happens When Self-Driving Cars Make Mistakes?"

3.  **Fresh & Distinctive (for this audience):**
    *   The topic should feel fresh and not like something they've read a hundred times in overly technical terms.
    *   It must not substantially overlap with the *intent* and *angle* of existing posts listed above, especially if those posts are already aimed at a general audience.

4.  **Focus on "What it Means for ME/US":**
    *   Prioritize topics that clearly explain the benefits, drawbacks, interesting uses, or societal implications of a technology.
    *   The "why should I care?" should be immediately obvious.

5.  **Content Angle: Explanatory & Engaging:**
    *   Favor topics that allow for:
        *   Simple explanations of complex tech (using analogies).
        *   Real-world examples and stories.
        *   Discussion of benefits, risks, or cool future possibilities.
    *   Avoid deep technical dives, engineering strategies, or code-level discussions.

6.  **Category Consideration (Lightly):**
    *   If a good, audience-appropriate topic aligns with an underrepresented category, that's a bonus, but **never sacrifice audience appeal or relevance for a category.**

**Please provide the information for the following fields:**
-   **TOPIC_TITLE:** Your Chosen Topic Title Here (Catchy, clear, and for a general audience)
-   **HOOK_DESCRIPTION:** 1-2 concise sentences that would make a non-technical person want to read this post. Explain what it's about and *why it's interesting or relevant to them*.
-   **POTENTIAL_SEARCH_QUERIES:** 3-5 simple, natural language search phrases an average person (not a tech expert) might type into Google if they were curious about this subject. (e.g., "how does facial recognition work," "is AI safe," "what's new with smart homes").

**The output will be structured as JSON according to the defined schema.**
`;

  const topicSelectionResponseSchema = {
    type: Type.OBJECT,
    properties: {
      TOPIC_TITLE: {
        // Match the keys you want in your JSON
        type: Type.STRING,
        description:
          "The catchy, clear blog topic title for a general audience.", // Descriptions are good practice
      },
      HOOK_DESCRIPTION: {
        type: Type.STRING,
        description:
          "1-2 concise sentences to hook a non-technical reader, explaining relevance.",
      },
      POTENTIAL_SEARCH_QUERIES: {
        type: Type.ARRAY,
        description:
          "3-5 simple, natural language search phrases an average person might type.",
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ["TOPIC_TITLE", "HOOK_DESCRIPTION", "POTENTIAL_SEARCH_QUERIES"], // Specify required fields
  };

  try {
    // Generate topic selection using AI
    const topicSelectionResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      // model: "gemini-2.0-flash",
      config: {
        systemInstruction: topicSelectionSystemPrompt,
        responseMimeType: "application/json",
        responseSchema: topicSelectionResponseSchema,
      },
      contents: topicSelectionPrompt,
    });

    // Extract text from the response
    const topicJsonString = topicSelectionResponse.text || "";

    if (!topicJsonString) {
      console.error("❌ AI did not return any text for topic selection.");
      return false;
    }

    let selectedTopicData;
    try {
      selectedTopicData = JSON.parse(topicJsonString);
    } catch (e) {
      console.error(
        "❌ Failed to parse JSON from AI response for topic selection:",
        e
      );
      console.error("Raw AI response:", topicJsonString);
      return false;
    }

    // Validate that all required components were extracted
    // The schema should enforce this, but an extra check doesn't hurt
    if (
      !selectedTopicData.TOPIC_TITLE ||
      !selectedTopicData.HOOK_DESCRIPTION ||
      !selectedTopicData.POTENTIAL_SEARCH_QUERIES
    ) {
      console.error(
        "❌ Missing one or more required fields in the parsed JSON topic selection."
      );
      console.error("Parsed data:", selectedTopicData);
      return false;
    }

    // Now you can access the data directly:
    const selectedTopic = selectedTopicData.TOPIC_TITLE;
    const topicDescription = selectedTopicData.HOOK_DESCRIPTION;
    const searchTerms = selectedTopicData.POTENTIAL_SEARCH_QUERIES; // This will be an array

    console.log("✅ Successfully parsed topic selection:");
    console.log("Topic Title:", selectedTopic);
    console.log("Hook Description:", topicDescription);
    console.log("Search Queries:", searchTerms);

    // Parse the topic selection using regex to extract key components
    // const topicMatch = topicText.match(/TOPIC:\s*(.*?)(?:\n|$)/);
    // const descriptionMatch = topicText.match(/DESCRIPTION:\s*(.*?)(?:\n|$)/);
    // const searchTermsMatch = topicText.match(/SEARCH_TERMS:\s*(.*?)(?:\n|$)/);

    // Validate that all required components were extracted
    // if (!topicMatch || !descriptionMatch || !searchTermsMatch) {
    //   console.error("❌ Failed to parse topic selection");
    //   return false;
    // }

    // // Extract and clean the topic components
    // const selectedTopic = topicMatch[1].trim();
    // const topicDescription = descriptionMatch[1].trim();
    // const searchTerms = searchTermsMatch[1].trim();
    // console.log("- Selected Topic:", selectedTopic);

    // Stage 3: Outline Generation
    console.log("STAGE 3: Generating Blog Post Outline...");

    const outlineSystemPrompt = `
    You are an expert "Story Shaper" for a technology blog that makes complex tech topics easy and enjoyable for a **general, non-technical audience.** Your goal is to create blog post outlines that tell a compelling story, explain concepts simply, and highlight why the topic matters to everyday people.

Core Principles for Outlining:
- **Audience-Centric Structure:** The outline must flow logically for someone without a tech background. Start with what they might know or wonder, then gently guide them through the explanation and its relevance.
- **Explain, Don't Assume:** Assume the reader has little to no prior knowledge of the specific tech. Every section should build understanding.
- **Focus on "What," "Why," and "So What?":**
    - **What is it?** (Simple explanation)
    - **Why is it happening/being developed?** (The problem it solves or opportunity it creates)
    - **So what does it mean for me/us?** (Impact, benefits, concerns, cool examples)
- **Relatability Through Examples & Analogies:** The outline should prompt for the use of real-world examples and simple analogies to explain technical ideas.
- **Narrative Flow:** Think of the blog post as a short, engaging lesson or story, not a technical specification.
- **Clear Takeaways:** Ensure the outline leads to a conclusion that offers a simple, memorable takeaway message.`;

    const outlinePrompt = `
    Your task is to create a blog post outline for the given topic, specifically designed to be engaging and understandable for a **general, non-technical audience.**

**Chosen Topic Title (for a general audience):**
${selectedTopic} 
// This is the catchy, non-technical title from Step 5

**Hook Description (why a non-technical person should care):**
${topicDescription} 
// This is the hook description from Step 5

**Potential Search Queries (what an average person might search for):**
${searchTerms} 
// These are the simplified search queries from Step 5

**OUTLINE GENERATION INSTRUCTIONS (for a NON-TECHNICAL audience):**

1.  **Target Length & Structure:**
    *   Aim for a post of approximately **800-1200 words** (around a 5-7 minute read for an average reader).
    *   Structure with an Introduction, 2-4 main explanatory sections, and a Conclusion.

2.  **Markdown Format:**
    *   Use clear Markdown headings (e.g., '## Catchy Section Title') and bullet points ('*' or '-') for sub-topics within each section.

3.  **Section Content - Focus on Explanation & Impact:**
    *   **Introduction:**
        *   Start with a relatable question, scenario, or surprising fact connected to the topic.
        *   Briefly state what the post is about in *very simple terms*.
        *   Clearly tell the reader *why this topic is interesting or relevant to them* (connect to the 'Hook Description').
    *   **Main Sections (## What's the Deal With [Simplified Concept]?, ## Why Should You Care?, ## The Cool (or Concerning) Stuff):**
        *   Each main section title should be engaging and hint at the content in plain language.
        *   For each main section, include 2-4 sub-points. These sub-points should guide the writer to:
            *   Explain a core aspect of the topic simply (e.g., "* Think of it like a [simple analogy]").
            *   Provide real-world examples a non-tech person can understand (e.g., "* You see this when you [common activity]").
            *   Discuss benefits, potential downsides, or interesting future possibilities (e.g., "* This could mean [positive outcome] for your daily commute," or "* One thing to watch out for is [potential concern]").
            *   Answer the "So what?" for the reader.
    *   **Conclusion (## What This Means for You / The Big Picture):**
        *   Briefly summarize the main takeaway in simple terms.
        *   Offer a final thought-provoking idea or a simple action/awareness point for the reader.
        *   End on an engaging or empowering note.

4.  **Key Considerations for Sub-points:**
    *   Instead of technical details (like "Improved latency"), focus on user-facing benefits or understandable concepts (e.g., "* Making your apps feel faster," "* How this helps avoid those annoying lags").
    *   Prompt for analogies or simple definitions if a slightly more technical idea needs to be introduced.

5.  **Logical & Engaging Flow:**
    *   Ensure the outline moves from basic understanding to broader implications in a way that's easy to follow.
    *   The progression should build curiosity and understanding, not overwhelm with technicalities.

**OUTPUT THE OUTLINE BELOW:**
Important: Output *only* the raw Markdown content for the outline, starting directly with the first heading (e.g., '## Hook 'Em In: Why [Topic] is More Interesting Than You Think!'). Do not include any extra text or explanations.
    `;

    const outlineResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      // model: "gemini-2.0-flash",
      config: {
        systemInstruction: outlineSystemPrompt,
      },
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
      supabase,
      polishedDraft || "",
      selectedTopic
    );

    // STAGE 9: Markdown Validation
    console.log("Stage 9: Validating markdown...");
    const validatedMarkdown = await validateMarkdownSyntax(
      genAI,
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

    // Prepare research data for storage
    const researchDetailsForStorage = formatResearchForStorage(researchResults);

    return await savePostToDatabase(supabase, {
      title: blogMetadata?.title || "",
      slug: generateSlug(blogMetadata?.title || ""),
      description: blogMetadata?.metaDescription || "",
      content: validatedMarkdown,
      category: blogMetadata?.category || 6,
      image_url: imageUrl,
      read_time: blogMetadata?.readTimeMinutes || 0,
      tags: blogMetadata?.tags || [],
      research_details: researchDetailsForStorage,
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
  let researchFindingsString = "RESEARCH FINDINGS (Cite using ID):\n\n";
  const researchEntriesForPrompt: Array<{
    id: string;
    point: string;
    text: string;
    sourcesText?: string;
  }> = [];
  let researchIndex = 0;

  if (researchResults.size > 0) {
    researchResults.forEach((result, point) => {
      const entryId = `ref-${researchIndex}`; // Create unique ID
      researchIndex++;
      let sourcesStr = "";
      if (result.sources && result.sources.length > 0) {
        const sourceTitles = result.sources
          .map((s) => s.title || s.uri?.split("/")[2] || "Unknown Source")
          .filter(Boolean);
        if (sourceTitles.length > 0) {
          sourcesStr = `[Sources Used: ${sourceTitles.join(", ")}]`; // Note for LLM context
        }
      }
      researchEntriesForPrompt.push({
        id: entryId,
        point: point,
        text:
          result.groundedText && !result.groundedText.startsWith("Error")
            ? result.groundedText
            : `(No specific data found or error: ${result.groundedText})`, // Still pass error info
        sourcesText: sourcesStr || undefined,
      });
    });

    // Format for the prompt string, including the ID
    researchFindingsString += researchEntriesForPrompt
      .map(
        (entry) =>
          `ID: ${entry.id}\nOutline Point: "${entry.point}"\nGrounded Text: ${
            entry.text
          } ${entry.sourcesText || ""}\n`
      )
      .join("\n");
  } else {
    researchFindingsString +=
      "No specific research data was gathered for this topic.\n";
  }

  // const generationPrompt = `
  //   You are an expert technical writer specializing in creating engaging and informative blog posts about technology topics.

  //   Your task is to write a first draft of a blog post based on the provided topic, outline, and research findings.
  //   A key requirement is to insert reference markers linking text back to the specific research findings used.

  //   **Topic:**
  //   ${topic}

  //   **Blog Post Outline (Structure to follow):**
  //   \`\`\`markdown
  //   ${outlineMarkdown}
  //   \`\`\`

  //   **Research Findings (Cite using the provided ID):**
  //   ${researchFindingsString}

  //   **CRITICAL INSTRUCTIONS FOR WRITING AND CITING:**
  //   1.  **Follow the Outline:** Strictly adhere to the structure in the Outline. Use the headings and cover the points mentioned.
  //   2.  **Integrate Research:** Use the "Grounded Text" from the Research Findings to provide details, facts, or examples for matching "Outline Points". Weave this information naturally into your writing.
  //   3.  **INSERT REFERENCE MARKERS:** Immediately after a sentence or phrase that relies *primarily* on information from a specific entry in the Research Findings, you MUST insert its corresponding unique ID marker in the exact format: \`[ref:ID]\`. For example, if you use data from the entry with ID \`ref-5\`, insert \`[ref:ref-5]\` right after the relevant text.
  //       *   Be precise. Place the marker directly adjacent to the information it supports.
  //       *   If a paragraph synthesizes info from multiple research points, you might need multiple markers.
  //       *   If a sentence uses only general knowledge or elaborates without specific research data, DO NOT insert a marker.
  //   4.  **Handle Missing/Error Research:** If "Grounded Text" indicates no data/error, or an outline point has no matching research, write that section using your general knowledge. DO NOT insert a marker for these parts.
  //   5.  **Expand and Elaborate:** Create flowing paragraphs. Don't just list research; synthesize it into a coherent narrative around the outline points.
  //   6.  **Tone:** Maintain an informative, engaging, and technically accurate tone suitable for the tech audience.
  //   7.  **Format:** Output the entire blog post draft in **Markdown format**. Ensure proper syntax.
  //   8.  **Completeness:** Cover all sections of the outline comprehensively.
  //   9.  **Introduction and Conclusion:** Write compelling intro/conclusions.
  //   10. **IGNORE Other Citation Styles:** Only use the \`[ref:ID]\` marker format as specified in Instruction 3.

  //   **Output only the final Markdown blog post draft with the embedded [ref:ID] markers.** Do not include any introductory phrases, explanations, or meta-commentary. Start directly with the first line of the Markdown (likely the main title).
  // `;

  // --- 2. Craft the Generation Prompt ---

  const generationSystemPrompt = `
  You are a gifted "Tech Storyteller" and writer. Your superpower is transforming complex technology topics into clear, engaging, and enjoyable blog posts for a **general, non-technical audience.** You excel at making people feel smart and curious about technology, even if they don't consider themselves "techy."

Core Writing Principles:
- **Speak Their Language:** Use simple, everyday words. Avoid jargon. If a slightly technical term is absolutely necessary (and was planned in the outline), ensure it's immediately explained with a relatable analogy or simple definition.
- **Be Conversational & Friendly:** Write as if you're explaining something fascinating to a friend over coffee. Keep the tone approachable, enthusiastic, and encouraging.
- **Focus on "Why it Matters to Them":** Continuously connect the dots between the technology and its impact on the reader's daily life, common problems, or the world around them.
- **Tell a Story:** Even when explaining facts, weave them into a narrative. Use examples, anecdotes, and a clear flow to keep readers hooked.
- **Clarity is King:** Short sentences, short paragraphs. Break down complex ideas into small, digestible chunks. Use headings and bullet points to guide the eye.
- **Maintain Accuracy (with simple explanations):** While simplifying, ensure the core information remains accurate. The research provided is your factual backbone.

Your goal is to draft a blog post that someone with no prior tech knowledge can read, understand, enjoy, and feel they've learned something valuable or interesting from.
`;

  const generationPrompt = `
Your task is to write the first draft of a blog post. This post is based on the provided topic, outline, and research findings, and it's specifically for a **general, non-technical audience.**

**Blog Post Topic (Catchy and for a general audience):**
${topic}

**Blog Post Outline (Follow this structure for a non-technical reader):**
\`\`\`markdown
${outlineMarkdown}
\`\`\`

**Research Findings (Source Material):**
Below are research findings. Each finding begins with an "ID:" line (e.g., "ID: ref-0", "ID: ref-1"). When you use information from the "Grounded Text:" of a specific finding, you MUST cite its corresponding unique ID.
\`\`\`
${researchFindingsString}

// The researchFindingsString you provide is formatted like:
// ID: ref-0
// Outline Point: "Some point"
// Grounded Text: The actual research text for ref-0 is here.
// ---
// ID: ref-1
// Outline Point: "Another point"
// Grounded Text: The research text for ref-1.
// (And so on for other IDs like ref-2, ref-3, etc.)
\`\`\`

**CRITICAL INSTRUCTIONS FOR WRITING AND CITING (for a NON-TECHNICAL audience):**

1.  **Target Audience & Tone:**
    *   **Audience:** Normal, everyday people curious about tech but without a technical background.
    *   **Tone:** Friendly, conversational, engaging, and enthusiastic.
    *   **Language:** Simple words, short sentences. **Strictly avoid jargon** unless explained.
    *   **Goal:** Inform and intrigue, not intimidate. Explain *why this topic matters to them*.

2.  **Content & Structure (Based on the Audience-Focused Outline):**
    *   Follow the \`outlineMarkdown\` precisely.
    *   **Explain concepts simply.** Use analogies and real-world examples.
    *   Focus on "what," "why interesting/important," and "how it affects me/us."
    *   **Length:** Aim for **800-1200 words**.
    *   Use **short paragraphs**, subheadings, and bullet points for readability.

3.  **Cite Research with Markers (VERY IMPORTANT - Use the ACTUAL ID from the "ID:" line of each Research Finding):**
    *   When you incorporate specific information, facts, or direct examples **taken directly from the "Grounded Text:" of a research finding listed above**, you MUST insert the **ACTUAL unique ID** found on its "ID:" line (e.g., \`ref-0\`, \`ref-1\`, \`ref-12\`).
    *   The citation format you must produce in your output is \`[ref:ACTUAL_ID_HERE]\`. For example, if the research finding you used has "ID: ref-5" at its start, your citation in the text must be exactly \`[ref:ref-5]\`.
    *   **Do NOT write "[ref:ref-ID]" or "[ref:ID]" or "[ref:THE_ACTUAL_ID_HERE]" literally in your output.** You must replace "ACTUAL_ID_HERE" with the specific ID (like \`ref-0\`, \`ref-1\`, \`ref-2\`, etc.) from the "ID:" line of the research snippet you are citing.
    *   If multiple research snippets support the same point, combine their actual, specific IDs: e.g., \`[ref:ref-0, ref:ref-3]\`.
    *   Cite ONLY when referencing a specific piece of data, a direct quote (even if paraphrased), or a very specific example **drawn directly from one of the provided research findings and its associated "Grounded Text:".**
    *   Do **not** cite general explanations you create, common knowledge, or your own connecting narrative, even if inspired by the research.

    **Clear Example of Correct Citation:**
    Given 'Research Findings' that include:
    \`\`\`
    ID: ref-0
    Outline Point: "How AI learns"
    Grounded Text: AI models often learn by processing large datasets.
    ---
    ID: ref-1
    Outline Point: "AI in daily apps"
    Grounded Text: Many apps use AI for recommendations.
    \`\`\`
    Your draft incorporating these should look like:
    \`\`\`markdown
    Artificial intelligence learns in fascinating ways, often by sifting through vast amounts of information [ref:ref-0]. You might even see this in action when your favorite app suggests what you might like next, as many applications now use AI for recommendations [ref:ref-1].
    \`\`\`

4.  **Handling Missing/Invalid Research:**
    *   If a section of the outline requires information not covered by the 'Research Findings' (or if a finding's "Grounded Text:" indicates no data or an error), write that part using clear, general explanations suitable for the audience. **Do not invent facts or use a reference marker in this case.**

5.  **Markdown Output Only:**
    *   Return the entire blog post as valid **Markdown**.
    *   Start directly with the blog post title (\`#\` for main heading).
    *   Do **not** include any extra explanation, commentary, or metadata.

**The final draft should be a joy for a non-technical person to read: easy to understand, clearly structured, genuinely interesting, and well-supported by the provided research where appropriate (and correctly cited using the SPECIFIC IDs like [ref:ref-0], [ref:ref-1], etc., from the 'Research Findings').**
`;

  try {
    // --- 3. Call Gemini API ---
    // const countTokensResponse = await genAI.models.countTokens({
    //   model: "gemini-2.5-pro-exp-03-25",
    //   // model: "gemini-2.5-flash-preview-04-17",
    //   contents: generationPrompt,
    // });
    // console.log("Tokens:", countTokensResponse);

    const draftResponse = await genAI.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
      // model: "gemini-2.5-flash-preview-04-17",
      contents: generationPrompt,
      config: {
        systemInstruction: generationSystemPrompt,
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
