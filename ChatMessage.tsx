import React, { useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import Logo from './Logo';

interface ChatMessageProps {
  message: Message;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSpeak, isSpeaking }) => {
  const isUser = message.role === Role.User;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Render markdown securely
    if (contentRef.current && (window as any).marked) {
      contentRef.current.innerHTML = (window as any).marked.parse(message.content);
      
      // Apply syntax highlighting
      if ((window as any).hljs) {
        contentRef.current.querySelectorAll('pre code').forEach((block) => {
          (window as any).hljs.highlightElement(block);
        });
      }
    }
  }, [message.content]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`}>
      <div className={`flex gap-4 max-w-4xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg border border-white/10 ${
          isUser 
            ? 'bg-slate-700 text-slate-200' 
            : 'bg-slate-800'
        }`}>
          {isUser ? (
            <i className="fa-solid fa-user text-sm"></i>
          ) : (
            <Logo className="w-6 h-6" />
          )}
        </div>

        {/* Content Bubble */}
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-slate-500 font-medium">
              {isUser ? 'You' : 'Manavai'}
            </span>
            <span className="text-xs text-slate-600">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className={`relative inline-block text-left rounded-2xl px-6 py-4 shadow-sm ${
            isUser 
              ? 'bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700' 
              : 'bg-transparent text-slate-200 p-0 shadow-none w-full'
          }`}>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`flex gap-3 mb-4 flex-wrap ${isUser ? 'justify-end' : 'justify-start'}`}>
                {message.attachments.map((att, i) => (
                  <div key={i} className="relative group/att overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    {att.type === 'image' ? (
                      <img src={att.previewUrl} alt="attachment" className="h-24 w-auto object-cover opacity-90 group-hover/att:opacity-100 transition-opacity" />
                    ) : (
                      <div className="h-16 w-16 flex flex-col items-center justify-center text-slate-400">
                        <i className="fa-solid fa-file text-xl mb-1"></i>
                        <span className="text-[10px] uppercase font-bold">File</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Main Text Content */}
            {isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
                <div className="markdown-body text-slate-300" ref={contentRef} />
            )}

            {/* Generated Image */}
            {message.imageUrl && (
                <div className="mt-4">
                    <img src={message.imageUrl} alt="Generated" className="rounded-xl shadow-2xl border border-slate-700 max-w-md w-full" />
                </div>
            )}

            {/* Streaming Cursor */}
            {message.isStreaming && (
                <span className="typing-cursor text-amber-500"></span>
            )}

            {/* Actions for Bot */}
            {!isUser && !message.isStreaming && !message.isError && (
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={() => onSpeak && onSpeak(message.content)}
                  disabled={isSpeaking}
                  className={`text-slate-500 hover:text-amber-500 transition-colors p-1.5 rounded-md hover:bg-slate-800 ${isSpeaking ? 'animate-pulse text-amber-500' : ''}`}
                  title="Read Aloud"
                >
                  <i className={`fa-solid ${isSpeaking ? 'fa-volume-high' : 'fa-volume-low'}`}></i>
                </button>
                <button 
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-md hover:bg-slate-800"
                  title="Copy"
                >
                  <i className="fa-regular fa-copy"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;