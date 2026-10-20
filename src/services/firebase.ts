import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web config is safe to ship in a browser bundle. Security comes from
// Authentication and Firestore Rules, not from hiding these values.
const firebaseConfig = {
  apiKey: 'AIzaSyASB8tv7E7jCn3PKnHu64_B2g8My9TouBU',
  authDomain: 'hisab-dost-313.firebaseapp.com',
  projectId: 'hisab-dost-313',
  storageBucket: 'hisab-dost-313.firebasestorage.app',
  messagingSenderId: '731329583552',
  appId: '1:731329583552:web:ad0ea9509ade4fac779025',
  measurementId: 'G-G9FV5NK3E3',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
