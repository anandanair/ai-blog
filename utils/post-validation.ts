import { lint as lintSync } from "markdownlint/sync";
import { applyFixes } from "markdownlint";

/**
 * Stage 8: Validates the Markdown syntax of the blog post content.
 * @param markdownContent The Markdown string to validate.
 * @param contentIdentifier A name for logging purposes (e.g., the topic or 'refinedDraft').
 * @returns True if the Markdown is valid (no errors found), false otherwise.
 */
export async function validateMarkdownSyntax(
  markdownContent: string,
  contentIdentifier: string = "blogPostDraft"
): Promise<string> {
  // console.log(`\n📏 Validating Markdown syntax for: ${contentIdentifier}...`);

  const options = {
    strings: {
      [contentIdentifier]: markdownContent,
    },
    resultVersion: 3,
  };

  try {
    const results = lintSync(options);
    const errors = results[contentIdentifier];

    let fixedContent = markdownContent;

    if (errors && errors.length > 0) {
      console.warn(
        `❌ Markdown validation found ${errors.length} issue(s) in "${contentIdentifier}":`
      );
      // errors.forEach((error) => {
      //   console.warn(
      //     `  - Line ${error.lineNumber}: [${error.ruleNames.join(", ")}] ${
      //       error.ruleDescription
      //     } ${error.errorDetail || ""} ${
      //       error.errorContext ? `Context: "${error.errorContext}"` : ""
      //     }`
      //   );
      // });

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
