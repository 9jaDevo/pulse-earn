# PollPeak Platform

A scalable, community-powered platform for polls, trivia, daily rewards, and monetization through ads, sponsored content, and ambassador commissions.

## 🚀 Live Features

### ✅ **Authentication & User Management**
- **Email/Password Authentication** with Supabase Auth
- **User Profiles** with customizable information
- **Role-based Access Control** (User, Moderator, Ambassador, Admin)
- **Referral System** with unique codes and bonus rewards
- **Protected Routes** with proper authorization

### ✅ **Interactive Polls System**
- **Create & Vote** on community polls
- **Global & Country-specific** polls
- **Real-time Results** with vote counting
- **Search & Filter** functionality
- **Points Rewards** for participation (50 points per vote)
- **Poll Comments** with threaded replies
- **Content Reporting** system for moderation
- **Poll Categories** for better organization

### ✅ **Trivia Challenge System**
- **Daily Trivia Questions** across multiple categories
- **Difficulty Levels** (Easy: 10pts, Medium: 20pts, Hard: 30pts)
- **Streak Bonuses** (10% per day, max 100%)
- **Country-specific Questions** when available
- **Progress Tracking** and statistics

### ✅ **Daily Rewards System**
- **Spin & Win Wheel** with weighted chances (10-250 points)
- **Watch & Win Ads** (15 points per ad)
- **Daily Login Streaks** with multipliers
- **Countdown Timers** for daily resets
- **Reward History** tracking

### ✅ **Gamification & Achievements**
- **Points System** with comprehensive tracking
- **Badge System** with progress tracking
- **Leaderboards** (Global & Country-specific)
- **User Rankings** and statistics
- **Achievement Progress** visualization

### ✅ **Ambassador Program**
- **Referral Commissions** with tier-based rates
- **Performance Dashboard** with analytics
- **Country Metrics** and earnings tracking
- **Tier System** (Bronze 10%, Silver 15%, Gold 20%, Platinum 25%)
- **Real-time Statistics** and reporting
- **Marketing Materials** for ambassadors to promote the platform

### ✅ **Monetization Features**
- **Google AdSense Integration** with multiple ad placements
- **Ad Refresh System** for SPA optimization
- **Revenue Tracking** for ambassadors
- **Commission Calculations** and payouts
- **Sponsored Content** with poll promotion system
- **Multiple Payment Methods** including Stripe, Paystack, and wallet balance

### ✅ **Sponsor & Promoted Polls System**
- **Sponsor Profiles** for organizations and brands
- **Poll Promotion** with budget-based pricing
- **Cost-per-Vote** pricing model
- **Admin Approval Workflow** for promoted content
- **Payment Processing** with multiple gateways
- **Performance Tracking** for promoted polls

### ✅ **User Experience**
- **Responsive Design** for all devices
- **Dark/Light Theme** support
- **Smooth Animations** and micro-interactions
- **Loading States** and error handling
- **Auto-scroll Navigation** for better UX

### ✅ **Legal & Compliance**
- **Privacy Policy** with comprehensive data protection
- **Terms of Service** with clear user guidelines
- **GDPR Compliance** ready
- **Cookie Management** and user consent

### ✅ **Admin Dashboard**
- **User Management** with role assignment
- **Content Moderation** tools
- **Analytics Dashboard** with key metrics
- **System Settings** configuration
- **Poll & Trivia Management**
- **Marketing Materials Management**
- **Promoted Polls Management** with approval workflow
- **Payment Processing** and transaction monitoring

## 🏗️ Architecture Overview

This application is built with a **service-oriented architecture** that separates concerns and makes it easy to migrate from Supabase to a custom Node.js backend or integrate with mobile applications.

### Key Architecture Decisions

