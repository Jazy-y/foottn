import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB3eY0wQ9TJzKF7SZaMLRShroFcL8O398k",
  authDomain: "footy-99dd4.firebaseapp.com",
  projectId: "footy-99dd4",
  storageBucket: "footy-99dd4.firebasestorage.app",
  messagingSenderId: "341619785476",
  appId: "1:341619785476:web:e104649cd5b37458959a51",
  measurementId: "G-Y00CSLPTCS",
};

const [, , argEmail, argPassword, argName] = process.argv;
const email = argEmail || "admin@foottn.com";
const password = argPassword || "foottnadmin123";
const displayName = argName || "FootTN Admin";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`[create-admin] Created auth user uid=${uid}`);
  } catch (err) {
    if (err && err.code === "auth/email-already-in-use") {
      console.log(`[create-admin] ${email} already exists, signing in to recover uid...`);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
    } else {
      throw err;
    }
  }

  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName });
    } catch (e) {
      console.warn(`[create-admin] updateProfile warning: ${e.message}`);
    }
  }

  await setDoc(
    doc(db, "users", uid),
    {
      email,
      displayName,
      role: "SUPER_ADMIN",
      walletBalance: 0,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        mvp: 0,
        rating: 50,
      },
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`[create-admin] Wrote users/${uid} with role=SUPER_ADMIN`);
  console.log(`[create-admin] Done. Sign in at /login with:`);
  console.log(`[create-admin]   email:    ${email}`);
  console.log(`[create-admin]   password: ${password}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[create-admin] Failed:", err);
    process.exit(1);
  });
