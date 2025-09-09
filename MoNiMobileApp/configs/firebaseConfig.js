import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCW3qvlDBm71SfdKVQFDRbEkGU8otcyOvI",
  authDomain: "moni-1a757.firebaseapp.com",
  projectId: "moni-1a757",
  storageBucket: "moni-1a757.firebasestorage.app",
  messagingSenderId: "256465007843",
  appId: "1:256465007843:android:60f84f269479c51519ec1d6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);