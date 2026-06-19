// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyA5wNeyT32d1UFO4jgOVJHTuZiZg0DsTLE",
  authDomain: "test-46743.firebaseapp.com",
  projectId: "test-46743",
  storageBucket: "test-46743.firebasestorage.app",
  messagingSenderId: "875142432837",
  appId: "1:875142432837:web:d229701d4c605ace887b2c",
  measurementId: "G-4H1HXQ7LW2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

