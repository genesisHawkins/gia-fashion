# 👗 Gia - Your AI Fashion Stylist

Gia is an intelligent fashion assistant that provides personalized style advice, outfit analysis, and shopping recommendations. Built with Next.js, Supabase, and AI-powered analysis.

![Gia Fashion Assistant](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## 🌟 Features

### 💬 AI Chat Assistant
- **Real-time outfit analysis** with image recognition
- **Conversational memory** - Gia remembers your previous messages
- **Context-aware recommendations** - Considers occasion, body type, and style preferences
- **Shopping integration** - Direct Amazon links for recommended items
- **Score system** - Get honest ratings (X/10) for your outfits

### 👗 Digital Wardrobe
- Save your favorite outfits
- AI-generated descriptions for each item
- Track when you last wore each outfit
- Color and style tagging system
- Easy management with delete functionality

### 📊 Style Diagnosis
Complete personalized style analysis including:
- **Body Type Analysis** (Hourglass, Pear, Apple, Rectangle, Inverted Triangle)
- **Face Shape Analysis** (Oval, Round, Square, Heart, Diamond)
- **Color Season Analysis** (Spring, Summer, Autumn, Winter + subtypes)
- Personalized clothing recommendations
- Hairstyle and accessory suggestions
- Makeup tips tailored to your features

### 📜 Outfit History
- Track all your analyzed outfits
- Filter by occasion (Casual, Work, Date, Party, Gym)
- View detailed AI critiques and body analysis
- Delete unwanted entries
- Average score tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account
- OpenRouter API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd gia-fashion-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API (for AI)
OPENAI_API_KEY=your_openrouter_api_key
```

4. **Set up Supabase database**

Run the SQL scripts in order:
```bash
# 1. Main schema
supabase/schema.sql

# 2. Chat messages
supabase/chat_messages.sql

# 3. Style diagnosis
supabase/style_diagnosis.sql

# 4. Item descriptions
supabase/add_item_description.sql
```

5. **Create Supabase Storage Buckets**

Create these storage buckets in your Supabase dashboard:
- `outfit-images` (for outfit analysis)
- `wardrobe-images` (for saved wardrobe items)
- `diagnosis-photos` (for style diagnosis photos)

Set all buckets to **public** access.

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
├── app/
│   ├── analyze/          # Chat interface for outfit analysis
│   ├── api/              # API routes
│   │   ├── analyze/      # Initial outfit analysis
│   │   ├── chat/         # Conversational chat
│   │   ├── describe-item/# AI item descriptions
│   │   └── style-diagnosis/ # Complete style analysis
│   ├── auth/             # Authentication page
│   ├── diagnosis/        # Style diagnosis flow
│   │   └── results/      # Diagnosis results display
│   ├── history/          # Outfit history
│   ├── profile/          # User profile
│   ├── wardrobe/         # Digital wardrobe
│   └── page.tsx          # Home page
├── components/
│   ├── AuthGuard.tsx     # Protected route wrapper
│   ├── BottomNav.tsx     # Mobile navigation
│   └── GiaAvatar.tsx     # Animated avatar component
├── lib/
│   ├── ai-prompt.ts      # AI prompt templates
│   ├── amazon.ts         # Amazon affiliate integration
│   ├── auth.ts           # Authentication utilities
│   └── supabase.ts       # Supabase client
└── supabase/             # Database schemas
```

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenRouter (Grok 4.1 Fast - Free tier)
- **Icons**: Lucide React
- **Image Handling**: Next.js Image Optimization

## 🤖 AI Features

### Models Used
- **Grok 4.1 Fast (Free)** - Main conversational AI
  - Outfit analysis
  - Chat responses
  - Style recommendations

### AI Capabilities
- Vision analysis (can see and analyze outfit photos)
- Conversational memory (remembers last 10 messages)
- Context awareness (occasion, body type, previous recommendations)
- Shopping query extraction for Amazon integration

## 🗄️ Database Schema

### Main Tables
- `profiles` - User profiles
- `wardrobe_items` - Saved outfits and clothing items
- `outfit_logs` - History of analyzed outfits
- `chat_messages` - Conversational chat history
- `style_diagnosis` - Complete style analysis results

See `supabase/schema.sql` for complete schema.

## 🔐 Authentication

Uses Supabase Auth with:
- Email/Password authentication
- Protected routes with `AuthGuard` component
- Row Level Security (RLS) policies

## 📱 Responsive Design

Fully responsive design optimized for:
- **Mobile** (320px - 640px)
- **Tablet** (640px - 1024px)
- **Desktop** (1024px+)

All features work seamlessly across devices.

## 🛍️ Shopping Integration

Amazon affiliate integration:
- Automatic product recommendations
- Discrete "View recommendation" buttons
- Extracts first recommendation when multiple items suggested
- Affiliate tag: `hackathon-demo-20`

## 🎯 Key Features Implementation

### Conversational Memory
- Stores last 10 messages in context
- Maintains occasion throughout conversation
- Remembers previous recommendations

### Smart Scoring
- Only shows scores when appropriate:
  - Initial image analysis
  - Explicit rating requests
  - Context changes
- Filters out unnecessary scores in frontend

### Visual Context Awareness
- AI sees the original image in every message
- Cross-references outfit with recommendations
- Ensures coherent suggestions (e.g., no formal heels with shorts)

## 🚧 Development

### Available Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## 📝 Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Your Supabase anon key
OPENAI_API_KEY=                   # OpenRouter API key
```

## 🐛 Known Issues & Solutions

### Build Errors
- Ensure all icon components use fixed `size` props (not responsive)
- Check that all Tailwind classes are valid

### AI Response Issues
- If AI gives scores when it shouldn't, check the frontend filter
- If recommendations are incoherent, verify image is being sent in context

## 📚 Documentation

Additional documentation:
- `FEATURES_SUMMARY.md` - Detailed feature breakdown
- `CHAT_IMPLEMENTATION.md` - Chat system architecture
- `supabase/*.sql` - Database schemas with comments

## 🎨 Design System

### Color Palette
- Primary Gold: `#C9A961`
- Secondary Beige: `#E8DCC4`
- Dark: `#2B2B2B`
- Light Gray: `#6B6B6B`
- Background: `#F5F5F5`

### Typography
- Font Family: Geist (Next.js optimized)
- Responsive text sizes using Tailwind's `sm:` breakpoints

### Components
- Glass morphism effects with `backdrop-blur`
- Gradient buttons and badges
- Smooth animations and transitions
- Y2K-inspired card designs

## 🔄 Recent Updates

### Latest Changes (November 2024)
- ✅ Fixed conversational memory in chat
- ✅ Improved AI prompt for better context awareness
- ✅ Added shopping recommendations with Amazon integration
- ✅ Implemented delete functionality for outfit history
- ✅ Enhanced mobile responsiveness across all pages
- ✅ Fixed score display logic (only shows when appropriate)
- ✅ Improved visual coherence in AI recommendations
- ✅ Switched to free Grok model to avoid API credit issues

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve!

## 📄 License

MIT License - feel free to use this project as you wish.

## 🙏 Acknowledgments

- OpenRouter for free AI access
- Supabase for backend infrastructure
- Next.js team for the amazing framework
- Lucide for beautiful icons

---

**Built with 💜 for fashion lovers everywhere**

For questions or support, please open an issue on GitHub.