1. **Service Layer Pattern**: All data access logic is abstracted into service classes
2. **Type Safety**: Comprehensive TypeScript types for all API interactions
3. **Separation of Concerns**: UI components don't directly interact with the database
4. **Mobile-Ready**: API structure designed for easy consumption by native mobile apps
5. **Modular Components**: Clean component architecture with reusable elements

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ads/            # Advertisement components
│   ├── admin/          # Admin dashboard components
│   ├── ambassador/     # Ambassador program components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── polls/          # Poll-related components
│   ├── profile/        # Profile-related components
│   ├── rewards/        # Reward system components
│   ├── sponsor/        # Sponsor and promoted polls components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   ├── useRewards.ts   # Daily rewards hook
│   ├── usePolls.ts     # Polls management hook
│   ├── useBadges.ts    # Achievement system hook
│   └── useLeaderboard.ts # Leaderboard hook
├── lib/                # Third-party library configurations
├── pages/              # Page components
├── services/           # Data access layer (Service classes)
│   ├── profileService.ts    # User profile operations
│   ├── rewardService.ts     # Daily rewards system
│   ├── pollService.ts       # Polls management
│   ├── badgeService.ts      # Achievement system
│   ├── ambassadorService.ts # Ambassador program
│   ├── referralService.ts   # Referral system
│   ├── moderationService.ts # Content moderation
│   ├── marketingService.ts  # Marketing materials
│   ├── sponsorService.ts    # Sponsor management
│   ├── promotedPollService.ts # Promoted polls
│   └── paymentService.ts    # Payment processing
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🗄️ Database Schema

### Core Tables
- **`profiles`** - User profiles with roles, points, badges, and referral data
- **`polls`** - Community polls with voting options and metadata
- **`poll_votes`** - User votes with one-vote-per-poll constraint
- **`poll_comments`** - User comments on polls with threaded replies
- **`poll_categories`** - Categories for organizing polls
- **`content_reports`** - User reports for inappropriate content
- **`trivia_questions`** - Question bank with categories and difficulties
- **`user_daily_rewards`** - Daily activity tracking and streaks
- **`daily_reward_history`** - Complete history of all earned rewards
- **`badges`** - Achievement definitions with criteria
- **`ambassadors`** - Ambassador program participants
- **`country_metrics`** - Performance analytics by country
- **`moderator_actions`** - Moderation activity logging

### Monetization Tables
- **`marketing_materials`** - Marketing assets for ambassadors
- **`sponsors`** - Sponsor profiles for promoted content
- **`promoted_polls`** - Sponsored poll promotions
- **`payment_methods`** - Available payment methods
- **`transactions`** - Payment transaction records

