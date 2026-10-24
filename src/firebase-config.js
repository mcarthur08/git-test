// NT70 Quest: Firebase settings for the web app.
// These values are safe to publish; your Firestore security rules protect the data.
// Until real values are pasted, the app runs in solo mode (progress saved on each device only).

// Real players: https://nt70-quest.web.app. Paste values from Firebase console > Project settings > Your apps.
const LIVE_CONFIG = {
  apiKey: "AIzaSyB0GQC-zEYRsdrO6uTnGlYHEkEGUhblflk",
  authDomain: "nt70-quest.firebaseapp.com",
  projectId: "nt70-quest",
  storageBucket: "nt70-quest.firebasestorage.app",
  messagingSenderId: "586785766719",
  appId: "1:586785766719:web:2e8eba77c4b9d0f279e78a"
};

// Separate test project with its own users and database. Used by `npm run dev` and `npm run build:staging`.
const TEST_CONFIG = {
  apiKey: "AIzaSyDrHnD6eOtFaFuda3xE-0mFVN7HcQdZmJ4",
  authDomain: "nt-quest.firebaseapp.com",
  projectId: "nt-quest",
  storageBucket: "nt-quest.firebasestorage.app",
  messagingSenderId: "269509721737",
  appId: "1:269509721737:web:01c435410621fbf1c29058",
  measurementId: "G-Z10K9VY69M"
};

// Only a production build (`npm run build`) talks to the live project; every other mode uses the test one.
export const IS_TEST = import.meta.env.MODE !== "production";
export const FIREBASE_CONFIG = IS_TEST ? TEST_CONFIG : LIVE_CONFIG;
