# SocialDrive AI

**AI-powered social media content pipeline for Sociamonials users**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (`node -v`)
- npm (`npm -v`)
- Supabase account (free tier)
- Claude API key
- Google Cloud project (for Drive API)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your keys
# - Supabase URL + keys
# - Claude API key
# - Google OAuth + Drive credentials
# - NextAuth secret

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── dashboard/          # Main dashboard
│   ├── api/                # API routes
│   └── rss/                # RSS feed endpoints
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard/          # Dashboard components
│   ├── library/            # Content Library UI
│   └── intelligence/       # Market Intelligence UI
├── lib/
│   ├── supabase/           # Supabase client + queries
│   ├── google-drive/       # Drive API integration
│   ├── ai/                 # Claude + Ollama integration
│   ├── rss/                # RSS generation
│   └── preferences/        # Preference learning
├── hooks/                  # React hooks
└── types/                  # TypeScript types
```

---

## 📋 Build Progress

### Phase 1A: Foundation ✅
- [x] Next.js project initialized
- [x] Dependencies installed
- [x] Folder structure created
- [x] TypeScript types defined
- [x] Supabase client setup
- [ ] Environment variables configured
- [ ] Authentication (NextAuth)
- [ ] Client management UI

### Phase 1B: Core Pipeline
- [ ] Google Drive polling
- [ ] Image upload (Vercel Blob)
- [ ] Claude API integration
- [ ] Content Library UI
- [ ] Preference tracking

### Phase 1C: CSV Export
- [ ] CSV generator (Sociamonials format)
- [ ] Scheduling logic
- [ ] Download functionality
- [ ] User guide

### Phase 2: Automation
- [ ] Sociamonials API (if available)
- [ ] Auto-import
- [ ] Engagement tracking

---

## 🔧 Environment Variables

See `.env.local.example` for all required variables:

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3000` (dev) |
| `NEXTAUTH_SECRET` | Session encryption | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | OAuth login | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth login | Google Cloud Console |
| `GOOGLE_DRIVE_*` | Drive API access | Google Cloud Console |
| `ANTHROPIC_API_KEY` | Caption generation | console.anthropic.com |
| `NEXT_PUBLIC_SUPABASE_*` | Database | supabase.com |
| `BLOB_READ_WRITE_TOKEN` | Image storage | Vercel Dashboard |

---

## 📚 Documentation

- [Build Spec](../SocialDrive_AI/SocialDrive_AI_BuildSpec_v1.2.md)
- [Database Schema](../SocialDrive_AI/database-schema.sql)
- [Project Structure](../SocialDrive_AI/project-structure.md)
- [Test RSS Feeds](../SocialDrive_AI/test-rss-feeds/)

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run tests (when added)
npm test
```

---

## 📦 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Vercel serverless functions
- **Database:** Supabase (Postgres)
- **Auth:** NextAuth.js with Google OAuth
- **AI:** Claude API (captions), Ollama Pro (market intelligence)
- **Storage:** Vercel Blob (images)
- **Integration:** Google Drive API, Sociamonials CSV/API

---

## 🤝 Contributing

This is a private project for SocialDrive AI development.

---

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ by Gabe & David**
