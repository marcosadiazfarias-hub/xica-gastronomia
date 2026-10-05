import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDl9o3OMnsX3vULGMgVZcSMdUUrDbALEZE",
  authDomain: "xica-gastronomia.firebaseapp.com",
  projectId: "xica-gastronomia",
  storageBucket: "xica-gastronomia.firebasestorage.app",
  messagingSenderId: "789904563868",
  appId: "1:789904563868:web:779fbd2c4aad26daa75759",
  measurementId: "G-KRV4J12GVM"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ]
};