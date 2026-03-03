// src/services/firebase.ts
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import logger from '../utils/logger';

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

export const initializeApp_ = () => {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    logger.info('Firebase initialized successfully');
  } catch (error) {
    logger.error('Firebase initialization error', error);
  }
};

export const getAuthInstance = (): Auth => {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  return auth;
};

export const getFirestoreInstance = (): Firestore => {
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  return db;
};

export const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Firebase not initialized');
  }
  return storage;
};

// Re-export Firebase functions for use in the app
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';

export {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
