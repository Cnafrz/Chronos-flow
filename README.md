# ChronosFlow

ChronosFlow is a cross-platform, elegant productivity and accountability application designed to help you stay focused. It features a daily checklist, weekly recurring templates, and a unique Partner Mode that allows two users to sync their tasks and monitor each other's progress in real-time.

## Features

- **Daily Focus Checklist**: Plan your day effortlessly with a clean, drag-and-drop interface.
- **Weekly Progress Dashboard**: Monitor your completion rates with visual statistics and charts.
- **Partner Mode**: Generate a 6-digit invite code to link with an accountability partner. See their progress and activity feed in real-time!
- **Cross-Platform**: Run ChronosFlow on the Web, Windows (via Electron), or Android (via Capacitor).
- **Offline-First**: Built with Firebase Firestore, ChronosFlow caches your tasks locally and syncs automatically when you regain connection.
- **Native Notifications**: Get push notifications before your scheduled tasks begin.

## Installation & Build Instructions

### Prerequisites
- Node.js (v18+)
- Android Studio (for Android builds)
- Firebase Account

### 1. Web Setup
Clone the repository and install dependencies:
```bash
npm install
```

Configure Firebase by creating a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Run the development server:
```bash
npm run dev
```

### 2. Windows Desktop Build
ChronosFlow uses Electron. To generate a Windows installer and portable `.exe`:
```bash
npm run dist:win
```
The builds will be located in the `dist-electron/` folder.

### 3. Android Build
ChronosFlow uses Capacitor. First, ensure the web app is built:
```bash
npm run build
```
Then, sync the Android project:
```bash
npx cap sync android
```
To generate a Debug APK without opening Android Studio, run:
```bash
cd android
./gradlew assembleDebug
```
The APK will be located in `android/app/build/outputs/apk/debug/`.

## Folder Structure

```
├── android/               # Capacitor Android native project
├── electron/              # Electron main process scripts
├── src/                   # React frontend source code
│   ├── components/        # Reusable UI components
│   ├── db/                # Firebase initialization
│   ├── lib/               # Utilities and constants
│   ├── pages/             # Route pages (DailyView, WeeklyView, etc)
│   ├── services/          # Business logic and Firestore operations
│   └── store/             # Zustand global state manager
```

## Future Roadmap

- [ ] **iOS Application**: Expand Capacitor support to iOS.
- [ ] **Desktop Widgets**: Add floating widgets for the Windows version.
- [ ] **Calendar Integration**: Two-way sync with Google Calendar.
- [ ] **AI Assistant**: Introduce an AI scheduling agent.
