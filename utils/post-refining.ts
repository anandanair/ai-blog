import { GoogleGenAI } from "@google/genai";
import { normalizeMarkdown } from "./helpers";

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
    const SAFETY_MAX_ITERATIONS = 5; // Safety limit to prevent infinite loops
    let isContentSatisfactory = false;
    let previousSatisfactionScore = 0;
    let consecutiveNoImprovementCount = 0;

    // Prepare topic context if available
    const topicContext = topicInfo
      ? `
        TOPIC INFORMATION:
        Topic: ${topicInfo.topic}
        Description: ${topicInfo.description}
        
        DETAILED RESEARCH:
        ${topicInfo.detailedInfo}
        `
      : "";

    // Initialize conversation for the evaluation model
    const evaluationModel = genAI.chats.create({
      model: "gemini-2.0-flash",
      history: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert blog editor. Your job is to evaluate blog posts and provide specific feedback for improvement.
                You will be evaluating the same blog post multiple times as it gets revised.
                
                For each evaluation, focus on:
                1. Content accuracy and depth
                2. Structure and flow
                3. Engagement and readability
                4. SEO optimization
                5. Call-to-action effectiveness
                
                IMPORTANT: You MUST ALWAYS provide your evaluation in EXACTLY this format:
                STRENGTHS: List the strengths of the post
                WEAKNESSES: List specific areas that need improvement
                SUGGESTIONS: Provide specific suggestions for improvement
                SATISFACTION_SCORE: Rate from 1-10 how satisfied you are with the post (be honest and critical)
                IS_SATISFACTORY: Answer YES if the post is ready to publish (score ≥ 8), or NO if it needs more work
                
                The SATISFACTION_SCORE and IS_SATISFACTORY fields are critical and must be included in exactly this format.
                
                If you see that the post has been revised based on your previous feedback, acknowledge the improvements.
                If you notice that despite revisions, certain issues persist or new issues appear, highlight them.
                
                Be thorough but fair in your assessment.`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand my role as an expert blog editor. I'll evaluate blog posts thoroughly, focusing on content accuracy, structure, engagement, SEO, and calls to action. I'll provide structured feedback with strengths, weaknesses, suggestions, a satisfaction score, and a clear yes/no on whether the post is ready to publish. I'll acknowledge improvements in revised versions and highlight any persistent or new issues. My evaluations will be thorough and fair, with honest scoring on the 1-10 scale. I'm ready to begin evaluating whenever you share a blog post.",
            },
          ],
        },
      ],
    });

    while (!isContentSatisfactory && iterations < SAFETY_MAX_ITERATIONS) {
      iterations++;
      console.log(`Polishing iteration ${iterations}...`);

      // Step 1: Evaluate the current content using the conversation
      const evaluationPrompt = `
          I need you to evaluate this blog post:
          
          TITLE: ${title}
          
          ${topicContext}
          
          CONTENT:
          ${currentContent}
          
          This is revision #${iterations}. ${
        iterations > 1
          ? "Please consider your previous feedback when evaluating this version."
          : ""
      }
          
          IMPORTANT: You MUST include a numerical satisfaction score in your response.
          Format it exactly as: "SATISFACTION_SCORE: X" where X is a number from 1 to 10.
          Also include "IS_SATISFACTORY: YES" or "IS_SATISFACTORY: NO" at the end of your evaluation.
        `;

      const evaluationResponse = await evaluationModel.sendMessage({
        message: evaluationPrompt,
      });
      const evaluationText = evaluationResponse.text ?? "";

      console.log(
        "Evaluation response received, extracting satisfaction score..."
      );

      // Parse evaluation results with improved regex and logging
      const satisfactionMatch = evaluationText.match(
        /SATISFACTION_SCORE:\s*(\d+)/i
      );

      // Log a snippet of the evaluation text to debug
      console.log(
        "Evaluation text snippet:",
        evaluationText.substring(0, 200) + "..."
      );

      let currentSatisfactionScore = 0;
      if (satisfactionMatch) {
        currentSatisfactionScore = parseInt(satisfactionMatch[1], 10);
        console.log(`Found satisfaction score: ${currentSatisfactionScore}`);
      } else {
        // Try alternative regex patterns if the first one fails
        const altMatch1 = evaluationText.match(/score:?\s*(\d+)/i);
        const altMatch2 = evaluationText.match(/rating:?\s*(\d+)/i);
        const altMatch3 = evaluationText.match(/(\d+)\s*\/\s*10/i);

        if (altMatch1) {
          currentSatisfactionScore = parseInt(altMatch1[1], 10);
          console.log(
            `Found satisfaction score using alt pattern 1: ${currentSatisfactionScore}`
          );
        } else if (altMatch2) {
          currentSatisfactionScore = parseInt(altMatch2[1], 10);
          console.log(
            `Found satisfaction score using alt pattern 2: ${currentSatisfactionScore}`
          );
        } else if (altMatch3) {
          currentSatisfactionScore = parseInt(altMatch3[1], 10);
          console.log(
            `Found satisfaction score using alt pattern 3: ${currentSatisfactionScore}`
          );
        } else {
          console.warn(
            "⚠️ Could not extract satisfaction score from evaluation text"
          );
          // Default to a slight improvement to avoid early termination
          currentSatisfactionScore = previousSatisfactionScore + 1;
          console.log(
            `Using default improvement score: ${currentSatisfactionScore}`
          );
        }
      }

      const satisfactoryMatch = evaluationText.match(
        /IS_SATISFACTORY:\s*(YES|NO)/i
      );
      isContentSatisfactory = satisfactoryMatch
        ? satisfactoryMatch[1].toUpperCase() === "YES"
        : false;

      console.log(`Satisfaction score: ${currentSatisfactionScore}/10`);

      // Check if we're making progress
      if (currentSatisfactionScore <= previousSatisfactionScore) {
        consecutiveNoImprovementCount++;
        console.log(
          `No improvement detected (${consecutiveNoImprovementCount} consecutive times)`
        );

        // If we've had 2 iterations with no improvement, stop
        if (consecutiveNoImprovementCount >= 2) {
          console.log(
            "Stopping refinement as no further improvements are being made"
          );
          break;
        }
      } else {
        consecutiveNoImprovementCount = 0;
      }

      previousSatisfactionScore = currentSatisfactionScore;

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
          
          IMPORTANT: 
          1. DO NOT include any hyperlinks in your content. If you want to mention resources, just mention them by name without creating links.
          2. Return ONLY the revised content in markdown format WITHOUT any code block delimiters.
          3. DO NOT include \`\`\`markdown or \`\`\` around your response.
          4. Just return the raw markdown content directly.
        `;

      const revisionResponse = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: revisionPrompt,
      });

      let revisedContent =
        revisionResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Remove markdown code block delimiters if present
      revisedContent = normalizeMarkdown(revisedContent);

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

    if (iterations >= SAFETY_MAX_ITERATIONS) {
      console.log(
        "Reached maximum number of iterations. Using the latest version."
      );
    }
    return currentContent;
  } catch (error) {
    console.error("❌ Error polishing blog post:", error);
    return null;
  }
}
