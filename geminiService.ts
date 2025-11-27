import { GoogleGenAI, Modality } from "@google/genai";
import { AppMode, Message, Role } from "../types";
import { MANAVAI_SYSTEM_PROMPT, MODE_CONFIGS } from "../constants";

const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export class GeminiService {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) console.error("API Key is missing. Check your environment variables.");
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateSpeech(text: string): Promise<string | null> {
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts", 
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, 
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
      console.warn("TTS Generation failed (Model might not be available):", e);
      return null;
    }
  }

  // Helper to try generating content with a specific model
  private async *tryGenerate(
    modelName: string,
    parts: any[],
    systemInstruction: string,
    apiHistory: any[]
  ) {
    const chat = this.client.chats.create({
      model: modelName,
      config: { systemInstruction },
      history: apiHistory
    });

    const resultStream = await chat.sendMessageStream({
      message: parts
    });

    for await (const chunk of resultStream) {
      const text = chunk.text;
      if (text) yield { text };
    }
  }

  async *streamResponse(
    history: Message[],
    currentInput: string,
    mode: AppMode,
    attachments: File[] = []
  ): AsyncGenerator<{ text: string; imageUrl?: string; isDone?: boolean }, void, unknown> {
    
    // Prepare Data
    const parts: any[] = [];
    if (currentInput) parts.push({ text: currentInput });
    for (const file of attachments) {
      parts.push(await fileToPart(file));
    }

    const systemInstruction = `${MANAVAI_SYSTEM_PROMPT}\n${MODE_CONFIGS[mode]}`;

    // --- Image Generation Mode ---
    if (mode === AppMode.ImageGen) {
      try {
        const response = await this.client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { systemInstruction }
        });

        let generatedImageUrl: string | undefined;
        let generatedText = "";

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                } else if (part.text) {
                    generatedText += part.text;
                }
            }
        }
        yield { text: generatedText || "Here is your visualization.", imageUrl: generatedImageUrl, isDone: true };
        return;
      } catch (e: any) {
        yield { text: `Image Generation Error: ${e.message}. Try describing the image in Assistant mode.`, isDone: true };
        return;
      }
    }

    // --- Chat Mode with Fallback Logic ---
    
    // 1. Prepare History
    const validRawHistory = history.filter(msg => 
      msg.role !== Role.System && 
      !msg.isError && 
      msg.content && 
      msg.content.trim() !== ''
    );

    const apiHistory = validRawHistory.map(msg => ({
        role: msg.role === Role.User ? 'user' : 'model',
        parts: [{ text: msg.content }] 
    }));

    // Sanitize History: Ensure alternating turns (User -> Model -> User)
    if (apiHistory.length > 0 && apiHistory[apiHistory.length - 1].role === 'user') {
        apiHistory.pop(); 
    }

    // 2. Define Model Hierarchy (Fastest -> Most Stable)
    const modelsToTry = ['gemini-1.5-flash', 'gemini-pro'];
    let lastError: any;
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        const stream = this.tryGenerate(modelName, parts, systemInstruction, apiHistory);
        for await (const chunk of stream) {
          yield chunk;
        }
        success = true;
        yield { text: "", isDone: true };
        break; // Stop if successful
      } catch (error: any) {
        lastError = error;
        // Stringify to catch nested error objects
        const errorString = JSON.stringify(error) + (error.message || "");
        
        const isModelError = errorString.includes("404") || errorString.includes("NOT_FOUND") || errorString.includes("400") || errorString.includes("INVALID_ARGUMENT");
        
        if (isModelError) {
          console.warn(`Model ${modelName} failed, falling back...`);
          continue;
        } else {
          // If it's a quota limit (429) or API key error, fail immediately
          break;
        }
      }
    }

    if (!success) {
        let userFriendlyError = "Connection failed.";
        if (lastError?.message) {
           if (lastError.message.includes("429")) userFriendlyError = "Server is busy (Quota Exceeded). Please wait a moment.";
           else if (lastError.message.includes("API_KEY")) userFriendlyError = "Invalid API Key.";
           else userFriendlyError = `System Error: ${lastError.message}`;
        }
        yield { text: `\n\n**${userFriendlyError}**`, isDone: true };
    }
  }
}