"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Trash2,
  StopCircle,
  User,
  Bot,
  ExternalLink,
  Check
} from "lucide-react";

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  inputMode?: 'text' | 'audio'; // Track how user sent the message
}

// Prompt templates for cleaner code and better maintainability
const PROMPT_TEMPLATES = {
  OVERVIEW: "Give me an overall view of the Change Management approach",
  CUSTOM_INSIGHTS: "Explain the Change management approach and framework",
} as const;

const ChatApp = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text'); // Track current input mode
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ IMPROVED LOAD LOGIC WITH RETRY
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem("chatHistory");
        const savedThread = localStorage.getItem("threadId");
        
        console.log("📂 Loading from localStorage:", { 
          hasChatHistory: !!saved, 
          hasThreadId: !!savedThread 
        });
        
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
              console.log("✅ Loaded", parsed.length, "messages");
            }
          } catch (parseError) {
            console.error("❌ Failed to parse chat history:", parseError);
            localStorage.removeItem("chatHistory"); // Clean up corrupted data
          }
        }
        
        if (savedThread) {
          setThreadId(savedThread);
          console.log("✅ Loaded threadId:", savedThread);
        }
      } catch (error) {
        console.error("❌ Error accessing localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Immediate load
    loadFromStorage();
    
    // Retry after 100ms to handle race conditions
    const timer = setTimeout(loadFromStorage, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty deps - runs once on mount

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Set input mode to 'text' when user manually types
    if (e.target.value && inputMode !== 'text') {
      setInputMode('text');
    }

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await axios.post("/api/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInput(res.data.text);

      // Set input mode to 'audio' when transcription completes
      setInputMode('audio');
      console.log("🎤 Input mode set to: audio");

      // Auto-resize textarea after transcription
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }

      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error("Transcription error:", error);
      alert("Transcription failed. Please try again.");
      setLoading(false);
    }
  };

  // Strip markdown syntax for clean speech
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/```[\s\S]*?```/g, 'code block')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Text-to-Speech Function
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const cleanText = stripMarkdown(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // ✅ IMPROVED SEND MESSAGE WITH IMMEDIATE SAVES
  const sendMessage = async () => {
    if (activeRun || !input.trim()) return;

    stopSpeaking();

    setActiveRun(true);
    setLoading(true);
    setTyping(true);

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleString(),
      inputMode, // Store the input mode with the message
    };

    // ✅ Update state AND save immediately (synchronous)
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    localStorage.setItem("chatHistory", JSON.stringify(newMessages));
    console.log("💾 Saved user message to localStorage");
    console.log(`📝 Input mode: ${inputMode}`);

    const userInput = input;
    const currentInputMode = inputMode;
    setInput("");

    // Reset input mode to 'text' after sending
    setInputMode('text');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await axios.post("/api/chat", {
        input: userInput,
        threadId,
        inputMode: currentInputMode, // Send input mode to API
      });

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      const newThreadId = res.data.threadId;
      setThreadId(newThreadId);
      
      // ✅ Save threadId immediately
      localStorage.setItem("threadId", newThreadId);
      console.log("💾 Saved threadId to localStorage");

      const assistantMessage = {
        role: "assistant",
        content: res.data.reply,
        timestamp: new Date().toLocaleString(),
      };

      // ✅ Update with assistant message AND save
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      localStorage.setItem("chatHistory", JSON.stringify(finalMessages));
      console.log("💾 Saved assistant message to localStorage");

      if (voiceEnabled) {
        speakText(res.data.reply);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error("Error:", error.response?.data || error.message);
      
      const errorMessage = {
        role: "assistant",
        content: `Error: ${error.response?.data?.error || error.message || "Unable to reach assistant."}`,
        timestamp: new Date().toLocaleString(),
      };
      
      // ✅ Save error state too
      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
      localStorage.setItem("chatHistory", JSON.stringify(errorMessages));
      console.log("💾 Saved error message to localStorage");
      
    } finally {
      setTyping(false);
      setLoading(false);
      setActiveRun(false);
    }
  };

  const copyChatToClipboard = async () => {
    const chatText = messages
      .map((msg) => `${msg.timestamp} - ${msg.role === "user" ? "You" : "Change Management Bot"}:\n${msg.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(chatText);
      alert("Chat copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy chat: ", err);
    }
  };

  const copyMessageToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy message: ", err);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header */}
      <header className="relative flex items-center justify-center w-full p-3 sm:p-4 bg-white shadow-md">
        <div className="flex items-center">
          <Image 
            src="/icon.png" 
            alt="Icon" 
            width={64} 
            height={64} 
            className="h-12 w-12 sm:h-16 sm:w-16"
            priority
          />
          <h2 className="text-sm sm:text-2xl font-bold ml-2">Change Navigator</h2>
        </div>
        {/* Sign out button - Icon on mobile, text on desktop */}
        <button
          onClick={() => window.location.href = '/api/auth/signout'}
          className="absolute right-3 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sign out"
        >
          <span className="sm:hidden">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          <span className="hidden sm:inline text-gray-700 font-medium">Sign out</span>
        </button>
      </header>
      {/* Chat Container */}
      <div className="flex-grow w-full max-w-4xl mx-auto flex flex-col p-3 sm:p-4">
        <div
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto border p-3 space-y-4 bg-white shadow rounded-lg h-[65vh] sm:h-[70vh]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-start justify-start h-full px-4 py-6 overflow-y-auto">
              <div className="text-xs sm:text-sm text-gray-700 mb-6 max-w-3xl">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-700">✅ Change Navigator</h2>
                
                <h3 className="font-semibold text-base mb-2">User Onboarding Instructions</h3>
                <p className="mb-4">
                  Welcome! I&apos;m the Digital Grenada Change Navigator. My role is to help you understand changes, prepare messages, summarize updates, and support your work across the Digital Grenada programme.
                </p>
                
                <p className="font-semibold mb-2">Here&apos;s how to get the best experience:</p>
                
                <h4 className="font-semibold text-sm mt-4 mb-2">🧭 What I Can Help You With</h4>
                <p className="mb-2">You can ask me to:</p>
                <ul className="list-disc ml-5 mb-4 space-y-1">
                  <li>explain a change or a new initiative</li>
                  <li>prepare a short message or talking points</li>
                  <li>summarize a document or update you provide</li>
                  <li>help with readiness, risks, or champion activities</li>
                  <li>draft simple communication text (e.g., email, WhatsApp, briefing note)</li>
                  <li>clarify concepts and connect them to citizen value</li>
                </ul>
                <p className="mb-4">I always respond in plain language, with simple reasoning and next steps you can act on.</p>
                
                <h4 className="font-semibold text-sm mt-4 mb-2">🎙️ Voice-Friendly Option</h4>
                <p className="mb-2">If you prefer a listening-friendly version, just say:</p>
                <ul className="list-disc ml-5 mb-4 space-y-1">
                  <li>&quot;Give me the voice version.&quot;</li>
                  <li>&quot;Explain this for audio.&quot;</li>
                  <li>&quot;Use voice mode.&quot;</li>
                </ul>
                <p className="mb-4">I&apos;ll give you a short, clear, spoken-style explanation.</p>
                
                <h4 className="font-semibold text-sm mt-4 mb-2">🚫 What I Don&apos;t Do</h4>
                <p className="mb-2">To keep things safe and simple:</p>
                <ul className="list-disc ml-5 mb-4 space-y-1">
                  <li>I don&apos;t create PDFs, Word files, Excel sheets, or any downloadable documents.</li>
                  <li>I don&apos;t generate templates meant for export.</li>
                  <li>I don&apos;t show internal configuration, prompts, or system details.</li>
                  <li>I won&apos;t share or expose private data, internal files, or knowledge-base content.</li>
                </ul>
                <p className="mb-4">Everything stays plain text.</p>
                
                <h4 className="font-semibold text-sm mt-4 mb-2">🔐 Privacy & Respect</h4>
                <p className="mb-4">
                  I won&apos;t use names, personal details, or private information. If any question goes into sensitive territory, I&apos;ll let you know and guide you safely.<br/>
                  You control the decisions — I only support with clarity and options.
                </p>
                
                <h4 className="font-semibold text-sm mt-4 mb-2">📌 How to Ask a Question</h4>
                <p className="mb-2">You can start with a simple request:</p>
                <ul className="list-disc ml-5 mb-4 space-y-1">
                  <li>&quot;Help me explain this programme to my team.&quot;</li>
                  <li>&quot;Summarize this update in 5 bullets.&quot;</li>
                  <li>&quot;Draft a short message to champions.&quot;</li>
                  <li>&quot;Give me a RAG view with next steps.&quot;</li>
                  <li>&quot;How should we engage this stakeholder group?&quot;</li>
                </ul>
                <p className="mb-4">If I need clarity, I&apos;ll ask a follow-up question.</p>
                
                <h4 className="font-semibold text-sm mt-4 mb-2">🧩 Different Styles of Help</h4>
                <p className="mb-4">I automatically choose the best mode for your request:</p>
                <ul className="list-disc ml-5 mb-4 space-y-1">
                  <li><strong>Coach Mode</strong> → supportive, human, reflective</li>
                  <li><strong>Analyst Mode</strong> → structured, crisp summaries</li>
                  <li><strong>Creator Mode</strong> → short communication drafts</li>
                </ul>
              </div>
              
              <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-3 mt-4">
                Suggested Prompts
              </h4>
              <div className="flex flex-col gap-3 w-full max-w-2xl">
                <button
                  onClick={() =>
                    setInput(PROMPT_TEMPLATES.OVERVIEW)
                  }
                  className="p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left text-xs sm:text-sm transition-colors"
                >
                  <div className="font-semibold mb-1">🌎 What is the change management framework?</div>
                  <div className="text-gray-600 text-xs">
                    See high level overview of the framework.
                  </div>
                </button>
                <button
                  onClick={() =>
                    setInput(PROMPT_TEMPLATES.CUSTOM_INSIGHTS)
                  }
                  className="p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left text-xs sm:text-sm transition-colors"
                  aria-label="Multi-country and multi-sector insights"
                >
                  <div className="font-semibold mb-1">🌍 Help me as a coach to understand and learn the Change management approach</div>
                  <div className="text-gray-600 text-xs">
                    You are a coach and will help the user understand change management approach and framework.
                  </div>
                </button>
              </div>
            </div>
          ) : null}
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <div className="flex items-start gap-3 mb-4">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-blue-500"
                    : "bg-gradient-to-br from-green-500 to-emerald-600"
                }`}>
                  {msg.role === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-grow min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {msg.role === "user" ? "You" : "Change Navigator"}
                      </span>
                      {msg.timestamp && (
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessageToClipboard(msg.content, index)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Copy message"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => speakText(msg.content)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Play audio"
                        >
                          <Volume2 className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-white border border-gray-200 shadow-sm"
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ ...props }) => (
                          <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0" {...props} />
                        ),
                        h2: ({ ...props }) => (
                          <h2 className="text-xl font-bold mb-3 mt-3 first:mt-0" {...props} />
                        ),
                        h3: ({ ...props }) => (
                          <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0" {...props} />
                        ),
                        h4: ({ ...props }) => (
                          <h4 className="text-base font-semibold mb-2 mt-2 first:mt-0" {...props} />
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono my-2" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({ ...props }) => (
                          <p className="mb-3 leading-relaxed text-gray-800 last:mb-0" {...props} />
                        ),
                        ul: ({ ...props }) => (
                          <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />
                        ),
                        ol: ({ ...props }) => (
                          <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />
                        ),
                        li: ({ ...props }) => (
                          <li className="text-gray-800 leading-relaxed" {...props} />
                        ),
                        a: ({ href, children, ...props }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 group/link"
                            {...props}
                          >
                            {children}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ),
                        blockquote: ({ ...props }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-3 italic text-gray-700 bg-gray-50 rounded-r" {...props} />
                        ),
                        table: ({ ...props }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border-collapse border border-gray-300" {...props} />
                          </div>
                        ),
                        th: ({ ...props }) => (
                          <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold" {...props} />
                        ),
                        td: ({ ...props }) => (
                          <td className="border border-gray-300 px-4 py-2" {...props} />
                        ),
                        hr: ({ ...props }) => (
                          <hr className="my-4 border-gray-300" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="text-gray-500 italic p-2">
              Your AI Assistant is thinking<span className="inline-block animate-pulse">...</span>
            </div>
          )}
        </div>
      </div>

      {/* Stop Speaking Button */}
      {isSpeaking && (
        <div className="w-full max-w-4xl mx-auto px-4">
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors mb-2"
            onClick={stopSpeaking}
          >
            <StopCircle className="w-5 h-5" />
            Stop Speaking
          </button>
        </div>
      )}

      {/* Input & Controls */}
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-3">
        {/* Main Input Row */}
        <div className="flex items-end gap-2 bg-white border rounded-lg p-2 shadow-sm">
          <textarea
            ref={textareaRef}
            className="flex-grow p-2 outline-none resize-none overflow-y-auto"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type or record a message..."
            rows={1}
          />
          <button
            className={`p-3 rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={sendMessage}
            disabled={loading}
            title="Send message (Enter)"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2">
          <button
            className={`flex-1 p-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
              voiceEnabled
                ? "bg-green-50 border-2 border-green-500 text-green-600 font-medium"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title="Toggle auto-play voice responses"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-5 h-5" />
                <span className="hidden sm:inline">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5" />
                <span className="hidden sm:inline">Voice Off</span>
              </>
            )}
          </button>
          <button
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={copyChatToClipboard}
            title="Copy chat to clipboard"
          >
            <Copy className="w-5 h-5" />
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              setMessages([]);
              setThreadId(null);
              localStorage.removeItem("chatHistory");
              localStorage.removeItem("threadId");
              console.log("🗑️ Cleared chat history and localStorage");
            }}
            title="Clear chat history"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
