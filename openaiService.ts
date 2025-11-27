
import { AppMode, Message, Role } from "../types";
import { MANAVAI_SYSTEM_PROMPT, MODE_CONFIGS } from "../constants";

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *streamResponse(
    history: Message[],
    currentInput: string,
    mode: AppMode
  ): AsyncGenerator<{ text: string; isDone?: boolean }, void, unknown> {
    
    const messages = [
        { role: "system", content: `${MANAVAI_SYSTEM_PROMPT}\n${MODE_CONFIGS[mode]}` },
        ...history.filter(m => !m.isError && m.content).map(m => ({ 
            role: m.role === Role.User ? "user" : "assistant", 
            content: m.content 
        })),
        { role: "user", content: currentInput }
    ];

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Or gpt-3.5-turbo
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(line => line.trim() !== "");
                
                for (const line of lines) {
                    if (line.includes("[DONE]")) return;
                    if (line.startsWith("data: ")) {
                        const data = JSON.parse(line.slice(6));
                        const text = data.choices[0]?.delta?.content || "";
                        if (text) yield { text };
                    }
                }
            }
        }
        yield { text: "", isDone: true };

    } catch (e: any) {
        yield { text: `**OpenAI Error:** ${e.message}`, isDone: true };
    }
  }
}
