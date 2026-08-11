import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import Logo from './Logo';
import { Send, Bot, X, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm DistribuCore Assistant. I can check stock levels, fetch customer info, and provide sales summaries. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [threadId] = useState(() => {
    let tid = sessionStorage.getItem('chat_thread_id');
    if (!tid) {
      tid = 'thread_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('chat_thread_id', tid);
    }
    return tid;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setInput(prev => (prev ? prev + ' ' : '') + finalTranscript);
      } else if (interimTranscript) {
        // We only show interim in a real robust setup, but for simplicity we can set input to it
        // Or just wait for final. Let's just set the input to the latest result to give live feedback.
        const currentText = Array.from(event.results)
          .map(res => res[0].transcript)
          .join('');
        setInput(currentText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message to UI
    const newUserMsg = { id: Date.now(), text: userText, isBot: false };
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: userText, thread_id: threadId });
      
      const botReply = { id: Date.now() + 1, text: res.data.reply, isBot: true };
      setMessages(prev => [...prev, botReply]);
    } catch (error) {
      console.error('Chat error:', error);
      const errReply = { id: Date.now() + 1, text: "Sorry, I encountered an error connecting to the AI or Database.", isBot: true };
      setMessages(prev => [...prev, errReply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed bottom-24 right-4 md:right-8 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-fade-in font-sans"
    >
      
      {/* Header */}
      <div className="bg-[#f9fafb] text-[#111827] p-4 flex justify-between items-center shadow-sm border-b border-[#e5e7eb] relative z-10">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#e34234] via-rose-500 to-orange-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
             <Bot size={22} />
          </div>
          <div className="flex flex-col">
             <Logo size="sm" to={null} />
             <span className="text-[10px] text-[#6b7280] font-bold tracking-wider uppercase mt-0.5">Enterprise AI Assistant</span>
          </div>
        </div>
        <button onClick={onClose} className="relative z-10 text-[#9ca3af] hover:text-[#4b5563] transition-all p-2 rounded-full hover:bg-[#f3f4f6]">
          <X size={20} />
        </button>
      </div>
      
      {/* Messages Window */}
      <div className="flex-1 p-5 overflow-y-auto bg-white flex flex-col gap-6 text-[14px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`max-w-[88%] flex flex-col ${msg.isBot ? 'self-start' : 'self-end'}`}>
            <div className={`p-4 rounded-[16px] shadow-sm text-[13px] ${
              msg.isBot 
                ? 'bg-[#f9fafb] border border-[#e5e7eb] text-[#374151] rounded-tl-sm' 
                : 'bg-gradient-to-br from-[#1B512D] to-[#2a7a44] border border-[#1B512D] text-white rounded-tr-sm shadow-md'
            }`}>
              {msg.isBot ? (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-[#111827] prose-a:text-[#1B512D]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              )}
            </div>
            <span className={`text-[10px] uppercase text-[#9ca3af] mt-1.5 mx-1 font-medium tracking-wider ${msg.isBot ? 'text-left' : 'text-right'}`}>
              {msg.isBot ? 'DistribuCore' : 'You'}
            </span>
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%] self-start flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#e34234] via-rose-500 to-orange-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
               <Bot size={16} />
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] shadow-sm rounded-[16px] rounded-tl-sm p-3.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-[#f9fafb] border-t border-[#e5e7eb] flex gap-3 items-end relative z-10">
        <div className="flex-1 bg-white rounded-[20px] border border-[#d1d5db] overflow-hidden focus-within:ring-2 focus-within:ring-[#bbf7d0] focus-within:border-[#22c55e] transition-all flex items-center pr-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask AI about stock, sales..."}
            className={`w-full bg-transparent px-4 py-3 text-[13px] text-[#111827] placeholder-[#9ca3af] focus:outline-none ${isListening ? 'animate-pulse text-[#1B512D]' : ''}`}
            disabled={loading}
          />
          <button 
            type="button" 
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'text-[#9ca3af] hover:text-[#4b5563] hover:bg-gray-100'}`}
            title={isListening ? "Stop Listening" : "Voice Typing"}
          >
            {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
          </button>
        </div>
        <button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="bg-gradient-to-br from-[#1B512D] to-[#2a7a44] text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[46px] w-[46px] shadow-sm"
        >
          <Send size={18} className="-ml-0.5" strokeWidth={2} />
        </button>
      </form>

    </div>
  );
};

export default Chatbot;
