# 🏗️ Gia - Architecture Documentation

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                              │
│                         (Next.js 14 App)                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
        ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Pages       │ │  Components  │ │   Lib        │
        │   (Routes)    │ │  (Reusable)  │ │  (Utils)     │
        └───────────────┘ └──────────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
        ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
        │  API Routes   │ │  Supabase    │ │  OpenRouter  │
        │  (Backend)    │ │  (Database)  │ │  (AI)        │
        └───────────────┘ └──────────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   External Services     │
                    │  - Amazon (Shopping)    │
                    │  - Storage (Images)     │
                    └─────────────────────────┘
```

---

## 🔄 Main Data Flows

### 1. Outfit Analysis Flow
```
User → Upload Photo → API Route → OpenRouter AI → Database → Display Results
```

### 2. Chat Conversation Flow
```
User → Send Message → Fetch History → Build Context → AI Response → Save → Display
```

### 3. Style Diagnosis Flow
```
User → Submit Data → Upload Photos → AI Analysis → Save Diagnosis → Show Results
```

---

## 📁 Project Structure

```
gia-fashion-assistant/
├── app/                    # Next.js App Router
│   ├── analyze/           # Chat & outfit analysis
│   ├── api/               # Backend API routes
│   ├── auth/              # Authentication
│   ├── diagnosis/         # Style diagnosis
│   ├── history/           # Outfit history
│   ├── profile/           # User profile
│   └── wardrobe/          # Digital wardrobe
├── components/            # Reusable components
├── lib/                   # Utilities & configs
├── public/                # Static assets
└── supabase/              # Database schemas
```

---

## 🗄️ Database Schema

### Main Tables:
- **profiles** - User information
- **outfit_logs** - Analyzed outfits history
- **wardrobe_items** - Saved wardrobe items
- **chat_messages** - Conversation history
- **style_diagnosis** - Complete style analysis

### Storage Buckets:
- **outfit-images** - Analyzed photos
- **wardrobe-images** - Saved items
- **diagnosis-photos** - Diagnosis photos

---

## 🤖 AI Integration

### OpenRouter Configuration
```
App → OpenRouter Gateway → Grok 4.1 Fast (Free)
```

### AI Features:
- Vision analysis (can see images)
- Conversational memory (last 10 messages)
- Context awareness (occasion, body type)
- Shopping query extraction

---

## 🔐 Security

- **Row Level Security (RLS)** on all tables
- **Auth tokens** verified on every API call
- **Environment variables** for sensitive data
- **User isolation** - can only access own data

---

## 📱 PWA Features

- Installable on mobile devices
- Standalone app experience
- Custom icons (192x192, 512x512)
- Offline-ready manifest

---

## 🎨 Styling

- **Tailwind CSS** - Utility-first
- **Mobile-first** responsive design
- **Glass morphism** effects
- **Custom animations**

---

## 🚀 Performance

- **Next.js Image** optimization
- **Code splitting** per route
- **Lazy loading** components
- **Minimal bundle** size

---

## 📈 Scalability

**Current:** Good for 1-10K users  
**Future:** Can scale with upgraded plans

---

## 🔧 Development

```bash
# Setup
npm install
cp .env.local.example .env.local
# Add your API keys

# Run
npm run dev

# Build
npm run build

# Deploy
vercel deploy
```

---

## 📚 Key Decisions

- **Next.js 14** - Modern, fast, easy deployment
- **Supabase** - Complete backend solution
- **OpenRouter** - Free AI access with Grok
- **Tailwind** - Rapid UI development

---

**Status:** Production Ready ✅  
**Last Updated:** November 2024
