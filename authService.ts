import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { ref, set, get, child, update, push, onValue } from "firebase/database";
import { User, InboxMessage } from "../types";

const ADMIN_EMAIL = "tinasaha0540@gmail.com";

export class AuthService {
  
  private static generateUniqueId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async getCurrentUser(uid: string): Promise<User | null> {
    const snapshot = await get(child(ref(db), `users/${uid}`));
    if (snapshot.exists()) {
      return snapshot.val() as User;
    }
    return null;
  }

  static subscribeToUser(uid: string, callback: (user: User | null) => void) {
    const userRef = ref(db, `users/${uid}`);
    return onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        callback(data ? data as User : null);
    });
  }

  static isAdmin(email: string): boolean {
      return email === ADMIN_EMAIL;
  }

  static async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await this.getCurrentUser(userCredential.user.uid);
    if (!user) throw new Error("User data not found in database");
    return user;
  }

  static async signUp(name: string, email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const manavaiId = this.generateUniqueId();

    const newUser: User = {
      id: manavaiId,
      email,
      name,
      plan: 'Free',
      credits: 50
    };

    await set(ref(db, `users/${uid}`), newUser);

    await this.sendSystemMessage(uid, {
        title: "Welcome to Manavai!",
        body: `Welcome, ${name}! Your unique Manavai ID is ${manavaiId}. Use this ID for support.`,
        code: "WELCOME-GIFT"
    });

    return newUser;
  }

  static async signOut() {
    await firebaseSignOut(auth);
  }

  static async deductCredits(uid: string, currentCredits: number, plan: 'Free' | 'Premium', amount: number) {
    if (plan === 'Premium') return;
    if (currentCredits < amount) throw new Error("Insufficient credits");
    
    await update(ref(db, `users/${uid}`), {
        credits: currentCredits - amount
    });
  }

  static async redeemCode(uid: string, currentCredits: number, code: string): Promise<{ success: boolean, message: string }> {
    const normalizedCode = code.toUpperCase().trim();
    const couponSnap = await get(child(ref(db), `coupons/${normalizedCode}`));
    
    let amount = 0;
    let maxRedemptions = Infinity;
    let usedCount = 0;

    if (couponSnap.exists()) {
        const couponData = couponSnap.val();
        amount = couponData.amount;
        maxRedemptions = couponData.maxRedemptions || Infinity;
        usedCount = couponData.usedCount || 0;

        if (usedCount >= maxRedemptions) {
             return { success: false, message: "This coupon has reached its usage limit." };
        }
    } else if (normalizedCode.startsWith("MANAVAI-CREDIT-")) {
        const val = parseInt(normalizedCode.split("-")[2]);
        if (!isNaN(val)) amount = val;
    } else if (normalizedCode === 'MANAVAI50') {
        amount = 50;
    }

    if (amount === 0) {
        return { success: false, message: "Invalid coupon code." };
    }

    const redeemedSnap = await get(child(ref(db), `redemptions/${uid}/${normalizedCode}`));
    if (redeemedSnap.exists()) {
        return { success: false, message: "You have already used this coupon." };
    }

    const updates: any = {};
    updates[`users/${uid}/credits`] = currentCredits + amount;
    updates[`redemptions/${uid}/${normalizedCode}`] = true;
    
    if (couponSnap.exists()) {
        updates[`coupons/${normalizedCode}/usedCount`] = usedCount + 1;
    }

    await update(ref(db), updates);

    return { success: true, message: `Successfully added ${amount} credits!` };
  }

  static subscribeToInbox(uid: string, callback: (msgs: InboxMessage[]) => void) {
      const inboxRef = ref(db, `inbox/${uid}`);
      return onValue(inboxRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) {
              callback([]);
              return;
          }
          const msgs = Object.values(data) as InboxMessage[];
          callback(msgs.sort((a, b) => b.date - a.date));
      });
  }

  static async markMessageRead(uid: string, msgId: string) {
      await update(ref(db, `inbox/${uid}/${msgId}`), { read: true });
  }

  static async sendSystemMessage(uid: string, msg: { title: string, body: string, code?: string }) {
      const newMsgRef = push(ref(db, `inbox/${uid}`));
      const newMsg: InboxMessage = {
          id: newMsgRef.key!, 
          title: msg.title,
          body: msg.body,
          code: msg.code || null, // Fix: Ensure code is never undefined
          date: Date.now(),
          read: false
      };
      await set(newMsgRef, newMsg);
  }
}