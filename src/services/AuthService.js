import { auth, db, serverTimestamp } from "../db/firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { MigrationService } from "./MigrationService.js";

export class AuthService {
  /**
   * Initializes auth listener.
   * Does NOT auto-sign-in anonymously — authentication is required.
   */
  static initializeAuth(onAuthChange) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists in Firestore
        const userRef = doc(db, "users", user.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const defaultProfile = {
              displayName: user.displayName || user.email?.split('@')[0] || "User",
              email: user.email || "",
              profilePicture: "",
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              preferredLanguage: navigator.language || "en-US",
              themePreference: "system",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              createdBy: user.uid
            };
            const defaultSettings = {
              notificationPreferences: {
                desktop: true,
                mobile: true,
                email: false
              },
              reminderDefaultTime: 30,
              defaultCategories: ["personal", "work", "health"],
              defaultFocusBehavior: "manual",
              backgroundAnimationPreference: "subtle",
              calendarSystem: "jalali"
            };
            
            await setDoc(userRef, {
              ...defaultProfile,
              settings: defaultSettings,
              history: {},
              partner_id: null
            });
          }
          // Trigger migration if coming from local storage
          await MigrationService.migrateLocalData(user.uid);
        } catch (e) {
          console.error("Error ensuring user profile:", e);
        }
        onAuthChange(user);
      } else {
        // No user signed in — do NOT auto-sign-in anonymously.
        // The AuthContext will show the login screen.
        onAuthChange(null);
      }
    });
  }

  static async login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  static async register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  static async logout() {
    return signOut(auth);
  }
}
