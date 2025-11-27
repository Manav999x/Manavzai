import React, { useState, useEffect, useRef } from 'react';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AppMode, Message, Role, Attachment, User, ChatSession } from './types';
import { GeminiService } from './services/geminiService';
import { OpenAIService } from './services/openaiService';
import { AuthService } from './services/authService';
import { ChatService } from './services/chatService';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import PaymentModal from './components/PaymentModal';
import RedeemModal from './components/RedeemModal';
import ShopModal from './components/ShopModal';
import InboxModal from './components/InboxModal';
import AdminPanel from './components/AdminPanel';
import AuthScreen from './components/AuthScreen';
import Logo from './components/Logo';
import { INITIAL_SUGGESTIONS } from './constants';

const App: React.FC = () => {
  const GEMINI_API_KEY = process.env.API_KEY || ''; 
  const OPENAI_API_KEY = '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'; 
  
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [mode, setMode] = useState<AppMode>(AppMode.Assistant);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [showPayment, setShowPayment] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const geminiService = useRef<GeminiService | null>(null);
  const openaiService = useRef<OpenAIService | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (GEMINI_API_KEY) geminiService.current = new GeminiService(GEMINI_API_KEY);
    if (OPENAI_API_KEY) openaiService.current = new OpenAIService(OPENAI_API_KEY);
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setFirebaseUid(currentUser.uid);
            const appUser = await AuthService.getCurrentUser(currentUser.uid);
            if (appUser) {
                setUser(appUser);
                loadSessions(currentUser.uid);
            }
            AuthService.subscribeToUser(currentUser.uid, (updatedUser) => {
                if (updatedUser) setUser(updatedUser);
            });
        } else {
            setUser(null);
            setFirebaseUid(null);
            setMessages([]);
            setCurrentSession(null);
            setSavedSessions([]);
        }
        setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const loadSessions = async (uid: string) => {
    try {
        const sessions = await ChatService.getSessions(uid);
        setSavedSessions(sessions);
    } catch (e) { console.error("Failed to load sessions", e); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setMode(AppMode.Assistant);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
    setMode(session.mode);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!firebaseUid) return;
    await ChatService.deleteSession(firebaseUid, sessionId);
    loadSessions(firebaseUid);
    if (currentSession?.id === sessionId) handleNewChat();
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isGenerating || !user || !firebaseUid) return;

    if (user.plan !== 'Premium' && user.credits < 3) {
      alert("You have run out of credits! Please upgrade to Premium or redeem a code.");
      setShowShop(true);
      return;
    }

    const userText = inputValue;
    const currentAttachments = attachments.map(a => a.file);
    const tempAttachments = [...attachments];

    setInputValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let session = currentSession;
    let isNewSession = false;

    if (!session) {
        session = ChatService.createSession(mode);
        session.title = userText.length > 30 ? userText.substring(0, 30) + '...' : userText || 'New Image/File';
        isNewSession = true;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.User,
      content: userText,
      attachments: tempAttachments,
      timestamp: Date.now()
    };
    
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: Role.Model,
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
      imageUrl: null // Initialize as null to prevent undefined error
    };

    const newMessages = [...messages, userMsg, botMsg];
    setMessages(newMessages);
    setIsGenerating(true);
    
    const updatedSession = { ...session, messages: newMessages, timestamp: Date.now() };
    setCurrentSession(updatedSession);
    
    // Save initial state (non-blocking)
    ChatService.saveSession(firebaseUid, updatedSession)
      .then(() => { if (isNewSession) loadSessions(firebaseUid!); })
      .catch(e => console.error("Save session error", e));

    try {
      if (user.plan !== 'Premium') {
        await AuthService.deductCredits(firebaseUid, user.credits, user.plan, 3);
      }

      let stream;
      if (OPENAI_API_KEY && openaiService.current) {
          stream = openaiService.current.streamResponse(messages, userText, mode);
      } else if (geminiService.current) {
          stream = geminiService.current.streamResponse(messages, userText, mode, currentAttachments);
      }

      if (!stream) throw new Error("No AI Service configured.");

      let accumulatedText = "";
      
      for await (const chunk of stream) {
        if (chunk.text) accumulatedText += chunk.text;
        
        const finalMessages = newMessages.map(msg => {
          if (msg.id === botMsgId) {
            // Explicitly handle imageUrl to avoid undefined. Default to NULL.
            const newImageUrl = (chunk as any).imageUrl || msg.imageUrl || null;
            return {
              ...msg,
              content: accumulatedText,
              imageUrl: newImageUrl,
              isStreaming: !chunk.isDone
            };
          }
          return msg;
        });

        setMessages(finalMessages);
        if (chunk.isDone) {
            await ChatService.saveSession(firebaseUid, { ...updatedSession, messages: finalMessages });
        }
      }
      loadSessions(firebaseUid);

    } catch (error: any) {
      console.error(error);
      const errorMessages = newMessages.map(msg => {
        if (msg.id === botMsgId) {
          return { ...msg, content: `**Error:** ${error.message || "Something went wrong."}`, isStreaming: false, isError: true };
        }
        return msg;
      });
      setMessages(errorMessages);
      await ChatService.saveSession(firebaseUid, { ...updatedSession, messages: errorMessages });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
    };
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    if (!geminiService.current) return;
    setIsSpeaking(true);
    
    try {
        const base64Audio = await geminiService.current.generateSpeech(text.slice(0, 4000));
        if (base64Audio) {
            const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
            audioRef.current = audio;
            audio.onended = () => setIsSpeaking(false);
            audio.play();
        } else {
            setIsSpeaking(false);
        }
    } catch (e) {
        console.error("TTS play error", e);
        setIsSpeaking(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = Array.from(e.target.files).map((file: File) => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        type: file.type.startsWith('image/') ? 'image' : 'file'
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };
  
  const handleSignOut = () => {
    AuthService.signOut();
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
         <div className="animate-pulse">
            <Logo className="w-16 h-16" />
         </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={() => {}} />; 
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden selection:bg-amber-500/30">
      
      <Sidebar 
        currentMode={mode}
        setMode={setMode}
        onClear={handleNewChat}
        onPayment={() => setShowPayment(true)}
        onRedeem={() => setShowRedeem(true)}
        onShop={() => setShowShop(true)}
        onInbox={() => setShowInbox(true)}
        onSignOut={handleSignOut}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        user={user}
        sessions={savedSessions}
        currentSessionId={currentSession?.id || null}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {AuthService.isAdmin(user.email) && (
          <button 
            onClick={() => setShowAdmin(true)}
            className="fixed bottom-4 right-4 z-[60] bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 border border-red-500"
            title="Open Admin Panel"
          >
              <i className="fa-solid fa-user-shield"></i>
          </button>
      )}

      <div className="flex-1 flex flex-col h-full relative w-full">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400">
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="font-bold text-slate-200">Manavai</span>
          </div>
          <div className="w-6"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto flex flex-col min-h-full">
            
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-slate-700/50 backdrop-blur-sm">
                  <Logo className="w-16 h-16" />
                </div>
                <h2 className="text-3xl font-bold text-slate-100 mb-3 tracking-tight">How can Manavai help, {user.name}?</h2>
                <div className="flex items-center gap-2 text-amber-500/80 mb-10 text-sm font-medium uppercase tracking-wider">
                    <i className="fa-solid fa-bolt"></i>
                    <span>{mode} Mode Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full px-4">
                  {INITIAL_SUGGESTIONS.map((suggestion, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setInputValue(suggestion)}
                      className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all text-sm text-slate-300 text-left hover:shadow-lg hover:-translate-y-0.5"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1">
                {messages.map((msg) => (
                    <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        onSpeak={handleSpeak}
                        isSpeaking={isSpeaking}
                    />
                ))}
            </div>
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        <div className="p-4 bg-slate-900 border-t border-slate-800/50">
          <div className="max-w-3xl mx-auto">
            {attachments.length > 0 && (
              <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                {attachments.map((att, i) => (
                  <div key={i} className="relative group">
                    {att.type === 'image' ? (
                      <img src={att.previewUrl} className="h-16 w-16 object-cover rounded-xl border border-slate-600" />
                    ) : (
                      <div className="h-16 w-16 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                        <i className="fa-solid fa-file text-slate-400"></i>
                      </div>
                    )}
                    <button 
                      onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-slate-700 hover:bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center transition-colors shadow-md"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-lg">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask anything in ${mode} mode...`}
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 pl-4 pr-32 text-slate-200 placeholder-slate-500 max-h-48"
                rows={1}
              />
              
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                 <button onClick={handleVoiceInput} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"><i className="fa-solid fa-microphone"></i></button>
                 <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"><i className="fa-solid fa-paperclip"></i></button>
                 <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                 <button onClick={handleSendMessage} disabled={(!inputValue.trim() && attachments.length === 0) || isGenerating} className={`p-2 rounded-lg transition-all flex items-center justify-center w-10 h-10 ml-1 ${(!inputValue.trim() && attachments.length === 0) || isGenerating ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg'}`}>{isGenerating ? <i className="fa-solid fa-stop animate-pulse"></i> : <i className="fa-solid fa-arrow-up"></i>}</button>
              </div>
            </div>
            
            <p className="text-center text-xs text-slate-500 mt-3">Manavai Premium can make mistakes. Consider checking important information.</p>
          </div>
        </div>
      </div>

      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} user={user} />
      
      <RedeemModal 
        isOpen={showRedeem} 
        onClose={() => setShowRedeem(false)} 
        onUserUpdate={() => {}} 
      />
      
      <ShopModal isOpen={showShop} onClose={() => setShowShop(false)} user={user} />
      <InboxModal isOpen={showInbox} onClose={() => setShowInbox(false)} />
      <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
    </div>
  );
};

export default App;