# Change Navigator Bot (CMBot)

An AI-powered chatbot for change management support built with Next.js 15, OpenAI Assistants API, and NextAuth authentication. Designed to help public officers, change champions, and staff understand the Digital Grenada programme.

## 🚀 Features

- **OpenAI Assistant Integration**: Uses OpenAI's Assistants API with thread-based conversations
- **Secure Authentication**: Google OAuth with email whitelist access control
- **Persistent Chat History**: LocalStorage-based chat retention across sessions
- **Rich Markdown Support**: Tables, lists, code blocks, links, and blockquotes
- **Voice Capabilities**:
  - Speech-to-text input via OpenAI Whisper
  - Text-to-speech playback for assistant responses
- **Modern UI/UX**:
  - Professional icons via Lucide React
  - Responsive design with Tailwind CSS 4
  - Smooth animations with Framer Motion
  - Avatar-based message bubbles
  - Hover actions (copy, play audio)
- **Mobile-Friendly**: Optimized interface for phones and tablets

## 📋 Prerequisites

- Node.js 18.18.0 or higher
- OpenAI API key and Assistant ID
- Google OAuth credentials

## 🧰 Tech Stack

### Core Framework
- **Next.js 15** (App Router) — React framework with server + client rendering
- **TypeScript** — Type safety across the application
- **React 19** — UI library

### Styling & UI
- **Tailwind CSS 4** — Utility-first CSS framework
- **Framer Motion** — Smooth animations and transitions
- **Lucide React** — Modern SVG icon library

### AI & Authentication
- **OpenAI Assistants API** — Conversational AI with threading
- **OpenAI Whisper** — Speech-to-text transcription
- **NextAuth.js** — Authentication (Google OAuth)

### Content Rendering
- **react-markdown** — Render assistant responses in Markdown
- **remark-gfm** — GitHub Flavored Markdown support

### Additional Libraries
- **Axios** — HTTP client for API requests
- **date-fns** — Date formatting utilities

### Development Tools
- **ESLint** — Code linting
- **TypeScript 5** — Static type checking

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/change-navigator-bot.git
cd change-navigator-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ASSISTANT_ID=asst_your-assistant-id

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string  # Generate: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate a secure NextAuth secret:**
```bash
openssl rand -base64 32
```

### 4. Configure Allowed Emails

Edit the allowed emails list in `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
const ALLOWED_EMAILS = [
  "your-email@gov.gd",
  "colleague@gov.gd",
  // Add more authorized emails
];
```

