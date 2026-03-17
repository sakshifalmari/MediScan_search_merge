/*// Import the functions you need from the SDKs you need
import { initializeApp } 
// TODO: Add SDKs for Firebase products that you want to use
from https://firebase.google.com/docs/web/setup#available-libraries;

// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "YOUR_API_KEY"
  authDomain: "mediscan-1f060.firebaseapp.com",
  projectId: "mediscan-1f060",
  storageBucket: "mediscan-1f060.firebasestorage.app",
  messagingSenderId: "1052948429273",
  appId: "1:1052948429273:web:14d164d96428c04ec541c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
 apiKey: "YOUR_API_KEY"
  authDomain: "mediscan-1f060.firebaseapp.com",
  projectId: "mediscan-1f060",
  storageBucket: "mediscan-1f060.firebasestorage.app",
  messagingSenderId: "1052948429273",
  appId: "1:1052948429273:web:14d164d96428c04ec541c8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
