import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3Io9Oxsa72bBWtb--A3l0-S71xdZtQ4w",
  authDomain: "salone-reviews.firebaseapp.com",
  projectId: "salone-reviews",
  storageBucket: "salone-reviews.firebasestorage.app",
  messagingSenderId: "874012769926",
  appId: "1:874012769926:web:17259bbd689890c74a1b07",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);