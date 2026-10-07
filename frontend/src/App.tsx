import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! Welcome to Customer Service support. How can I help you today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.SyntheticEvent) => {
    const controller = new AbortController();
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');

    // 1. Add User Message to UI
    const userMessage = { id: Date.now(), text: userMessageText, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Connect to Spring Backend
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessageText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Fixed: Generate a steady ID for the upcoming AI response block
      const aiMessageId = Date.now() + 1;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Split chunks by newline
        const lines = chunk.split("\n");

        for (let line of lines) {
          if (!line.trim()) continue;

          // Clean Spring's standard SSE prefix if present
          if (line.startsWith("data:")) {
            line = line.replace("data:", "");
          }

          const cleanToken = line.trim();
          if (!cleanToken) continue;

          // Purely functional approach resolves async closure limitations
          setMessages((prev) => {
            const hasBubble = prev.some(msg => msg.id === aiMessageId);
            scrollToBottom();

            if (!hasBubble) {
              // Create the initial bubble frame
              return [...prev, { id: aiMessageId, text: cleanToken, isUser: false }];
            } else {
              // Safely look up and append characters directly onto the existing text frame
              return prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: msg.text + " " + cleanToken } : msg
              );
            }
          });
        }
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, text: "⚠️ Error: Unable to connect to the customer service assistant.", isUser: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white text-blue-600 font-black rounded-full h-10 w-10 flex items-center justify-center text-xl shadow">
            CS
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Customer Service</h1>
            <p className="text-xs text-blue-100 flex items-center">
              <span className="h-2 w-2 bg-green-400 rounded-full inline-block mr-1.5 animate-pulse"></span>
              AI Assistant Online
            </p>
          </div>
        </div>
      </header>

      {/* Chat Messages Space */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.isUser
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {msg.text}
              </p>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && !messages.some(m => m.id === messages[messages.length - 1]?.id && !m.isUser && m.id !== 1) && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Form */}
      <footer className="bg-white border-t border-slate-200 p-4 shadow-inner">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-slate-100 border-0 rounded-full py-3 px-6 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white rounded-full p-3 font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow transition-colors"
          >
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
