// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCl-dRvujdRMLlJltDwU40CUyGrNK8_nmw",
    authDomain: "htw-devel.firebaseapp.com",
    databaseURL: "https://htw-devel.firebaseio.com",
    projectId: "htw-devel",
    storageBucket: "htw-devel.appspot.com",
    messagingSenderId: "998262156979",
    appId: "1:998262156979:web:9d35a80eb78bf02a958ac6",
    measurementId: "G-Y3PSH1N0CT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
