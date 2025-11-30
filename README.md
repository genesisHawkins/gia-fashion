# 👗 Gia - Your AI Fashion Stylist

> **Built with Kiro AI** - From idea to production in record time

## 💡 The Problem

Every day, millions of people stand in front of their closets asking: *"Does this look good?"* They spend money on clothes that don't flatter them, struggle to understand their body type, and lack honest fashion advice. Professional stylists are expensive and inaccessible to most people.

## ✨ Our Solution

**Gia** is your brutally honest AI fashion friend who tells you the truth to help you look better. She analyzes your outfits, understands your body type, remembers your style journey, and gives you actionable advice - all through a conversational chat interface.

Unlike generic fashion apps, Gia has **memory**. She remembers what you're wearing, what she recommended, and adapts her advice as you show her new photos or ask follow-up questions.

## 🎯 Key Features

### 💬 Conversational AI with Memory
Upload a photo, get instant feedback. Ask "What shoes should I wear?" and Gia remembers your outfit. Show her a close-up of your accessories, and she compares it to your original look. **She sees everything and remembers everything.**

### 📊 Complete Style Diagnosis
Not sure what looks good on you? Gia analyzes your:
- **Body Type** (Hourglass, Pear, Apple, Rectangle, Inverted Triangle)
- **Face Shape** (Oval, Round, Square, Heart, Diamond)  
- **Color Season** (Spring, Summer, Autumn, Winter)

Then gives you a personalized style guide you can reference forever.

### 👗 Smart Wardrobe
Save your best outfits, track what you wear, and get AI descriptions for each piece. Never forget that perfect combination again.

### 🛍️ Instant Shopping
Gia recommends a fitted blazer? Click one button and see options on Amazon. No endless scrolling, just smart suggestions.

## 🤖 How Kiro Made This Possible

Building Gia would typically take weeks. With **Kiro AI**, we built it in days. Here's how:

### 🚀 Rapid Development
- **Instant scaffolding**: Kiro generated the entire Next.js structure with proper TypeScript types
- **Smart code generation**: Complex AI prompts, API routes, and database schemas written in minutes
- **Context awareness**: Kiro understood our vision and maintained consistency across 50+ files

### 🧠 Intelligent Problem Solving
- **Database design**: Kiro designed the complete Supabase schema with RLS policies
- **AI integration**: Configured OpenRouter API with vision models and conversational memory
- **Bug fixing**: When issues arose, Kiro debugged and fixed them instantly

### 💡 Creative Collaboration
We described the problem: *"People need honest fashion advice but can't afford stylists"*

Kiro helped us:
1. Design the conversational AI personality (brutally honest but supportive)
2. Implement visual memory (AI sees all images in conversation)
3. Build smart scoring logic (only rate when appropriate)
4. Create seamless shopping integration

**Result**: A production-ready app with complex AI features, built faster than we thought possible.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Chat    │  │ Wardrobe │  │ Diagnosis│  │ History  │  │
│  │ Analysis │  │ Manager  │  │  Flow    │  │  Viewer  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  Next.js API Routes (Server-Side)                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Analyze  │  │   Chat   │  │ Describe │  │ Diagnosis│  │
│  │  Route   │  │  Route   │  │   Item   │  │  Route   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                                    ↓
┌──────────────────────┐          ┌──────────────────────┐
│   OpenRouter API     │          │      Supabase        │
│  (Grok 4.1 Vision)   │          │                      │
│                      │          │  ┌────────────────┐  │
│  • Image Analysis    │          │  │  PostgreSQL    │  │
│  • Conversational AI │          │  │  Auth          │  │
│  • Memory Context    │          │  │  Storage       │  │
│  • Recommendations   │          │  │  RLS Policies  │  │
└──────────────────────┘          └──────────────────────┘
```

**Key Design Decisions:**
- **Conversational Memory**: Last 10 messages stored in context for coherent dialogue
- **Visual Persistence**: Original image included in every chat message
- **Smart Caching**: Supabase stores all analyses for instant history access
- **Mobile-First**: Responsive design optimized for phone usage

## 💻 Tech Stack

**Frontend**: Next.js 14 (App Router) • TypeScript • Tailwind CSS  
**Backend**: Supabase (PostgreSQL + Auth + Storage)  
**AI**: OpenRouter (Grok 4.1 Vision - Free tier)  
**Deployment**: Vercel

## 🎯 Technical Highlights

### 1. Conversational AI with Visual Memory
Most fashion apps analyze one photo and forget. Gia maintains context:
- Stores last 10 messages in conversation
- Includes original image in every API call
- Cross-references new photos with previous recommendations
- Adapts advice based on user feedback

**Example**: User uploads outfit → Gia suggests changing shoes → User asks "what color?" → Gia remembers the outfit and suggests colors that match.

### 2. Smart Scoring System
Gia doesn't spam you with scores. She only rates when:
- Analyzing a new outfit for the first time
- You explicitly ask "rate this"
- Context changes (e.g., "actually it's for a date")

This required custom prompt engineering and frontend filtering.

### 3. Occasion-Aware Recommendations
Every suggestion filters through the occasion context:
- Gym outfit? No makeup recommendations
- Date night? Bolder suggestions
- Work event? Professional alternatives

The AI maintains this context throughout the entire conversation.

### 4. Instant Shopping Integration
When Gia recommends an item, one click shows Amazon options. We extract the first recommendation (not all of them) to avoid overwhelming users.

## � AQuick Start

```bash
# Clone and install
git clone https://github.com/genesisHawkins/gia-fashion.git
cd gia-fashion
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase and OpenRouter keys

# Run database migrations (see supabase/*.sql)

# Start development
npm run dev
```

## 🎨 Design Philosophy

**Mobile-first**: Most people check their outfits on their phone  
**Conversational**: Chat interface feels natural, not robotic  
**Honest**: Gia tells the truth, even if it's not what you want to hear  
**Actionable**: Every critique includes specific suggestions

## 🏆 Why This Matters

Fashion advice shouldn't be a luxury. Gia democratizes access to styling expertise, helping people feel confident in what they wear. Whether you're preparing for a job interview, a first date, or just want to look better daily - Gia is there.

And thanks to **Kiro AI**, we built this complex, production-ready application in a fraction of the time it would normally take.

---

**Built with Kiro AI** • [Live Demo](#) • [Documentation](./FEATURES_SUMMARY.md)

*Hackathon Submission 2024*
