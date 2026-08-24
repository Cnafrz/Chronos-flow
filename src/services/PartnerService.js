import { db } from "../db/firebase.js";
import { collection, doc, setDoc, updateDoc, query, where, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";

export class PartnerService {
  static async generateInviteCode(uid) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    if (!uid) throw new Error("You must be logged in to generate a code");

    await setDoc(doc(db, "partner_invites", code), {
      sender_id: uid,
      status: "pending",
      created_at: serverTimestamp()
    });
    return code;
  }

  static async acceptInvite(uid, code) {
    const normalizedCode = code.trim().toUpperCase();
    if (!uid || normalizedCode.length !== 6) throw new Error("Enter a valid 6-character code");

    const inviteRef = doc(db, "partner_invites", normalizedCode);
    return runTransaction(db, async (transaction) => {
      const invite = await transaction.get(inviteRef);
      if (!invite.exists()) throw new Error("Invalid code");

      const data = invite.data();
      if (data.status !== "pending") throw new Error("Code already used");
      if (data.sender_id === uid) throw new Error("You cannot use your own code");

      const senderRef = doc(db, "users", data.sender_id);
      const recipientRef = doc(db, "users", uid);
      const [sender, recipient] = await Promise.all([transaction.get(senderRef), transaction.get(recipientRef)]);
      if (!sender.exists() || !recipient.exists()) throw new Error("Partner account was not found");
      if (sender.data().partner_id || recipient.data().partner_id) throw new Error("One of these accounts is already linked");

      transaction.update(senderRef, { partner_id: uid, updatedAt: serverTimestamp() });
      transaction.update(recipientRef, { partner_id: data.sender_id, updatedAt: serverTimestamp() });
      transaction.update(inviteRef, { status: "accepted", accepted_by: uid, accepted_at: serverTimestamp() });
      return data.sender_id;
    });
  }

  static async disconnectPartner(uid, partnerId) {
    if (!uid || !partnerId) return;
    await updateDoc(doc(db, "users", uid), { partner_id: null });
    await updateDoc(doc(db, "users", partnerId), { partner_id: null });
  }

  static subscribeToPartnerTasks(partnerId, callback) {
    const q = query(collection(db, "tasks"), where("owner_id", "==", partnerId));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = [];
      snapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));
      callback(tasks);
    }, (error) => {
      console.error("Error subscribing to partner tasks:", error);
    });
  }

  static subscribeToPartnerProfile(partnerId, callback) {
    const q = doc(db, "users", partnerId);
    return onSnapshot(q, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    }, (error) => {
      console.error("Error subscribing to partner profile:", error);
    });
  }
}
