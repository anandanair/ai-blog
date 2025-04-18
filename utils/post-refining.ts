import { GoogleGenAI } from "@google/genai";

/**
 * Polishes a blog post through multiple iterations of evaluation and revision
 * @param genAI The Google GenAI instance
 * @param title The blog post title
 * @param content The initial blog post content
 * @param topicInfo Additional context about the topic
 * @returns The polished blog post content or null if polishing failed
 */
export async function polishBlogPost(
  genAI: GoogleGenAI,
  title: string,
  content: string,
  topicInfo?: { topic: string; description: string; detailedInfo: string }
): Promise<string | null> {
  try {
    let currentContent = content;
    let iterations = 0;
    const MAX_ITERATIONS = 2; // Limit iterations to prevent infinite loops
    let isContentSatisfactory = false;

    // Prepare topic context if available
    const topicContext = topicInfo 
      ? `
        TOPIC INFORMATION:
        Topic: ${topicInfo.topic}
        Description: ${topicInfo.description}
        
        DETAILED RESEARCH:
        ${topicInfo.detailedInfo}
        `
      : '';

    while (!isContentSatisfactory && iterations < MAX_ITERATIONS) {
      iterations++;
      console.log(`Polishing iteration ${iterations}/${MAX_ITERATIONS}...`);

      // Step 1: Evaluate the current content
      const evaluationPrompt = `
          You are an expert blog editor. Evaluate the following blog post and provide specific feedback for improvement.
          Focus on:
          1. Content accuracy and depth
          2. Structure and flow
          3. Engagement and readability
          4. SEO optimization
          5. Call-to-action effectiveness
  
          TITLE: ${title}
          
          ${topicContext}
          
          CONTENT:
          ${currentContent}
          
          Provide your evaluation in this format:
          STRENGTHS: List the strengths of the post
          WEAKNESSES: List specific areas that need improvement
          SUGGESTIONS: Provide specific suggestions for improvement
          SATISFACTION_SCORE: Rate from 1-10 how satisfied you are with the post
          IS_SATISFACTORY: Answer YES if the post is ready to publish (score ≥ 8), or NO if it needs more work
        `;

      const evaluationResponse = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: evaluationPrompt,
      });

      const evaluationText =
        evaluationResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Parse evaluation results
      const satisfactionMatch = evaluationText.match(
        /IS_SATISFACTORY:\s*(YES|NO)/i
      );
      isContentSatisfactory = satisfactionMatch
        ? satisfactionMatch[1].toUpperCase() === "YES"
        : false;

      if (isContentSatisfactory) {
        console.log("✅ Content is satisfactory after evaluation");
        break;
      }

      // Step 2: Revise the content based on evaluation
      const revisionPrompt = `
          You are an expert blog writer. Revise and improve the following blog post based on the editor's feedback.
          
          TITLE: ${title}
          
          ${topicContext}
          
          ORIGINAL CONTENT:
          ${currentContent}
          
          EDITOR'S FEEDBACK:
          ${evaluationText}
          
          Please provide a revised version of the blog post that addresses the feedback.
          Keep the same overall structure but improve the content according to the suggestions.
          Return ONLY the revised content in markdown format.
        `;

      const revisionResponse = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: revisionPrompt,
      });

      const revisedContent =
        revisionResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (revisedContent.trim().length > 0) {
        currentContent = revisedContent;
        console.log(
          `✅ Successfully revised content in iteration ${iterations}`
        );
      } else {
        console.error("❌ Failed to generate revised content");
        break;
      }
    }

    return currentContent;
  } catch (error) {
    console.error("❌ Error polishing blog post:", error);
    return null;
  }
}
