# InterviewerAI - Next.js Full Stack Application

A voice-first AI interview simulator powered by Google Gemini and ElevenLabs, built entirely with Next.js for easy deployment on Vercel.

## Features

- 🎤 Real-time speech recognition using browser Web Speech API
- 🔊 High-quality text-to-speech using ElevenLabs
- 🤖 AI-powered interview questions and evaluations using Google Gemini
- 📊 Detailed interview reports with scoring and feedback
- 🎯 Support for multiple roles and experience levels

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the `frontend` directory:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   ELEVENLABS_VOICE_ID=your-voice-id
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Deployment to Vercel

1. **Push your code to GitHub**

2. **Import project in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `GEMINI_API_KEY`
     - `ELEVENLABS_API_KEY`
     - `ELEVENLABS_VOICE_ID`
   - Optionally add other config variables from `.env.example`

4. **Deploy:**
   - Vercel will automatically deploy on push
   - Or click "Deploy" manually

## Project Structure

```
frontend/
├── app/
│   ├── api/              # Next.js API routes (backend)
│   │   └── session/
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx         # Main page
├── components/           # React components
├── lib/                 # Shared utilities
│   ├── config.ts        # Configuration
│   ├── gemini.ts        # Gemini API client
│   ├── elevenlabs.ts    # ElevenLabs API client
│   ├── interview-engine.ts  # Interview logic
│   ├── prompts.ts       # AI prompts
│   └── sessions.ts      # Session storage
└── types/               # TypeScript types
```

## API Routes

- `POST /api/session/start` - Start a new interview session
- `POST /api/session/[sessionId]/answer` - Submit an answer
- `POST /api/session/[sessionId]/end` - End interview and get report

## Notes

- Sessions are stored in-memory (will reset on server restart)
- For production, consider using Redis or a database for session storage
- API routes have a 60-second timeout (configurable in `vercel.json`)
