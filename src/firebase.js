import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
      ? process.env
      : {}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAY4QaYcmHElUPF0Rn4iNquz5SCyXT7nng',
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sri-swarnakranthi-enterprises.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID || 'sri-swarnakranthi-enterprises',
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ||
    env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    'sri-swarnakranthi-enterprises.firebasestorage.app',
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '701853170829',
  appId: env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID || '1:701853170829:web:c101f8149ae0fa963376c4'
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
