
export enum Role {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export enum AppMode {
  Assistant = 'Assistant',
  Code = 'Code',
  ImageGen = 'Image-Gen',
  ImageEdit = 'Image-Edit',
  FileAnalyzer = 'File-Analyzer',
  Voice = 'Voice'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  type: 'image' | 'file';
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  imageUrl?: string; // For generated images
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  audioData?: string; // Base64 audio for TTS
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  mode: AppMode;
}

export interface PaymentDetails {
  upiId: string;
  email: string;
  amount: string;
}

export interface UserSettings {
  userName: string;
  theme: 'dark' | 'light';
  autoRead: boolean;
}

export interface User {
  id: string; // 16-char unique ID
  email: string;
  name: string;
  plan: 'Free' | 'Premium';
  credits: number;
  avatar?: string;
}

export enum AuthView {
  SignIn = 'SignIn',
  SignUp = 'SignUp'
}

export interface InboxMessage {
  id: string;
  title: string;
  body: string;
  date: number;
  read: boolean;
  code?: string;
}
