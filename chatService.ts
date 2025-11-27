import { db } from "./firebase";
import { ref, get, set, remove, child } from "firebase/database";
import { ChatSession, AppMode } from "../types";

export class ChatService {
  
  // Helper to recursively replace undefined with null (Firebase crashes on undefined)
  private static sanitizeForFirebase(obj: any): any {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(v => this.sanitizeForFirebase(v));
    }
    
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = this.sanitizeForFirebase(obj[key]);
        // Firebase allows null to delete, or values. strict check for undefined.
        newObj[key] = val === undefined ? null : val;
      }
    }
    return newObj;
  }

  static async getSessions(uid: string): Promise<ChatSession[]> {
    const snapshot = await get(child(ref(db), `chats/${uid}`));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    const sessions = Object.values(data) as ChatSession[];
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  }

  static async saveSession(uid: string, session: ChatSession) {
    // Clean the session object before saving
    const cleanSession = this.sanitizeForFirebase(session);
    await set(ref(db, `chats/${uid}/${session.id}`), cleanSession);
  }

  static createSession(mode: AppMode = AppMode.Assistant): ChatSession {
    return {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      title: 'New Chat',
      messages: [],
      timestamp: Date.now(),
      mode
    };
  }

  static async deleteSession(uid: string, sessionId: string) {
    await remove(ref(db, `chats/${uid}/${sessionId}`));
  }
}