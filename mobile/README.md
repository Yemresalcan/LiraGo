# Receipt Lira Mobile App

A React Native mobile application for tracking expenses through receipt management, built with Expo, Firebase, and OCR technology.

## Features

- **User Authentication**: Secure login and registration with Firebase Authentication
- **Receipt Management**: Add, view, edit, and delete receipts
- **Image Capture**: Take photos or select images from gallery
- **OCR (Optical Character Recognition)**: Automatic text extraction from receipt images
- **Offline Support**: Works offline with local storage and syncs when online
- **Push Notifications**: Reminders and alerts for receipt management
- **Dashboard**: Visual overview of expenses with category breakdown
- **Multi-language Support**: English and Turkish (ready for expansion)

## Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Offline Storage**: AsyncStorage
- **OCR**: Google Cloud Vision API
- **Notifications**: Expo Notifications
- **Language**: TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator
- Expo Go app on your phone (for testing on physical device)

## Setup Instructions

### 1. Clone the Repository

```bash
cd mobil
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Firebase Storage
5. Get your Firebase configuration
6. Copy `.env.example` to `.env` and add your Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Google Cloud Vision Setup (Optional)

For OCR functionality:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Cloud Vision API
3. Create an API key
4. Add the API key to your `.env` file:

```env
EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key
```

**Note**: If you don't configure Google Cloud Vision, the app will use mock OCR for development.

### 5. Run the App

```bash
# Start the Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
mobil/
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ReceiptContext.tsx
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   │   ├── AppStack.tsx
│   │   ├── AuthStack.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/           # App screens
│   │   ├── AddReceiptScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ReceiptDetailScreen.tsx
│   │   ├── ReceiptListScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/          # External services
│   │   ├── firebase.ts
│   │   ├── notificationService.ts
│   │   └── ocrService.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
├── App.tsx                # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Available Screens

### Authentication
- **Login**: Email/password login
- **Register**: New user registration

### Main App
- **Dashboard**: Overview of expenses and statistics
- **Receipt List**: Browse all receipts with search
- **Add Receipt**: Capture or upload receipt images with OCR
- **Receipt Detail**: View detailed receipt information
- **Profile**: User profile and account information
- **Settings**: App settings and preferences

## Key Features Explained

### OCR Integration

When you take a photo or select an image of a receipt, the app automatically:
1. Uploads the image
2. Processes it with Google Cloud Vision API (or mock OCR)
3. Extracts merchant name, amount, and date
4. Pre-fills the form fields
5. Allows you to review and edit before saving

### Offline Support

- Receipts are cached locally using AsyncStorage
- New receipts can be added offline
- Automatic sync when connection is restored
- Offline receipts are marked with a badge

### Push Notifications

Configure notifications for:
- Receipt reminders
- Daily expense summaries
- Custom alerts

## Firestore Data Structure

### Users Collection
```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - role: 'user' | 'admin'
  - createdAt: timestamp
```

### Receipts Collection
```
receipts/{receiptId}
  - userId: string
  - title: string
  - amount: number
  - currency: string
  - category: string
  - date: timestamp
  - merchant: string
  - description: string
  - imageUrl: string
  - tags: string[]
  - paymentMethod: string
  - isSynced: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
# iOS
expo build:ios

# Android
expo build:android
```

### Publishing Updates

```bash
expo publish
```

## Troubleshooting

### Common Issues

1. **Firebase errors**: Make sure your `.env` file has correct Firebase credentials
2. **OCR not working**: Check if Google Cloud Vision API key is configured
3. **Camera permissions**: Ensure app has camera and photo library permissions
4. **Build errors**: Try clearing cache with `expo start -c`

## Future Enhancements

- [ ] Multi-currency support
- [ ] Export receipts to PDF/CSV
- [ ] Receipt categories customization
- [ ] Budget tracking
- [ ] Expense reports
- [ ] Receipt sharing
- [ ] Barcode scanning
- [ ] Tax calculation
- [ ] Integration with accounting software

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the GitHub repository.

## Acknowledgments

- Expo team for the amazing framework
- Firebase for backend services
- Google Cloud Vision for OCR capabilities
- React Navigation for routing
