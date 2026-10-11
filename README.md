# 🚀 Event Mate – Smart Event Communication Generator

> **One Event. Every Message. Instantly.**  
> Create announcements, invitations, reminders, and FAQs in seconds. Built for college event organizers, student clubs, and small businesses.

---

## 📌 1. Project Overview

**Event Mate** solves a major pain point for campus organizers and student societies: having to manually write, format, and adapt the same event announcement across dozens of different platforms (Instagram, LinkedIn, Twitter/X, WhatsApp groups, official college circulars, reminder blasts, and email invitations).

With Event Mate, organizers **enter the event details just once**. The application automatically generates six distinct, ready-to-use communication packages in the chosen tone and language.

### 🌟 Key Highlights
- **Zero Build Tools Required:** Pure HTML5, modern CSS3, and Vanilla JavaScript. Runs directly in any web browser without Node.js or `npm install`.
- **Multilingual Support:** Native generation in **English**, **Telugu (తెలుగు)**, and **Hindi (हिंदी)**.
- **6 Content Types Generated Instantly:** Social captions, academic notices, email drafts, WhatsApp click-to-chat templates, timed reminders with calculated schedules, and 7 dynamic FAQs.
- **Content Management:** In-place editing, one-click clipboard copying, character & word counters, single-file text downloads, and local persistence via `localStorage`.
- **Optional Firebase Cloud Sync:** Plug-and-play Firebase Auth & Firestore with seamless, zero-friction Demo Mode.

---

## 📂 2. Project Structure

```text
event-mate/
├── index.html           # Main semantic HTML5 single-page application
├── style.css            # Modern responsive CSS3 stylesheet (Blue/Purple/White theme)
├── script.js            # Core application controller & content generation engine
├── firebase-config.js   # Optional Firebase Auth & Firestore configuration layer
├── server.js            # Optional Node.js static host & demo server
└── README.md            # Complete documentation & hackathon testing guide
```

---

## 💻 3. Quick Start on Windows & VS Code (Beginner Friendly)

You can run Event Mate in multiple ways on Windows:

### ⚡ Method 1: The Simplest Way (Zero Setup)
1. Open Windows File Explorer and navigate to:
   ```text
   C:\Users\DUDAM DHANUSH\.gemini\antigravity\scratch\event-mate
   ```
2. Double-click **`index.html`** (or right-click → *Open with Google Chrome / Microsoft Edge*).
3. The application will open immediately in your browser. All features, content generation, and local saves work 100% offline!

---

### 🖥️ Method 2: Using Visual Studio Code Live Server
1. Open **Visual Studio Code**.
2. Click **File** → **Open Folder...** and select:
   ```text
   C:\Users\DUDAM DHANUSH\.gemini\antigravity\scratch\event-mate
   ```
3. In the left file explorer, right-click **`index.html`** and select **"Open with Live Server"**.
4. The site will launch automatically at `http://127.0.0.1:5500`.

---

### 🐍 Method 3: Using Python HTTP Server (Built into Windows)
If you have Python installed, open PowerShell in the project directory and run:
```powershell
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

---

### 🟢 Method 4: Using Node.js (Optional)
If Node.js is installed on your system:
```powershell
node server.js
```
Then visit `http://localhost:5000` in your web browser.

---

## 🧪 4. Sample Event for Instant Testing & Demonstration

For quick testing during a hackathon presentation, click any of the **Quick Presets** at the top of the **Create Event** form, or paste the following sample details:

| Field | Sample Value |
| :--- | :--- |
| **Event Name** | `HackTech 2026: 24-Hour AI & Web3 Hackathon` |
| **Category** | `Hackathon` |
| **Organizer** | `Google Developer Student Club & Dept of CSE` |
| **Event Date** | `2026-11-15` |
| **Start & End Time** | `09:00` to `18:00` |
| **Venue** | `Main Auditorium & Innovation Lab, Tech Campus (or Online on Discord)` |
| **Description** | `Build cutting-edge AI and decentralized applications in an intensive 24-hour sprint. Mentors from top tech companies, cash prizes worth ₹1,00,000, free food, and schwag kits for all shortlisted participants!` |
| **Target Audience** | `Engineering students, developers, designers, and tech enthusiasts` |
| **Registration Link** | `https://eventmate.dev/hacktech2026` |
| **Contact Info** | `hacktech@college.edu \| +91 98765 43210` |
| **Additional Instructions** | `Free entry. Bring laptops, chargers, and college ID cards. Certificates provided.` |
| **Tone** | `Exciting` |
| **Language** | `English` *(Try Telugu or Hindi for regional demo!)* |

Click **"Generate All Content"** to watch the generator produce all 6 communication kits simultaneously!

---

## 🎯 5. The 6 Generated Content Types

