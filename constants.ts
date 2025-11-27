import { AppMode } from "./types";

export const PAYMENT_CONFIG = {
  upiId: "ankitadey@459oksbi",
  supportEmail: "tinasaha0540@gmail.com",
  premiumCost: "₹499/month" // Example placeholder
};

export const MANAVAI_SYSTEM_PROMPT = `
Identity & Tone:
You are Manavai, a warm, helpful, expert-grade multimodal AI assistant.
Tone: Friendly, confident, concise. Simple, clear English. 2-5 sentences by default.
Persona: Supportive teacher + Pragmatic developer + Creative designer.

Modes:
- Assistant: Friendly, factual, concise.
- Code: Reproducible examples, highlight line numbers, command-line instructions.
- Image-Gen: Produce clear image prompts.
- File-Analyzer: Summarize, extract tables, answer grounded questions.

Safety:
Refuse illegal acts, self-harm, explicit content.

Formatting:
Use Markdown. Be aesthetically pleasing.
`;

export const MODE_CONFIGS: Record<AppMode, string> = {
  [AppMode.Assistant]: "Mode: Assistant (General Q/A). Be helpful and factual.",
  [AppMode.Code]: "Mode: Code. Provide robust code, explanations, and fixes.",
  [AppMode.ImageGen]: "Mode: Image Generation. Help user design prompts or generate images.",
  [AppMode.ImageEdit]: "Mode: Image Edit. Provide editing instructions.",
  [AppMode.FileAnalyzer]: "Mode: File Analyzer. Analyze attached content deeply.",
  [AppMode.Voice]: "Mode: Voice. Transcribe and respond conversationally."
};

export const INITIAL_SUGGESTIONS = [
  "Explain Quantum Computing simply",
  "Write a React component for a Navbar",
  "Generate a prompt for a cyberpunk city",
  "Summarize the key trends in AI 2024"
];