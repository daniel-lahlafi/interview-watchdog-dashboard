import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBnn4oq6OmqlMFANf_1EbtyYta19QKRLNQ",
  authDomain: "interview-watchdog.firebaseapp.com",
  projectId: "interview-watchdog",
  storageBucket: "interview-watchdog.firebasestorage.app",
  messagingSenderId: "840233776602",
  appId: "1:840233776602:web:ce56f9bc6e68bad86d7ce3",
  measurementId: "G-GYLX42TG0W"
};

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
} else {
  app = getApps()[0];
  analytics = getAnalytics(app);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
}

export { app, analytics, db, storage, auth }; 