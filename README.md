<div align="center">
  <img src="./assets/images/logo.png" alt="PawScan Logo" width="150" />
  
  # 🐾 PawScan
  
  **AI-Powered Pet Health Analysis & Veterinary Consultation Platform**
  
  [![React Native](https://img.shields.io/badge/React_Native-0.79.6-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-53.0.22-000020?logo=expo&logoColor=white)](https://expo.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.49.5-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  
  [Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Contributing](#-contributing)
  
</div>

---

## 📱 About PawScan

PawScan is a comprehensive mobile application that revolutionizes pet healthcare by combining **AI-powered image analysis** with **direct veterinary consultation**. Whether you're a concerned pet owner or a professional veterinarian, PawScan provides the tools you need to ensure the best care for our furry friends.

### 🎯 Mission

To make pet healthcare more accessible, affordable, and efficient by leveraging cutting-edge AI technology and connecting pet owners directly with veterinary professionals.

---

## ✨ Features

### 🔍 **For Pet Owners**

#### 📸 **AI-Powered Health Analysis**
- **Instant Camera Analysis** - Snap a photo of your pet and get immediate AI-powered health insights
- **Image History** - Track your pet's health journey with saved analyses
- **Detailed Reports** - Comprehensive analysis results with actionable recommendations

#### 💬 **Direct Vet Consultation**
- **Real-time Chat** - Connect with licensed veterinarians instantly
- **Share Photos** - Send images directly in chat for professional assessment
- **Chat History** - Access all your conversations with vets

#### 📰 **Community & Social**
- **Newsfeed** - Share and discover pet care tips, photos, and stories
- **Like & Comment** - Engage with the pet-loving community
- **Follow Vets** - Stay updated with veterinary professionals

#### 🔔 **Smart Notifications**
- **Real-time Alerts** - Get instant notifications for messages, comments, and likes
- **Notification History** - Never miss an important update
- **Customizable Settings** - Control what notifications you receive

#### 🎓 **Interactive Tutorials**
- **Guided Tours** - Step-by-step walkthroughs for all features
- **Contextual Help** - Get help exactly when you need it
- **Feature Highlights** - Discover all the app's capabilities

---

### 🏥 **For Veterinarians**

#### 👥 **Patient Management**
- **Dedicated Vet Dashboard** - Specialized interface for professional use
- **Client Chat System** - Manage multiple client conversations efficiently
- **Professional Profile** - Showcase your expertise and credentials

#### 📊 **Analytics & Insights**
- **Consultation History** - Track all your patient interactions
- **Image Analysis Review** - Review AI analysis results with professional context

#### 🌐 **Community Engagement**
- **Professional Newsfeed** - Share expertise and educational content
- **Build Reputation** - Gain trust through community engagement

---

## 🏗️ Architecture

### **Frontend**
```
PawScan/
├── app/                          # Expo Router navigation
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.jsx
│   │   ├── signup.jsx
│   │   └── forgot-password.jsx
│   ├── (user)/                   # Pet owner screens
│   │   ├── home.jsx
│   │   ├── camera.jsx
│   │   ├── chat/
│   │   ├── history.jsx
│   │   └── profile.jsx
│   ├── (vet)/                    # Veterinarian screens
│   │   ├── home.jsx
│   │   ├── camera.jsx
│   │   ├── chat/
│   │   ├── history.jsx
│   │   └── profile.jsx
│   └── index.jsx                 # Landing page
├── components/                   # Reusable components
│   ├── chat/                     # Chat interface components
│   ├── home/                     # Home/newsfeed components
│   ├── notifications/            # Notification system
│   ├── profile/                  # Profile components
│   └── tutorial/                 # Tutorial system
├── providers/                    # Context providers
│   ├── AuthProvider.jsx          # Authentication state
│   ├── NotificationProvider.jsx  # Notification management
│   └── TutorialProvider.jsx      # Tutorial state
├── services/                     # API services
│   ├── notificationService.js
│   └── reportService.js
├── utils/                        # Utility functions
├── assets/                       # Images, fonts, etc.
└── supabase/                     # Database schemas
```

### **Backend Architecture**

```
Supabase Backend
├── Authentication              # User management & security
├── PostgreSQL Database         # Data storage
│   ├── users                   # User profiles
│   ├── analysis_history        # AI analysis records
│   ├── conversations           # Chat conversations
│   ├── messages                # Chat messages
│   ├── newsfeed_posts          # Community posts
│   ├── newsfeed_comments       # Post comments
│   ├── newsfeed_likes          # Post likes
│   └── notifications           # Notification system
├── Storage                     # Image/file storage
│   ├── profile-images/
│   ├── analysis-images/
│   └── chat-images/
└── Real-time Subscriptions     # Live updates
```

---

## 🛠️ Tech Stack

### **Frontend Technologies**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.79.5 | Cross-platform mobile development |
| **Expo** | 53.0.22 | Development framework & tooling |
| **Expo Router** | 5.1.6 | File-based navigation |
| **NativeWind** | 4.0.1 | Tailwind CSS for React Native |
| **TypeScript** | 5.8.3 | Type safety & better DX |
| **React** | 19.0.0 | UI library |

### **Backend & Services**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.49.5 | Backend-as-a-Service (BaaS) |
| **PostgreSQL** | - | Relational database |
| **OpenAI API** | 5.0.1 | AI-powered image analysis |
| **Expo Notifications** | 0.31.4 | Push notifications |

### **Key Libraries**

- **@react-native-async-storage/async-storage** - Local data persistence
- **expo-camera** - Camera functionality
- **expo-image-picker** - Image selection
- **expo-image-manipulator** - Image processing
- **react-native-reanimated** - Smooth animations
- **expo-linear-gradient** - Beautiful gradients

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (install globally: `npm install -g expo-cli`)
- **iOS Simulator** (Mac only) or **Android Studio** (for Android development)
- **Expo Go** app on your physical device (optional)

### Step 1: Clone the Repository

```bash
git clone https://github.com/bnetpineda/PawScan.git
cd PawScan
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### Step 4: Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schemas in order:
   ```bash
   # In Supabase SQL Editor, run:
   1. db-schema.sql
   2. notifications-schema.sql
   3. notifications-triggers-only.sql
   ```

### Step 5: Configure Supabase Storage

1. Create the following storage buckets in your Supabase project:
   - `profile-images` (public)
   - `analysis-images` (private)
   - `chat-images` (private)
   - `vet-ids` (public)

2. Run the `vet-ids-bucket.sql` script in the Supabase SQL Editor to set up policies for the `vet-ids` bucket.

### Step 6: Start the Development Server

```bash
# Start Expo development server
npm start
# or
expo start
```

### Step 7: Run on Your Device

**Option A: Physical Device**
1. Install **Expo Go** from App Store or Google Play
2. Scan the QR code from the terminal

**Option B: Simulator/Emulator**
```bash
# iOS (Mac only)
npm run ios

# Android
npm run android
```

---

## 🎨 Design System

### **Color Palette**

PawScan uses a minimalistic neutral color scheme with dark/light mode support:

```javascript
// Neutral Colors (Tailwind CSS)
bg-neutral-50   // Lightest (Light Mode backgrounds)
bg-neutral-100
bg-neutral-200
bg-neutral-300
bg-neutral-400
bg-neutral-500  // Mid-tones
bg-neutral-600
bg-neutral-700
bg-neutral-800
bg-neutral-900
bg-neutral-950  // Darkest (Dark Mode backgrounds)
```

### **Typography**

- **Headings**: Bold, clear hierarchy
- **Body**: Readable, comfortable spacing
- **Labels**: Subtle, informative

### **UI/UX Principles**

- ✨ **Minimalistic** - Clean, uncluttered interfaces
- 🎯 **Intuitive** - Easy to navigate and understand
- 🌓 **Adaptive** - Seamless dark/light mode transitions
- 📱 **Responsive** - Optimized for all screen sizes
- ♿ **Accessible** - Designed for everyone

---

## 🔐 Security & Privacy

- 🔒 **Secure Authentication** - Supabase Auth with JWT tokens
- 🔐 **Row Level Security (RLS)** - Database-level access control
- 🖼️ **Secure Storage** - Encrypted image storage
- 🔑 **API Key Protection** - Environment variables for sensitive data
- 🛡️ **Data Privacy** - GDPR-compliant data handling

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📦 Building for Production

### **iOS**

```bash
# Build for iOS
npx eas-cli build --platform ios

# Submit to App Store
npx eas-cli submit --platform ios
```

### **Android**

```bash
# Build for Android
npx eas-cli build --platform android

# Submit to Google Play
npx eas-cli submit --platform android
```

### **Web**

```bash
# Build for web
npm run web

# Deploy web version
npx eas-cli deploy
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### **How to Contribute**

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### **Contribution Guidelines**

- ✅ Follow the existing code style
- ✅ Write clear commit messages
- ✅ Add comments for complex logic
- ✅ Update documentation as needed
- ✅ Test your changes thoroughly
- ✅ Make sure all existing tests pass

### **Code Style**

- Use **functional components** with hooks
- Follow **React best practices** (useCallback, useMemo, etc.)
- Use **TypeScript** for type safety
- Follow **Tailwind CSS** conventions with NativeWind
- Write **clean, readable code**

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**PawScan Development Team**

This project is maintained by open source contributors.


---


## 🗺️ Roadmap

### **Version 1.0** (Current)
- ✅ AI-powered image analysis
- ✅ Real-time chat with vets
- ✅ Social newsfeed
- ✅ Notification system
- ✅ Interactive tutorials
- ✅ Dark/Light mode

### **Version 1.1** (Planned)
- 🔄 Pet profiles (multiple pets per user)
- 🔄 Appointment scheduling
- 🔄 Health records management
- 🔄 Medication reminders

### **Version 2.0** (Future)
- 🔮 Video consultations
- 🔮 Pet health tracking dashboard
- 🔮 Vet directory & search
- 🔮 Multi-language support
- 🔮 Payment integration

---

## 🙏 Acknowledgments

- **OpenAI** - For the incredible AI models
- **Supabase** - For the amazing backend platform
- **Expo** - For the fantastic development experience
- **React Native Community** - For the awesome libraries and support
- **All Contributors** - Thank you for making PawScan better!

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/bnetpineda/PawScan?style=social)
![GitHub forks](https://img.shields.io/github/forks/bnetpineda/PawScan?style=social)
![GitHub issues](https://img.shields.io/github/issues/bnetpineda/PawScan)
![GitHub pull requests](https://img.shields.io/github/issues-pr/bnetpineda/PawScan)
![GitHub last commit](https://img.shields.io/github/last-commit/bnetpineda/PawScan)

---

<div align="center">
  
  **Made with ❤️ for pets and their humans**
  
  ### ⭐ If you like PawScan, give it a star!
  
  [Report Bug](https://github.com/bnetpineda/PawScan/issues) • [Request Feature](https://github.com/bnetpineda/PawScan/issues) • [Documentation](https://github.com/bnetpineda/PawScan/wiki)
  
</div>
