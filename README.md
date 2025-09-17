# LegalLens

AI-powered web app to help users understand legal documents (contracts, ToS, leases) in plain English.

## Features

- Smart clause extraction (Payment, Termination, Liability, etc.)
- Plain-language explanations with risks and key points
- Risk-first view (high/medium risks surface to the top)
- Interactive Q&A chat about the uploaded document
- PDF/text upload with preview and progress
- Copy analysis and export to .txt
- Responsive, professional UI (Next.js + TailwindCSS)

## Tech Stack

- Next.js 15 (App Router), TypeScript
- TailwindCSS
- Anthropic Claude API (server-side via API routes)
- PDF parsing (client-side)

## Getting Started

1) Install
```bash
npm install
```

2) Environment variables
Create `.env.local` in the project root (never commit this file):
```
ANTHROPIC_API_KEY=your_claude_api_key
```
Note: `.env*` files are ignored by git via `.gitignore`.

3) Run the dev server
```bash
npm run dev
```
Visit http://localhost:3000

## Project Structure (high level)

```
src/
  app/
    api/
      ai/route.ts      # Clause analysis & Q&A (server-side; uses Anthropic)
      chat/route.ts    # Chat endpoint (server-side)
    page.tsx           # Landing page (hero, features, how-it-works)
    layout.tsx         # Global layout & providers
  components/
    FileUpload.tsx     # Drag-and-drop + pasted text
    DocumentViewer.tsx # Risk-first analysis, copy/export, full doc toggle
    ChatInterface.tsx  # Modern chat UI with suggested prompts
  context/
    DocumentContext.tsx
  types/
    index.ts
  utils/
    ai.ts, pdfUtils.ts
```

## Security & Privacy

- API keys are only used server-side in API routes.
- `.env*` files are git-ignored by default.
- Do NOT hardcode API keys in code or commit them.

## Deployment (Vercel recommended)

- Push to GitHub (do not commit `.env.local`).
- In Vercel project settings, add the env var `ANTHROPIC_API_KEY`.
- Deploy; Vercel will build and serve the app.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # build for production
npm run start   # start production server
```

## Notes

- If you encounter rate/quota issues with the Anthropic API in dev, the API routes include mock fallbacks for basic flows.
- The full document text is optional and collapsible; analysis prioritizes clause insights and risks.