### Key Features
- **Row Level Security (RLS)** on all tables
- **Automated Triggers** for profile creation and reward tracking
- **Referral System** with unique codes and bonus tracking
- **Point Calculations** with streak multipliers
- **Real-time Updates** with Supabase subscriptions
- **Payment Processing** with multiple gateways

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google AdSense account (optional)
- Stripe account (optional)
- Paystack account (optional)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd pulselearn-platform
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Add your credentials:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Google AdSense Configuration (Optional)
   VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxxx
   VITE_ADSENSE_HEADER_SLOT=1234567890
   VITE_ADSENSE_FOOTER_SLOT=0987654321
   VITE_ADSENSE_SIDEBAR_SLOT=1122334455
   VITE_ADSENSE_CONTENT_SLOT=5544332211
   VITE_ADSENSE_MOBILE_SLOT=9988776655
   
   # Stripe Configuration (Optional)
   VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
   ```

3. **Stripe API Key Configuration**:
   
   PollPeak uses Stripe for payment processing. There are two important keys to configure:
   
   - **Publishable Key**: Used for frontend integration with Stripe.js.
     - Can be set in `.env` file as `VITE_STRIPE_PUBLIC_KEY`
     - Can also be managed through the admin panel (Settings > Integrations)
     - The system will first check the database settings, then fall back to the environment variable
   
   - **Secret Key**: Used for server-side operations (creating Payment Intents, etc.).
     - **IMPORTANT**: This key must be kept secure and never exposed in the frontend
     - Must be configured in your Supabase project's Edge Functions settings
     - Log into your Supabase dashboard, go to Edge Functions, and add `STRIPE_SECRET_KEY` as an environment variable
     - This key is used by the `create-payment-intent` and `stripe-webhook` functions

   If you're experiencing issues with Stripe payments, ensure both keys are properly configured in their respective locations.

4. **Set up Supabase database**:
   - Run the migration files in `/supabase/migrations/` in order
   - Enable Row Level Security on all tables
   - Set up authentication policies

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🔧 Service Layer Benefits

The service layer (`src/services/`) abstracts all data access logic:

### **Easy Backend Migration**
- Only service files need updating when switching from Supabase to Node.js
- Consistent API interfaces across all data operations
- Standardized error handling and response formats

### **Mobile App Integration**
- Services can be adapted to consume REST/GraphQL APIs
- Shared TypeScript types for consistency
- Clean separation between UI and data logic

### **Testing & Maintenance**
- Services can be easily mocked for unit testing
- Centralized business logic
- Simplified debugging and monitoring

## 🎯 Key Features Deep Dive

### **Daily Rewards System**
- **Spin Wheel**: Weighted probability system (40% try again, 60% points)
- **Trivia**: Difficulty-based scoring with streak bonuses
- **Ad Watching**: Fixed 15-point rewards with daily limits
- **Streak Multipliers**: Up to 2x bonus for consistent participation

### **Ambassador Program**
- **Tier-based Commissions**: 10%-25% based on referral count
- **Real-time Analytics**: Performance tracking and earnings
- **Country-specific Metrics**: Localized performance data
- **Automated Payouts**: Commission calculations and tracking
- **Marketing Materials**: Access to promotional assets

### **Gamification Elements**
- **Progressive Badges**: Achievement system with clear criteria
- **Leaderboards**: Global and country-specific rankings
- **Point Economy**: Comprehensive reward system
- **Social Features**: Community polls and discussions

### **Poll System**
- **Creation & Voting**: Create polls and vote on others
- **Categories & Filters**: Organized by topics and regions
- **Comments & Reporting**: Community interaction with moderation
- **Analytics**: View detailed poll performance metrics
- **Promotion System**: Sponsor polls for increased visibility

### **Sponsored Content**
- **Sponsor Profiles**: Create and manage sponsor organizations
- **Poll Promotion**: Promote polls with budget-based pricing
- **Cost-per-Vote Model**: Pay only for actual engagement
- **Multiple Payment Methods**: Stripe, Paystack, and wallet balance
- **Performance Tracking**: Monitor promotion effectiveness

## 🔒 Security & Privacy

- **Row Level Security** enforced on all database operations
- **Input Validation** and sanitization
- **Rate Limiting** on sensitive operations
- **GDPR Compliance** with data export/deletion
- **Secure Authentication** with Supabase Auth
- **Payment Security** with PCI-compliant providers

## 📱 Responsive Design

- **Mobile-first** approach with Tailwind CSS
- **Progressive Web App** capabilities
- **Touch-friendly** interfaces
- **Optimized Performance** for all devices

## 🚀 Deployment

The application is ready for deployment on:
- **Vercel** (recommended for frontend)
- **Netlify** (alternative frontend hosting)
- **Supabase** (backend and database)

## 🔄 Migration Strategy

### From Supabase to Node.js Backend

1. **Create Node.js API endpoints** that match the service method signatures
2. **Update service files** to make HTTP requests instead of Supabase calls
3. **Maintain the same response format** using the `ServiceResponse<T>` interface
4. **No changes needed** in React components or contexts

### For Mobile App Integration

1. **Use the same API endpoints** that the web app will consume
2. **Leverage existing type definitions** in `src/types/api.ts`
3. **Implement similar service classes** in your mobile app
4. **Maintain consistent data structures** across platforms

## 🎨 Design System

- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography
- **Custom Color Palette** with semantic naming
- **Animation System** with smooth transitions
- **Component Library** with reusable elements

## 📊 Analytics & Monitoring

- **User Engagement** tracking
- **Performance Metrics** monitoring
- **Error Logging** and reporting
- **Revenue Analytics** for ambassadors
- **A/B Testing** capabilities

## 🤝 Contributing

1. Follow the service layer pattern for all data access
2. Add proper TypeScript types for new features
3. Maintain separation between UI and data logic
4. Write tests for service methods
5. Update this README when adding new features

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the community, by the community.**