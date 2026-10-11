# Event Mate — Backend Architecture & API Guide 🚀

This folder contains the complete backend services for **Event Mate**. To ensure maximum flexibility for college hackathons, team preferences, and campus lab setups, we provide **3 ready-to-run backend implementations**:

1. **Pure Java HTTP Backend** (Zero dependencies, runs with 1-click batch script).
2. **Java Spring Boot 3 Backend** (Production-ready REST API with Maven & Jakarta validation).
3. **Node.js (Express) & Python (Flask)** (Lightweight microservices).

---

## 📡 REST API Specification

All backends implement the identical REST contract:

### 1. `POST /api/campaign/generate`
Main campaign generation pipeline. Takes raw event details, runs validation, adapts tone, and returns all 5 formatted channel outputs with consistency verification.

**Request Payload (`application/json`):**
```json
{
  "name": "HackSphere 2026: National 36-Hour Hackathon",
  "dateTime": "2026-11-14T09:00",
  "venue": "Main Campus Auditorium & Tech Hub, Block C",
  "description": "500+ student developers, $10,000 prizes, mentor workshops, recruiter speed-dating!",
  "audience": "Engineering students, developers, designers",
  "registrationLink": "https://hacksphere2026.devpost.com/register",
  "tone": "exciting"
}
```

**Response Payload (`200 OK`):**
```json
{
  "success": true,
  "generatedAt": "2026-10-10T23:45:00",
  "social": "🚀 BIG NEWS: Mark your calendars!...",
  "email": {
    "subject": "⚡ You're Invited: HackSphere 2026 is coming up fast!",
    "body": "Hello Innovators & Changemakers,..."
  },
  "whatsapp": {
    "message": "🔥 *DON'T MISS OUT: HACKSPHERE 2026!* 🔥...",
    "directShareUrl": "https://api.whatsapp.com/send?text=..."
  },
  "reminders": {
    "oneWeek": { "stage": "1 Week Before", "text": "..." },
    "oneDay": { "stage": "24 Hours Before", "text": "..." },
    "oneHour": { "stage": "1 Hour Before", "text": "..." }
  },
  "faqs": [
    { "question": "Who is eligible to participate?", "answer": "..." }
  ],
  "consistency": {
    "score": 100,
    "statusLabel": "100% Synchronized",
    "checks": [
      { "item": "Event Title Synchronized", "detail": "...", "status": "pass" },
      { "item": "Date & Time Accurate", "detail": "...", "status": "pass" },
      { "item": "Venue / Link Matched", "detail": "...", "status": "pass" },
      { "item": "Registration URL Embedded", "detail": "...", "status": "pass" }
    ]
  }
}
```

### 2. `GET /api/events`
Returns list of saved/preset campaigns from memory/database.

### 3. `POST /api/events`
Saves an event campaign to the backend store.

### 4. `GET /api/health`
Health check endpoint returning system status, timestamp, and framework name.

---

## 🛠️ How to Run Each Backend

### Option A: Pure Java (Zero Dependencies) — Recommended for Hackathons! ⭐
* Location: `backend/java/`
* Requires only standard Java JDK (no Maven, no Gradle, no npm, no Internet download).
* **To run:**
  - Double-click **`backend/java/run-server.bat`**  
  - Or in terminal:
    ```bash
    cd backend/java
    javac -d bin src/com/eventmate/EventMateServer.java
    java -cp bin com.eventmate.EventMateServer
    ```
* Runs on: `http://localhost:8080`

### Option B: Java Spring Boot 3
* Location: `backend/java-springboot/`
* Uses Maven and Spring Boot 3 with Jakarta Bean Validation.
* **To run:**
  ```bash
  cd backend/java-springboot
  mvn clean spring-boot:run
  ```
* Runs on: `http://localhost:8080`

### Option C: Python (Flask)
* Location: `backend/python/`
* **To run:**
  ```bash
  cd backend/python
  pip install -r requirements.txt
  python app.py
  ```
* Runs on: `http://localhost:5000`

### Option D: Node.js (Express)
* Location: `backend/nodejs/`
* **To run:**
  ```bash
  cd backend/nodejs
  npm install
  npm start
  ```
* Runs on: `http://localhost:5000`

---

## 🔄 Frontend Connection & Automatic Fallback
The frontend in `js/app.js` is automatically configured to detect the backend:
1. When you click **“Generate Campaign”**, the frontend attempts to call `http://localhost:8080/api/campaign/generate`.
2. If the backend is running, the server processes the request and returns the campaign with a **“Generated via Backend REST API!”** toast.
3. If the backend is offline, the frontend smoothly falls back to the client engine with **zero downtime or error popups**—guaranteeing 100% safety during live judging demos!
