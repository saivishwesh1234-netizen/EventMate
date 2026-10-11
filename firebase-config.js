/**
 * Event Mate – Firebase Configuration & Integration Layer
 * 
 * This file provides modular Firebase Authentication and Cloud Firestore
 * integration for Event Mate.
 * 
 * ℹ️ DEMO MODE NOTE:
 * If Firebase credentials are left blank or invalid, Event Mate automatically
 * runs in Demo Mode using browser localStorage. No setup is required for
 * demo or local hackathon testing!
 * 
 * To connect your own live Firebase project:
 * 1. Visit https://console.firebase.google.com and create a free project.
 * 2. Enable "Authentication" (Email/Password sign-in provider).
 * 3. Enable "Cloud Firestore" database (Test mode for development).
 * 4. Register a Web App in Project Settings and copy the configuration below.
 * 5. NEVER commit private service account keys or production secrets to frontend files.
 */

const FIREBASE_CONFIG = {
  apiKey: "",               // Paste your Firebase API Key here
  authDomain: "",           // e.g. "event-mate-demo.firebaseapp.com"
  projectId: "",            // e.g. "event-mate-demo"
  storageBucket: "",        // e.g. "event-mate-demo.appspot.com"
  messagingSenderId: "",    // e.g. "123456789012"
  appId: ""                 // e.g. "1:123456789012:web:abcdef123456"
};

/**
 * Event Mate Firebase Service Wrapper
 * Provides safe abstraction for Auth and Firestore operations with
 * zero-friction fallback to Demo Mode.
 */
const FirebaseService = {
  app: null,
  auth: null,
  db: null,
  initialized: false,
  currentUser: null,
  authStateListeners: [],

  /**
   * Check if Firebase configuration has valid credentials
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.apiKey.trim() !== "" &&
      !FIREBASE_CONFIG.apiKey.includes("YOUR_") &&
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.projectId.trim() !== ""
    );
  },

  /**
   * Initialize Firebase SDK if credentials and libraries are present
   */
  async init() {
    if (!this.isConfigured()) {
      console.info("🟡 Event Mate: Firebase credentials not set. Running in Demo Mode (Local Storage).");
      this.initialized = false;
      this.notifyAuthStateChange(null);
      return false;
    }

    try {
      if (typeof firebase === 'undefined') {
        console.warn("⚠️ Event Mate: Firebase SDK scripts not loaded. Running in Demo Mode.");
        return false;
      }

      // Initialize Firebase App
      if (!firebase.apps || !firebase.apps.length) {
        this.app = firebase.initializeApp(FIREBASE_CONFIG);
      } else {
        this.app = firebase.app();
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();
      this.initialized = true;

      // Listen for auth state changes
      this.auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.notifyAuthStateChange(user);
      });

      console.info("🟢 Event Mate: Firebase successfully connected and initialized!");
      return true;
    } catch (error) {
      console.error("❌ Event Mate: Error initializing Firebase:", error.message);
      this.initialized = false;
      return false;
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.authStateListeners.push(callback);
      // Immediately notify with current state
      callback(this.currentUser);
    }
  },

  notifyAuthStateChange(user) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (err) {
        console.error("Auth listener error:", err);
      }
    });
  },

  /**
   * Sign Up with Email and Password
   * @param {string} email 
   * @param {string} password 
   */
  async signUp(email, password) {
    if (!this.initialized || !this.auth) {
      throw new Error("Firebase is not configured. Please use Demo Mode or configure credentials.");
    }
    const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  },

  /**
   * Log In with Email and Password
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    if (!this.initialized || !this.auth) {
      throw new Error("Firebase is not configured. Please use Demo Mode or configure credentials.");
    }
    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  },

  /**
   * Log Out current user
   */
  async logout() {
    if (this.initialized && this.auth) {
      await this.auth.signOut();
    }
    this.currentUser = null;
    this.notifyAuthStateChange(null);
  },

  /**
   * Save an event to Firestore under the user's collection
   * @param {string} userId 
   * @param {Object} eventData 
   */
  async saveEventToFirestore(userId, eventData) {
    if (!this.initialized || !this.db || !userId) {
      return null;
    }
    const docRef = this.db.collection('users').doc(userId).collection('events').doc(eventData.id);
    await docRef.set({
      ...eventData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return eventData.id;
  },

  /**
   * Fetch all events for a user from Firestore
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async fetchEventsFromFirestore(userId) {
    if (!this.initialized || !this.db || !userId) {
      return [];
    }
    const snapshot = await this.db.collection('users').doc(userId).collection('events').orderBy('createdAt', 'desc').get();
    const events = [];
    snapshot.forEach(doc => {
      events.push(doc.data());
    });
    return events;
  },

  /**
   * Delete an event from Firestore
   * @param {string} userId 
   * @param {string} eventId 
   */
  async deleteEventFromFirestore(userId, eventId) {
    if (!this.initialized || !this.db || !userId || !eventId) {
      return false;
    }
    await this.db.collection('users').doc(userId).collection('events').doc(eventId).delete();
    return true;
  }
};

// Make globally accessible
window.FirebaseService = FirebaseService;
