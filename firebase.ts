import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyASV7njc-4NxJMxloUQ0oA8-JLyuLY9Fsk",
  authDomain: "emotebot-350bc.firebaseapp.com",
  databaseURL: "https://emotebot-350bc-default-rtdb.firebaseio.com",
  projectId: "emotebot-350bc",
  storageBucket: "emotebot-350bc.firebasestorage.app",
  messagingSenderId: "137561841138",
  appId: "1:137561841138:web:17421f5cfc2def5ce85f6b",
  measurementId: "G-MT17G75HMJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);