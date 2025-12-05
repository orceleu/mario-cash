// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwpAe_4a9WgVKgFcaC6FQ6_ArPyfEk7Ug",
  authDomain: "car-service-a6ace.firebaseapp.com",
  projectId: "car-service-a6ace",
  storageBucket: "car-service-a6ace.firebasestorage.app",
  messagingSenderId: "316132671423",
  appId: "1:316132671423:web:2c1b535df0965de1342b0a",
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp;
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };
