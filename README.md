# AttendPay

A React Native staff attendance and payroll app for campus environments. Staff clock in/out via WiFi verification, track hours, and view estimated pay in real time. Admins manage staff, approve leave, and generate payroll.

---

## Prerequisites

Install all of the following before proceeding:

| Tool           | Version | Download                             |
| -------------- | ------- | ------------------------------------ |
| Node.js        | 18+     | https://nodejs.org                   |
| JDK            | 17      | https://adoptium.net                 |
| Android Studio | Latest  | https://developer.android.com/studio |
| Git            | Latest  | https://git-scm.com                  |

> **Important:** JDK must be version 17 specifically. Version 18+ will break the build.

After installing Android Studio, open it and let it finish downloading the Android SDK.

---

## Phone Setup

Before running the app, set up your Android phone for USB debugging:

1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times to unlock Developer Options
3. Go to **Settings → Developer Options**
4. Enable **USB Debugging**
5. Connect your phone to your PC via USB
6. When prompted on your phone, tap **Allow USB debugging**

Verify your phone is detected by running:

```powershell
adb devices
# Should show your device listed
```

---

## Getting Started

### 1. Extract the project

If you received a zip file, extract it. Then open PowerShell and navigate to the project folder:

```powershell
cd AttendPay
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure Supabase

Open `src/lib/supabase.ts` and verify the credentials match your Supabase project:

```typescript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

To get your credentials:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → API**
4. Copy the **anon public** key

### 4. Configure Campus WiFi (Important)

Open `src/screens/staff/HomeScreen.tsx` and find these two lines near the top of the file:

```typescript
const ALLOWED_SSID = 'Kabianga_Staff'; // Change to your campus WiFi name
const ALLOWED_BSSID = ''; // Optional: your router's MAC address e.g. '00:1A:2B:3C:4D:5E'
```

**SSID** is your WiFi network name — change it to match your campus network exactly (case sensitive).

**BSSID** is your router's MAC address for extra security. Leave it empty `''` to use SSID only, or add your router's MAC to prevent spoofing.

To find your router's BSSID:

- Connect to the campus WiFi
- Run `ipconfig /all` in PowerShell and look for the **Default Gateway**
- Or check your router's admin panel

---

## Running the App

Open **two PowerShell windows**:

**Window 1 — Start Metro:**

```powershell
cd AttendPay
npx react-native start
```

**Window 2 — Build and install:**

```powershell
cd AttendPay
npx react-native run-android
```

> The first build takes 30-60 minutes as it downloads Gradle, NDK, and other dependencies. Subsequent builds take 2-5 minutes.

---

## Making Changes

After editing any JavaScript/TypeScript file, simply press **r** in the Metro terminal to reload the app instantly — no rebuild needed.

Only run `npx react-native run-android` again if you:

- Install a new npm package
- Change native Android files
- Change `android/` configuration

---

## Building a Release APK

To build a standalone APK for distribution (no PC or Metro needed):

```powershell
cd android
./gradlew assembleRelease
```

APK will be at:

```
android\app\build\outputs\apk\release\app-release.apk
```

Share via WhatsApp, Google Drive, or email. Recipients just need to enable **Install from unknown sources** on their phone.

---

## Troubleshooting

**Build fails with Java version error**
Make sure you have JDK 17 installed and it's the active version:

```powershell
java -version
# Should show: openjdk version "17.x.x"
```

**`adb devices` shows nothing**

- Try a different USB cable (some are charge-only)
- Replug the USB cable
- Check your phone screen for the USB debugging permission popup

**App shows "Not on campus network" even on campus WiFi**

- Check the SSID in `HomeScreen.tsx` matches your WiFi name exactly (case sensitive)
- Make sure location permission is granted to the app on your phone

**Metro port already in use**

```powershell
npx kill-port 8081
npx react-native start
```

**Gradle build fails on first run**
Make sure you have a stable internet connection — first build downloads ~1GB of dependencies.

---

## Project Structure

```
AttendPay/
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx      # Login, session, role detection
│   │   └── ThemeContext.tsx     # Light/dark mode
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client config
│   │   └── payroll.ts           # Pay calculation helpers
│   ├── navigation/
│   │   └── index.tsx            # App navigation structure
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── staff/
│       │   └── HomeScreen.tsx   # Clock in/out, WiFi gate, live pay
│       └── admin/
│           ├── DashboardScreen.tsx
│           ├── StaffScreen.tsx
│           ├── LeaveScreen.tsx
│           └── PayrollScreen.tsx
├── android/                     # Android native code
└── index.js                     # App entry point
```

---

## Tech Stack

- **React Native 0.85**
- **Supabase** — database, auth, real-time
- **React Navigation** — tab and stack navigation
- **react-native-network-info** — WiFi SSID/BSSID detection
- **AsyncStorage** — session persistence
