'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessage } from '@/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Halo! Saya Copilot AI Anda. Ada yang bisa saya bantu terkait warung atau manajemen stok hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('warungcopilot_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('warungcopilot_chat_history', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, data]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto" style={{ height: 'calc(100vh - 7rem)' }}>
      <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md pb-3 shrink-0">
        <span className="material-symbols-outlined text-xl">smart_toy</span>
        <h1 className="font-headline-sm font-bold text-on-surface">Copilot AI Chat</h1>
      </div>

      <div className="flex-1 bg-surface-container-lowest rounded-t-xl shadow-sm p-4 overflow-y-auto border border-outline-variant/30 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl p-3 ${
              msg.role === 'user' 
                ? 'bg-primary text-on-primary rounded-tr-none' 
                : 'bg-surface-container text-on-surface rounded-tl-none'
            }`}>
              <p className="font-body-md whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-container text-on-surface-variant rounded-xl rounded-tl-none p-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="bg-surface-container-low p-4 rounded-b-xl border border-t-0 border-outline-variant/30 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya Copilot tentang stok, laba, atau ketik transaksi..."
          className="flex-1 h-12 px-4 rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="h-12 px-6 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          <span>Kirim</span>
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </form>
    </div>
  );
}
