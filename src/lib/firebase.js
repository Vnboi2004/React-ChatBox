import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: 'AIzaSyD-7oBmAFCQc7QMYDqMSlsagpPOaXBy3NU',
  authDomain: "reactchatbox-7e473.firebaseapp.com",
  projectId: "reactchatbox-7e473",
  storageBucket: "reactchatbox-7e473.appspot.com",
  messagingSenderId: "576542797884",
  appId: "1:576542797884:web:58025aadbd9beeea63d339",
//   measurementId: "G-SE2JZ65VKK"
};



const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
