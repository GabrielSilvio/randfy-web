'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatConversation } from '@/lib/api';

interface ChatSidebarProps {
  isConnected: boolean;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  isMiniMode?: boolean;
  onToggleMode?: () => void;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Hoje, ${formatTime(timestamp)}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem, ${formatTime(timestamp)}`;
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}

export function ChatSidebar({
  isConnected,
  messages,
  onSendMessage,
  isLoading = false,
  isMiniMode = false,
  onToggleMode,
}: ChatSidebarProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mini mode - collapsed sidebar with just a button
  if (isMiniMode) {
    return (
      <button
        onClick={onToggleMode}
        className="fixed bottom-6 right-6 z-50 bg-ai-accent text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[24px]">smart_toy</span>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {messages.filter(m => !m.from_me).length}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.03)] z-10 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-white to-purple-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-ai-accent text-white p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assistente Randfy</h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full size-2 ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}></span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {isConnected ? 'Conectado ao WhatsApp' : 'Desconectado'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="text-slate-400 hover:text-ai-accent transition-colors"
              title="Minimizar"
            >
              <span className="material-symbols-outlined">close_fullscreen</span>
            </button>
          )}
          <button className="text-slate-400 hover:text-ai-accent transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <span className="material-symbols-outlined text-[48px] mb-2">chat_bubble_outline</span>
            <p>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <>
            {/* Date separator */}
            {messages.length > 0 && (
              <div className="flex justify-center">
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {formatDate(messages[0].timestamp)}
                </span>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex flex-col gap-1 ${message.from_me ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[90%] ${message.from_me ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      message.from_me
                        ? 'bg-primary/10 text-slate-800 rounded-tr-none border border-primary/20'
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-200 shadow-sm'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
                <span className={`text-[10px] text-slate-400 ${message.from_me ? 'mr-2' : 'ml-2'}`}>
                  {message.from_me ? 'Enviado por você' : message.push_name || 'Paciente'}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-pulse flex items-center gap-2 text-slate-400 text-sm">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Carregando...
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestion Card - Static Example */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-slate-100">
          <div className="ai-gradient-border p-3 shadow-lg shadow-purple-100/50 rounded-xl relative bg-white">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-ai-accent shrink-0">lightbulb</span>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-ai-accent uppercase mb-1">Sugestão Clínica</h4>
                <p className="text-sm text-slate-700 mb-2">
                  Baseado na conversa, considere verificar os sinais vitais do paciente.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    disabled
                    className="flex-1 bg-slate-100 text-slate-400 text-xs font-semibold py-1.5 px-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_circle</span>
                    Add à HMA
                    <span className="text-[8px] font-bold text-slate-300 bg-slate-50 px-1 py-0.5 rounded ml-1">
                      EM BREVE
                    </span>
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 p-1.5 rounded-lg cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-3 text-sm focus:ring-1 focus:ring-ai-accent focus:border-ai-accent resize-none"
            placeholder="Digite uma resposta ou comando para a IA..."
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-ai-accent text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px] block">send</span>
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            disabled
            className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 cursor-not-allowed"
          >
            Solicitar Exame
          </button>
          <button
            disabled
            className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 cursor-not-allowed"
          >
            Agendar Retorno
          </button>
        </div>
      </div>
    </aside>
  );
}