## 🏃 Development Commands

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```

### Deploy to Cloudflare Pages
```bash
npm run deploy
```

## 🔐 Authentication Setup

### Google OAuth Configuration

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Required APIs**
   - Navigate to "APIs & Services" → "Library"
   - Search for and enable "Google+ API"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Change Navigator Bot"

4. **Configure Authorized Redirect URIs**
   Add these URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

5. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Add them to your `.env.local` file

## 🤖 OpenAI Assistant Setup

### 1. Create an Assistant

1. Go to [OpenAI Platform](https://platform.openai.com/assistants)
2. Click "Create Assistant"
3. Configure the assistant:
   - **Name**: Change Navigator
   - **Model**: gpt-4-turbo or gpt-4
   - **Instructions**: Use your improved system prompt (see [docs/improved-system-prompt.md](docs/improved-system-prompt.md))

### 2. Add Knowledge Base (Optional)

Upload relevant documents:
- Change management frameworks
- Digital Grenada programme documentation
- FAQ documents
- Policy guidelines

### 3. Configure Tools

Enable:
- **Code Interpreter** (if needed for data analysis)
- **File Search** (for knowledge retrieval)

### 4. Copy Assistant ID

- Copy the Assistant ID (starts with `asst_`)
- Add to `OPENAI_ASSISTANT_ID` in `.env.local`

## 📁 Project Structure

```
change-navigator-bot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth config & email whitelist
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # Main chat endpoint (thread management)
│   │   │   ├── transcribe/
│   │   │   │   └── route.ts          # Whisper speech-to-text
│   │   │   └── search/
│   │   │       └── route.ts          # Optional search endpoint
│   │   ├── ChatApp.tsx               # Main chat UI component
│   │   ├── page.tsx                  # Home page (auth-gated)
│   │   ├── layout.tsx                # Root layout
│   │   ├── providers.tsx             # Session provider wrapper
│   │   └── globals.css               # Global styles
│   └── middleware.ts                 # Route protection (if needed)
├── public/
│   └── icon.png                      # App icon/logo
├── docs/
│   └── improved-system-prompt.md     # Assistant system prompt
├── .env.local                        # Environment variables (DO NOT COMMIT)
├── .env.example                      # Example env variables
├── .gitignore                        # Git ignore file
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
├── next.config.ts                    # Next.js config
└── README.md                         # This file
```

## 🔧 Key Files Explained

### Authentication & Security
- **`src/app/api/auth/[...nextauth]/route.ts`**
  - NextAuth configuration
  - Google OAuth provider setup
  - Email whitelist validation
  - Session management

### Chat Functionality
- **`src/app/api/chat/route.ts`**
  - Creates and manages OpenAI threads
  - Handles message submission
  - Retrieves assistant responses
  - Error handling

### Voice Features
- **`src/app/api/transcribe/route.ts`**
  - Handles audio file upload
  - Calls OpenAI Whisper API
  - Returns transcribed text

### UI Components
- **`src/app/ChatApp.tsx`**
  - Main chat interface
  - Message rendering with Markdown
  - Voice input/output controls
  - LocalStorage persistence
  - Copy/paste functionality

### Frontend Pages
- **`src/app/page.tsx`**
  - Main entry point
  - Authentication check
  - Renders ChatApp when authenticated

## 🎨 UI Features

### Message Display
- **User Messages**: Blue background with user icon avatar
- **Assistant Messages**: White background with bot icon avatar
- **Timestamps**: Shown for all messages
- **Hover Actions**:
  - Copy message button
  - Play audio button (assistant messages only)

### Markdown Rendering
Supports:
- Headers (H1-H4)
- Lists (ordered and unordered)
- Tables with responsive overflow
- Code blocks (inline and block)
- Links with external link icons
- Blockquotes
- Horizontal rules

### Controls
- **Voice Input**: Microphone button for speech-to-text
- **Voice Output**: Toggle auto-play of assistant responses
- **Copy Chat**: Copy entire conversation to clipboard
- **Clear Chat**: Reset conversation and localStorage

## 📦 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import in Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   Add all variables from `.env.local` to Vercel project settings

4. **Deploy**
   - Vercel will automatically build and deploy
   - Update Google OAuth redirect URI to production URL

### Cloudflare Pages

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy using Wrangler**
   ```bash
   npm run deploy
   ```

3. **Configure Environment Variables**
   - Add environment variables in Cloudflare Pages dashboard
   - Update OAuth redirect URIs

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to version control
- ✅ Use `.env.example` to document required variables
- ✅ Rotate secrets regularly
- ✅ Use different API keys for dev and production

### Access Control
- ✅ Maintain strict email whitelist
- ✅ Remove demo/test emails before production
- ✅ Regular access audits
- ✅ Implement session timeouts via NextAuth config

### API Security
- ✅ All API keys server-side only
- ✅ No client-side exposure of secrets
- ✅ Rate limiting on endpoints (implement if needed)
- ✅ Input validation on all API routes

## 🚨 Important Considerations

### LocalStorage Limitations
- Chat history stored **client-side only**
- Data cleared when:
  - Browser cache is cleared
  - User clicks "Clear Chat"
  - Different browser/device is used
- **For production**: Consider implementing server-side chat history storage

### API Costs
- OpenAI Assistants API charges per:
  - Messages sent
  - Thread operations
  - File storage (knowledge base)
- Monitor usage in OpenAI dashboard
- Set usage limits to prevent unexpected charges

### Thread Management
- Each user session maintains a separate thread
- Threads persist in LocalStorage
- New thread created if localStorage is cleared
- Consider implementing thread cleanup/archival

### Voice Features
- Whisper API costs apply per audio minute
- Text-to-speech uses browser's built-in capabilities (free)
- Microphone permissions required for voice input

## 🛠️ Troubleshooting

### Authentication Issues
**Problem**: "Sign in failed" or "Access Denied"
- ✅ Check email is in `ALLOWED_EMAILS` array
- ✅ Verify Google OAuth credentials
- ✅ Confirm redirect URIs match exactly
- ✅ Check `NEXTAUTH_URL` is correct

### Chat Not Working
**Problem**: Messages not sending or receiving
- ✅ Verify `OPENAI_API_KEY` is valid
- ✅ Check `OPENAI_ASSISTANT_ID` exists
- ✅ Review browser console for errors
- ✅ Check OpenAI API status

### Voice Features Not Working
**Problem**: Microphone or audio playback issues
- ✅ Grant microphone permissions
- ✅ Check browser compatibility (Chrome/Edge recommended)
- ✅ Verify Whisper API is enabled
- ✅ Check audio file size limits

## 📊 Monitoring & Maintenance

### Regular Tasks
- Monitor OpenAI API usage and costs
- Review authentication logs
- Update allowed email list as needed
- Keep dependencies updated
- Review and rotate API keys quarterly

### Recommended Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Track user authentication patterns
- Log failed authentication attempts

## 🔄 Future Enhancements

### Potential Improvements
- [ ] Server-side chat history storage
- [ ] Export chat transcripts to PDF/Word
- [ ] Multi-language support
- [ ] Admin dashboard for user management
- [ ] Analytics and usage reporting
- [ ] Enhanced knowledge base management
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or feature requests:
- Create a [GitHub Issue](https://github.com/yourusername/change-navigator-bot/issues)
- Contact the development team
- Review existing documentation

## 🙏 Acknowledgments

- Built for the Government of Grenada
- Digital Grenada Programme
- OpenAI for Assistants API
- Next.js team for the framework
- All contributors and users

---

**Version**: 0.1.0
**Last Updated**: November 2025
**Status**: Active Development