| Content Type | Included Variations & Features |
| :--- | :--- |
| **1. Event Captions** | • **Instagram Caption** (hook line, bullet points, tags, CTA)<br>• **LinkedIn Post** (industry relevance, networking, value proposition)<br>• **Twitter / X Update** (concise, under 280 characters)<br>• **Catchy Promotional Headlines & Hashtags** (3 distinct styles) |
| **2. Announcements** | • **Official College Circular** (Circular Ref #, formal department notice, signature block)<br>• **Student Club Announcement** (peer-to-peer enthusiasm, engaging)<br>• **Short Promotional Blast** (for quick broadcast lists) |
| **3. Email Invitations** | • Professional Subject Line & Warm Greeting<br>• Structured Event Breakdown & Registration Link<br>• **"Create Email Draft" button** (uses `mailto:` with pre-filled encoded subject & body) |
| **4. WhatsApp Messages** | • Short friendly invite & Detailed invite with `*bold*` and emojis<br>• Registration deadline alert & Event-day morning alert<br>• **"Open in WhatsApp" button** (uses official `https://wa.me/?text=...` click-to-chat API) |
| **5. Timed Reminders** | • **1-Week-Before Reminder** (suggests date: `eventDate - 7 days`)<br>• **1-Day-Before Reminder** (suggests date: `eventDate - 1 day`)<br>• **Event-Day Morning Alert**<br>• **Registration Deadline Final Call** |
| **6. FAQs** | Dynamically answers all 7 essential organizer questions:<br>1. *What is the event about?*<br>2. *Who can participate?*<br>3. *When and where is the event?*<br>4. *How do I register?*<br>5. *Is there a registration fee?*<br>6. *What should participants bring?*<br>7. *Who can I contact for help?* |

---

## 🛠️ 6. Content Management & Event Dashboard

- **In-Place Editing:** Click the **"Edit"** button on any card to edit text directly in a `<textarea>`, then click **"Done"** to save.
- **Copy with Feedback:** Click **"Copy"** on any card to copy the text to your clipboard. An animated toast and button confirmation appears.
- **Single Card Regenerate:** Click the refresh icon on any card to generate a fresh variation.
- **Live Character & Word Counters:** Real-time counters on each card help organizers stay within platform limits (e.g. Twitter 280 chars, SMS limits).
- **Download All Content:** Click **"Download All (.txt)"** to bundle all 6 categories into an organized text file named `EventMate_[EventName]_Communications.txt`.
- **My Events Section:** Shows total events created and total communication pieces generated. You can **View Content**, **Edit Event Details**, or **Delete** with confirmation.
- **Persistent Storage:** Stored in browser `localStorage`. Refreshing or reopening the page preserves all saved events.

---

## 🔐 7. Optional Firebase Configuration

Event Mate is designed to work in **Demo Mode (Local Storage)** out-of-the-box. If you want to connect a live Google Firebase project for cross-device synchronization:

1. Open `firebase-config.js` in VS Code.
2. Go to the [Firebase Console](https://console.firebase.google.com) and create a free project.
3. In Project Settings, add a **Web App** and copy the configuration values into `FIREBASE_CONFIG`:
   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
4. Enable **Authentication** (Email/Password provider) in the Firebase console.
5. Enable **Cloud Firestore** in test mode.
6. Refresh Event Mate. The status pill will turn green: `🟢 Firebase Connected`.

> **Security Note:** Never commit private service account keys or administrative secrets to frontend client files. The keys in `firebase-config.js` are standard public web client identifiers protected by Firestore Security Rules.

---

## 📊 8. Implemented Features vs. External Services Roadmap

To ensure 100% transparency for hackathon evaluations:

| Feature Area | Current Status (Implemented MVP) | External Services Required for Future Production |
| :--- | :--- | :--- |
| **Social Media Captions** | ✅ **100% Working:** Generates Instagram, LinkedIn, and X copy with hashtags and live character counters. | Direct social auto-publishing requires Meta Graph API & X Developer tokens. |
| **Official Notices** | ✅ **100% Working:** Formal circulars and club announcements formatted and copyable. | PDF export can be enhanced via client-side `jsPDF`. |
| **Email Invitations** | ✅ **100% Working:** Generates professional subject and body. `mailto:` launcher opens user's email app pre-filled. | Bulk automated transactional sending requires SendGrid, Amazon SES, or Mailgun. |
| **WhatsApp Messages** | ✅ **100% Working:** Generates styled messages (`*bold*`, emojis). Click-to-chat `wa.me` links allow reviewing before sending. | Direct automated business broadcasts require Meta WhatsApp Cloud API approval and phone number verification. |
| **Timed Reminders** | ✅ **100% Working:** Computes suggested calendar dates and generates ready-to-copy reminders. | Automated scheduled background push alerts require an active cron/queue server (e.g. BullMQ, Firebase Cloud Functions). |
| **Multilingual Engine** | ✅ **100% Working:** Context-aware templates in English, Telugu, and Hindi. | Can be upgraded to Gemini 1.5 Flash / Pro API via secure backend for infinite prose variation. |
| **Storage & Persistence** | ✅ **100% Working:** Browser `localStorage` for offline zero-config use, plus optional Firestore integration. | Production multi-tenant database can use Firebase Firestore or Supabase PostgreSQL. |

---

## 🏆 9. Hackathon Demo Checklist

When demonstrating Event Mate to hackathon judges:

1. [x] **Zero friction:** Open `index.html` directly or serve with Live Server.
2. [x] **Preset test:** Click the **"Hackathon"** or **"Workshop"** preset button to populate the form instantly.
3. [x] **Multilingual test:** Switch language to **Telugu** or **Hindi** and click **"Generate All Content"** to show regional inclusivity.
4. [x] **Interactive tools:** Click **"Copy"** on any card to demonstrate the clipboard toast; click **"Edit"** to show in-place adjustments.
5. [x] **WhatsApp Click-to-Chat:** Click **"Open in WhatsApp"** to show the pre-formatted chat preview.
6. [x] **Email Draft:** Click **"Create Email Draft"** to show native mail application integration.
7. [x] **Export:** Click **"Download All (.txt)"** to show the full kit exported as a file.
8. [x] **Dashboard:** Navigate to **"My Events"** to show persistent storage and event management.

---

## 📜 10. License

Event Mate is released under the **MIT License**. Free for student clubs, universities, hackathons, and small businesses.
