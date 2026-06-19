// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5wNeyT32d1UFO4jgOVJHTuZiZg0DsTLE",
  authDomain: "test-46743.firebaseapp.com",
  databaseURL: "https://test-46743-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-46743",
  storageBucket: "test-46743.firebasestorage.app",
  messagingSenderId: "875142432837",
  appId: "1:875142432837:web:d229701d4c605ace887b2c",
  measurementId: "G-4H1HXQ7LW2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);