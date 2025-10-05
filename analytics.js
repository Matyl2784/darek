// Import Firebase (modulová syntaxe)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// 🔑 Tvoje konfigurace z Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCMifD1WL04-WNN2euciK2epNCUP5qNFpA",
  authDomain: "web-analytics-f6777.firebaseapp.com",
  projectId: "web-analytics-f6777",
  storageBucket: "web-analytics-f6777.firebasestorage.app",
  messagingSenderId: "507005327319",
  appId: "1:507005327319:web:cb513fdd8efe135842dd92"
};

// 🔥 Inicializace Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🕒 Začátek návštěvy
const startTime = Date.now();
const visitId = `${startTime}-${Math.floor(Math.random() * 99999)}`;

// 🧠 Info o prohlížeči a OS
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  let os = "Unknown";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone")) os = "iOS";

  return { browser, os };
};

// 📊 Strukturovaná data návštěvy
const visitData = {
  info: {
    url: window.location.href,
    referrer: document.referrer || "direct",
    browser: getBrowserInfo().browser,
    os: getBrowserInfo().os,
    device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    screen: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  session: {
    startTime,
    endTime: null,
    timeSpent: 0,
    boxOpened: false,
    boxOpenTime: null,
    lastUpdate: startTime
  },
  log: [
    {
      timestamp: startTime,
      action: "session_start"
    }
  ]
};

// 💾 Uložení první verze
const visitRef = doc(collection(db, "visits"), visitId);
await setDoc(visitRef, visitData);

// ⏱️ Pravidelné aktualizace (každých 10 sekund)
const interval = setInterval(async () => {
  const now = Date.now();
  const timeSpent = Math.round((now - startTime) / 1000);
  try {
    await updateDoc(visitRef, {
      "session.timeSpent": timeSpent,
      "session.lastUpdate": now,
      log: arrayUnion({
        timestamp: now,
        action: "heartbeat",
        timeSpent
      })
    });
  } catch (e) {
    console.error("Error updating Firestore:", e);
  }
}, 10000);

// 🎁 Událost otevření boxu
window.addEventListener("openbox", async () => {
  const now = Date.now();
  try {
    await updateDoc(visitRef, {
      "session.boxOpened": true,
      "session.boxOpenTime": now,
      log: arrayUnion({
        timestamp: now,
        action: "box_opened"
      })
    });
    console.log("📦 Událost 'box_opened' zapsána.");
  } catch (e) {
    console.error("❌ Chyba při zápisu 'box_opened':", e);
  }
});

// 🚪 Odchod uživatele
window.addEventListener("beforeunload", async () => {
  clearInterval(interval);
  const endTime = Date.now();
  const total = Math.round((endTime - startTime) / 1000);

  try {
    await updateDoc(visitRef, {
      "session.endTime": endTime,
      "session.timeSpent": total,
      log: arrayUnion({
        timestamp: endTime,
        action: "session_end",
        totalTime: total
      })
    });
  } catch (e) {
    console.error("Unload update failed:", e);
  }
});
