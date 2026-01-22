'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, ChatConversation, CurrentUserResponse } from '@/lib/api';

export default function AtendimentoIAPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<CurrentUserResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await apiClient.getCurrentUser();
        setUserData(user);

        const tenantId = user.user?.tenant_id;
        if (!tenantId) return;

        try {
          const conversationsResponse = await apiClient.getConversations(tenantId);
          setConversations(conversationsResponse.conversations || []);
          setIsConnected(true);
        } catch {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-slate-900">Atendimento IA</h2>
            <span className="text-xs font-bold text-ai-accent bg-purple-100 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Assistente Inteligente
            </span>
          </div>
          <p className="text-slate-600">
            Gerencie conversas do WhatsApp com auxílio da IA
          </p>
        </div>

        {/* Connection Status */}
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-4 ${
          isConnected 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className={`size-10 rounded-full flex items-center justify-center ${
            isConnected ? 'bg-emerald-100' : 'bg-yellow-100'
          }`}>
            <span className={`material-symbols-outlined ${
              isConnected ? 'text-emerald-600' : 'text-yellow-600'
            }`}>
              {isConnected ? 'check_circle' : 'warning'}
            </span>
          </div>
          <div className="flex-1">
            <p className={`font-medium ${isConnected ? 'text-emerald-800' : 'text-yellow-800'}`}>
              {isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </p>
            <p className={`text-sm ${isConnected ? 'text-emerald-600' : 'text-yellow-600'}`}>
              {isConnected 
                ? 'O assistente está pronto para atender seus pacientes'
                : 'Configure o WhatsApp nas configurações para começar'}
            </p>
          </div>
          {!isConnected && (
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              Configurar
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Conversas Recentes</h3>
                {conversations.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-slate-500 mt-4">Carregando conversas...</p>
                </div>
              ) : !isConnected ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-300">chat_bubble_outline</span>
                  <p className="text-slate-500 mt-2">Conecte o WhatsApp para ver as conversas</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-300">inbox</span>
                  <p className="text-slate-500 mt-2">Nenhuma conversa ainda</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-4"
                    >
                      <div className="bg-primary/10 rounded-full size-12 flex items-center justify-center text-primary font-bold">
                        {conversation.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {conversation.name || conversation.phone_number}
                          </p>
                          <span className="text-xs text-slate-400 shrink-0">
                            {formatLastMessageTime(conversation.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {conversation.last_message}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="size-6 bg-ai-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Stats */}
            <div className="bg-gradient-to-br from-ai-accent to-primary rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <p className="font-bold">Assistente Luna</p>
                  <p className="text-sm text-white/80">IA Conversacional</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-white/70">Mensagens hoje</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-white/70">Agendamentos</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-ai-accent">tips_and_updates</span>
                Funcionalidades
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px] mt-0.5">check_circle</span>
                  <span className="text-slate-600">Resposta automática a perguntas frequentes</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px] mt-0.5">check_circle</span>
                  <span className="text-slate-600">Agendamento automático de consultas</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px] mt-0.5">check_circle</span>
                  <span className="text-slate-600">Lembretes de consultas e retornos</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="material-symbols-outlined text-slate-300 text-[18px] mt-0.5">schedule</span>
                  <span>Sugestões clínicas durante atendimento (em breve)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
