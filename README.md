# AI-Powered Tech Blog Platform

A modern, AI-driven tech blog platform built with Next.js and Supabase, featuring automated content generation and rich content presentation capabilities.

## Features

- 🤖 AI-Powered Content Generation

  - Automated blog post generation using Google's Gemini AI
  - Smart topic selection and research
  - Metadata and image prompt generation

- 📱 Modern Web Application

  - Built with Next.js for optimal performance
  - Responsive design with dark/light theme support
  - SEO-optimized content structure

- 🔍 Rich Content Features

  - Code syntax highlighting
  - Reference tooltips with source citations
  - Category-based content organization
  - Search functionality
  - RSS feed support

- 🗄️ Robust Backend
  - Supabase database integration
  - Automated post scheduling
  - View count tracking
  - Category management

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Supabase
- **AI Integration**: Google Gemini AI
- **Content**: Markdown with custom extensions
- **Deployment**: Vercel (assumed based on configuration)

## Project Structure

```plaintext
├── src/                  # Source code
│   ├── app/             # Next.js app router components
│   ├── components/      # Reusable React components
│   ├── lib/            # Core library functions
│   └── utils/          # Utility functions
├── generators/         # AI post generation logic
├── scripts/           # Utility scripts (RSS generation, etc.)
├── public/            # Static assets
└── utils/             # Global utility functions
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SITE_URL=your_site_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```
## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/ai-blog.git
    cd ai-blog
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    - Copy `.env.example` to `.env.local` (if `.env.example` exists, otherwise create `.env.local` manually).
    - Fill in all required environment variables. (See Environment Variables section below - add this section to your readme)

4.  **Run development server:**

    ```bash
    npm run dev
    ```

    Open `http://localhost:3000` with your browser to see the result.

5.  **Build for production:**

    ```bash
    npm run build
    ```

## Content Generation

The platform leverages Google's Gemini AI for automated content generation. The process typically involves:

1.  **Topic Selection:** The system can be guided or can autonomously identify relevant tech topics based on current trends, existing content gaps, or predefined strategies.
2.  **Research & Grounding:** AI gathers information from various sources, which can be configured to include specific trusted websites or internal knowledge bases to ensure accuracy and relevance.
3.  **Content Creation:** Gemini AI drafts the blog post, focusing on creating engaging, informative, and accessible technical content. This includes structuring the article, writing paragraphs, and explaining complex concepts clearly.
4.  **Refinement & SEO:** The generated content can be reviewed and refined. The system also assists in generating SEO-friendly metadata, such as titles, descriptions, and keywords, as well as prompts for generating relevant images.

The core logic for content generation can be found in the `generators/` directory, particularly in files like `generate-post.ts`.

## Scripts

The `package.json` file defines several scripts for managing the project:

- `npm run dev`: Starts the Next.js development server, typically on `localhost:3000`.
- `npm run build`: Builds the application for production. This process also triggers the generation of the RSS feed.
- `npm run start`: Starts the Next.js production server after a build.
- `npm run lint`: Runs ESLint to check for code quality and style issues.
- `npm run format`: Formats code using Prettier.
- `npm run generate-sitemap`: Generates the `sitemap.xml` file.
- `npm run generate-rss`: Generates the `rss.xml` file.
- `npm run generate-post`: (If you have a specific script for this, otherwise this is a conceptual step handled by backend logic or manual triggering of generator scripts).

## Contributing

As this is a private repository, contributions are likely managed internally. If you plan to open it up or have a team:

1.  Fork the repository (if applicable for your workflow).
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request for review.

## Private Repository Notice

**This is a private repository. Access and use of this codebase are restricted. Please ensure you have the necessary authorization.**

## License

Private - All Rights Reserved.

(If you intend to use a specific open-source license later, you can replace the above line with, for example, "This project is licensed under the MIT License - see the LICENSE file for details.")

