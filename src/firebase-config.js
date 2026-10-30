// NT70 Quest: Firebase settings for the web app.
// These values are safe to publish; the Firestore security rules protect the data.
// Until real values are pasted, that copy of the app runs in solo mode (progress saved on each device only).

// The real group: https://nt70-quest.web.app
const LIVE_CONFIG = {
  apiKey: "AIzaSyB0GQC-zEYRsdrO6uTnGlYHEkEGUhblflk",
  authDomain: "nt70-quest.firebaseapp.com",
  projectId: "nt70-quest",
  storageBucket: "nt70-quest.firebasestorage.app",
  messagingSenderId: "586785766719",
  appId: "1:586785766719:web:2e8eba77c4b9d0f279e78a"
};

// The test copy, with its own sign-ins and database: https://nt-quest.web.app
// Paste from Firebase console > nt-quest > Project settings > Your apps > Web app.
const TEST_CONFIG = {
  apiKey: "AIzaSyDrHnD6eOtFaFuda3xE-0mFVN7HcQdZmJ4",
  authDomain: "nt-quest.firebaseapp.com",
  projectId: "nt-quest",
  storageBucket: "nt-quest.firebasestorage.app",
  messagingSenderId: "269509721737",
  appId: "1:269509721737:web:01c435410621fbf1c29058"
};

// Only test builds (`npm run build:staging`, used by PR previews and the test site) and `npm run dev`
// use the test project. Every other build, including the live deploy, uses the real one.
export const IS_TEST = import.meta.env.MODE === "staging" || import.meta.env.DEV;
export const FIREBASE_CONFIG = IS_TEST ? TEST_CONFIG : LIVE_CONFIG;
