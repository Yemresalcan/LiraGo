# Bi-Lira / LiraGo

Personal Finance & Bill Management Platform for Turkey. Track your utility bills, receipts, and expenses with AI-powered OCR.

## 🏗️ Architecture

```
bi-lira/
├── mobile/              # Expo React Native app
├── web/                 # Next.js admin dashboard
├── packages/
│   └── shared/          # Shared types, constants, utilities
├── firestore.rules      # Firebase Firestore security rules
├── storage.rules        # Firebase Storage security rules
└── firestore.indexes.json # Performance-optimized indexes
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Firebase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bi-lira

# Install root dependencies
npm install

# Install mobile dependencies
cd mobile && npm install

# Install web dependencies
cd ../web && npm install
```

### Environment Setup

#### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

#### Web (`web/.env.local`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=your_admin_password
```

### Running the Apps

```bash
# Mobile (from root)
npm run mobile
# or
cd mobile && npm start

# Web (from root)
npm run web
# or
cd web && npm run dev
```

## 📱 Mobile App Features

- **Bill Scanning**: AI-powered OCR for utility bills (electricity, water, gas)
- **Expense Tracking**: Track all your receipts and expenses
- **Multi-language**: Turkish and English support
- **Dark Mode**: Full dark mode support
- **Offline Support**: Works offline with automatic sync
- **Push Notifications**: Bill reminders and due date alerts

## 💻 Web Admin Dashboard

- **User Management**: View and manage all users
- **Analytics**: Total expenses, user statistics
- **Receipt Overview**: View all receipts across users
- **Bill Management**: Access all uploaded bills

## 🔒 Security

- Server-side admin authentication
- Firebase Security Rules for Firestore & Storage
- Environment variables for sensitive data
- User data isolation (users can only access their own data)

## 📊 Scalability (10K+ Users)

The app is designed to handle 10,000+ users with:
- **Pagination**: All list queries use cursor-based pagination
- **Firestore Indexes**: Optimized indexes for common queries
- **Error Boundaries**: Graceful error handling
- **Retry Logic**: Automatic retries for network failures
- **Offline Storage**: Local caching with AsyncStorage

## 🛠️ Development

### Code Quality

```bash
# Lint all files
npm run lint

# Format all files
npm run format

# Type check
npm run typecheck:mobile
npm run typecheck:web
```

### Project Structure

```
mobile/src/
├── components/      # Reusable UI components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── i18n/            # Internationalization
├── navigation/      # React Navigation setup
├── screens/         # Screen components
├── services/        # Firebase, OCR services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🚀 Deployment

### Firebase Setup

1. Deploy security rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

2. Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Mobile (EAS Build)

```bash
cd mobile
eas build --platform android
eas build --platform ios
```

### Web (Vercel)

```bash
cd web
vercel deploy
```

## 📝 License

Private - All rights reserved.
