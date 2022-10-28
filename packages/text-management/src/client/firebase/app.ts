import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCCI6aaQue3ouM3xwhpnZN13NV1FVHOTr8",
  authDomain: "text-management-fc3da.firebaseapp.com",
  databaseURL: "https://text-management-fc3da-default-rtdb.firebaseio.com",
  projectId: "text-management-fc3da",
  storageBucket: "text-management-fc3da.appspot.com",
  messagingSenderId: "179979662724",
  appId: "1:179979662724:web:82926ad96e6ec667d499d1",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
