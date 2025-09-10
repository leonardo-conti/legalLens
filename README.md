# LegalLens

LegalLens is a web application that helps users understand legal documents in plain English using AI. Upload your contracts, terms of service, or other legal documents and get clear explanations and risk assessments.

## Features

- 📄 Upload PDF documents or paste text directly
- 🤖 AI-powered analysis of legal clauses
- 💬 Ask questions about your documents in plain English
- ⚠️ Automatic risk assessment and flagging
- 📝 Simple explanations of complex legal terms

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the project root with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Run the development server:
```bash
npm run dev
```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- OpenAI API
- PDF parsing with pdf-parse
- React Dropzone for file uploads

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── FileUpload.tsx  # File upload component
│   ├── DocumentViewer.tsx  # Document analysis view
│   └── ChatInterface.tsx   # Q&A chat interface
├── context/            # React context providers
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and AI helpers
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
