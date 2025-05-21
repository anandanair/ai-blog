const nextJest = require('next/jest')

// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports (if any in components, though unlikely for these specific ones)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Alias for @/ pointing to src/
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // If you're still facing issues with ESM modules in node_modules,
  // you might need to add transformIgnorePatterns. next/jest handles many cases,
  // but complex dependencies like react-markdown might need explicit rules.
  transformIgnorePatterns: [
    "/node_modules/(?!remark-gfm|@react-markdown|react-markdown|unified|bail|is-plain-obj|trough|vfile|unist-util-stringify-position|hast-util-whitespace|remark-parse|remark-rehype|mdast-util-to-hast|micromark|micromark-extension-gfm|mdast-util-gfm|hast-util-raw|hast-util-to-html|hast-util-is-element|hast-util-has-property|hast-util-to-string|hast-util-parse-selector|hast-util-sanitize|rehype-raw|rehype-sanitize|rehype-stringify|html-void-elements|web-namespaces|comma-separated-tokens|space-separated-tokens|property-information|decode-named-character-reference|character-entities|character-entities-legacy|character-reference-invalid)/",
  ],
  // preset: 'ts-jest' is no longer needed, next/jest handles this.
  // The manual transform for ts-jest and babel-jest is also handled.
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
