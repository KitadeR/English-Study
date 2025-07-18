// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"; // ここをFirebase Consoleのバージョンに合わせる
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; // ここをFirebase Consoleのバージョンに合わせる
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // ここをFirebase Consoleのバージョンに合わせる

// あなたのウェブアプリのFirebase設定をここに貼り付けます
const firebaseConfig = {
  apiKey: "AIzaSyDlbi89qgkqGPtlpn-_-5M70A8VqUZ6vOw", // あなたのAPIキー
  authDomain: "english-study-17524.firebaseapp.com", // あなたのAuthドメイン
  projectId: "english-study-17524", // あなたのプロジェクトID
  storageBucket: "english-study-17524.firebasestorage.app", // あなたのStorageバケット
  messagingSenderId: "533186094098", // あなたのSender ID
  appId: "1:533186094098:web:5a8537aa45fefb3690e4cb", // あなたのApp ID
  measurementId: "G-0B6BKE1DSQ" // これはAnalytics用ですが、残しておいても問題ありません
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// 認証（Auth）サービスとFirestore（データベース）サービスを取得
const auth = getAuth(app);
const db = getFirestore(app);

// 他のファイルからこれらのサービスを使えるようにエクスポート
export { auth, db, collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc };