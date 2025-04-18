// Inside CodeBlock.tsx
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Adjust the interface if 'inline' and 'node' are no longer needed here
interface CodeBlockProps {
  language: string | undefined;
  value: string;
  // Remove inline?: boolean;
  // Remove node?: any;
  // Add any other props passed down from the 'code' component if necessary
  [key: string]: any; // Allow passing down other props like props from ReactMarkdown
}

export const CodeBlock = ({
  language,
  value,
  ...props // Capture rest of the props
}: CodeBlockProps) => {
  // No need for inline or paragraph checks here.
  // Assume this component is only used for block code rendering.

  // For standalone code blocks, use the syntax highlighter
  return (
    <SyntaxHighlighter
      language={language}
      style={materialDark}
      customStyle={{
        margin: "1rem 0",
        borderRadius: "0.375rem",
        padding: "1rem",
        fontSize: "0.875rem",
        // Add overflow-x: auto for better handling of long lines if wrapLongLines doesn't suffice
        overflowX: "auto",
      }}
      codeTagProps={{
        style: {
          fontFamily: "var(--font-geist-mono)",
        },
      }}
      wrapLongLines={true} // Keep this or adjust as needed
      {...props} // Spread any remaining props
    >
      {value}
    </SyntaxHighlighter>
  );
};
