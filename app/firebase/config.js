// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArm5LPPzTPIbGEEnX7mzYpJHYgZHr-dQo",
  authDomain: "mario-cash.firebaseapp.com",
  projectId: "mario-cash",
  storageBucket: "mario-cash.firebasestorage.app",
  messagingSenderId: "921613898858",
  appId: "1:921613898858:web:1189de890cfa82d5b6a613",
};
// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp;
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };
/*
const firebaseConfig = {
  apiKey: "AIzaSyArm5LPPzTPIbGEEnX7mzYpJHYgZHr-dQo",
  authDomain: "mario-cash.firebaseapp.com",
  projectId: "mario-cash",
  storageBucket: "mario-cash.firebasestorage.app",
  messagingSenderId: "921613898858",
  appId: "1:921613898858:web:1189de890cfa82d5b6a613",
};


*/
