import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Replace these values with your new Firebase project config.
// Get these from: https://console.firebase.google.com/ > Your Project > Project Settings > General > Your apps > Web app config
const firebaseConfig = {
  apiKey: "AIzaSyCGCynJyeKn_Ofj5mDUY7QdhRhZa6HLR_M",
  authDomain: "smartwash-7a1f8.firebaseapp.com",
  projectId: "smartwash-7a1f8",
  storageBucket: "smartwash-7a1f8.firebasestorage.app",
  messagingSenderId: "431320708442",
  appId: "1:431320708442:web:ed08c88746ddb2b7292f63",
  measurementId: "G-MYNPH3Z425"
};

let app = null;
let auth = null;
let db = null;
let firebaseEnabled = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  firebaseEnabled = true;
} catch (error) {
  console.warn("Firebase initialization failed:", error);
}

window.firebaseEnabled = firebaseEnabled;

window.firebaseService = {
  enabled: firebaseEnabled,
  auth,
  db,
  signIn: async (email, password) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    return signInWithEmailAndPassword(auth, email, password);
  },
  signOut: async () => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    return signOut(auth);
  },
  onAuthStateChanged: (callback) => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },
  getUserByUid: async (uid) => {
    if (!db) return null;
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? snapshot.data() : null;
  },
  getTenantById: async (tenantId) => {
    if (!db) return null;
    const tenantRef = doc(db, "tenants", tenantId);
    const snapshot = await getDoc(tenantRef);
    return snapshot.exists() ? snapshot.data() : null;
  },
  getOrders: async (tenantId) => {
    if (!db) return [];
    const ordersQuery = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
    );
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  },
  saveOrder: async (order) => {
    if (!db) throw new Error("Firestore not initialized");
    const orderData = {
      ...order,
      tenantId: order.tenantId,
      updatedAt: serverTimestamp(),
    };

    if (!order.id) {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        tenantId: order.tenantId,
        createdAt: serverTimestamp(),
      });
      return { ...orderData, tenantId: order.tenantId, id: docRef.id };
    }

    const orderRef = doc(db, "orders", order.id.toString());
    await setDoc(
      orderRef,
      {
        ...orderData,
        tenantId: order.tenantId,
      },
      { merge: true },
    );
    return { ...orderData, tenantId: order.tenantId, id: order.id };
  },
  deleteOrder: async (orderId) => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "orders", orderId.toString()));
  },
  getNotifications: async (tenantId) => {
    if (!db) return [];
    const notifQuery = query(
      collection(db, "notifications"),
      where("tenantId", "==", tenantId),
    );
    const snapshot = await getDocs(notifQuery);
    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  },
  saveNotification: async (notification) => {
    if (!db) throw new Error("Firestore not initialized");
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
      read: false,
    };
    const docRef = await addDoc(
      collection(db, "notifications"),
      notificationData,
    );
    return { ...notificationData, id: docRef.id };
  },
  updateNotification: async (notificationId, changes) => {
    if (!db) throw new Error("Firestore not initialized");
    const notifRef = doc(db, "notifications", notificationId.toString());
    await updateDoc(notifRef, changes);
  },
  getTenantSettings: async (tenantId) => {
    const tenant = await window.firebaseService.getTenantById(tenantId);
    return tenant?.settings || null;
  },
};

// Test Firebase connection
window.testFirebaseConnection = async () => {
  try {
    if (!firebaseEnabled) {
      console.log("❌ Firebase not enabled - check config");
      return false;
    }

    // Test Firestore connection
    const testDoc = await addDoc(collection(db, "test"), {
      test: true,
      timestamp: serverTimestamp(),
    });
    await deleteDoc(doc(db, "test", testDoc.id));

    console.log("✅ Firebase Firestore connection successful");
    return true;
  } catch (error) {
    console.log("❌ Firebase connection failed:", error.message);
    return false;
  }
};

window.firebaseService = window.firebaseService;
