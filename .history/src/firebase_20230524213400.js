// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyAAx_knJ_qqxPkJQ_xoIZnxt_c6gb6Wdys",
    authDomain: "todoapp-eeeb7.firebaseapp.com",
    projectId: "todoapp-eeeb7",
    storageBucket: "todoapp-eeeb7.appspot.com",
    messagingSenderId: "1072574112522",
    appId: "1:1072574112522:web:65fc4e184aed9894dc90f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
