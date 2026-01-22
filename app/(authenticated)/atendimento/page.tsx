'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient, ChatConversation, ChatMessage, CurrentUserResponse } from '@/lib/api';

export default function AtendimentoPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<CurrentUserResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial data
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

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !userData?.user?.tenant_id) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const messagesResponse = await apiClient.getMessages(
          userData.user!.tenant_id!,
          selectedConversation.phone_number,
          50,
          1
        );
        setMessages(messagesResponse.messages || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation, userData]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!userData?.user?.tenant_id || !isConnected) return;

    // Simple WebSocket connection for real-time message updates
    // Note: This assumes your backend supports WebSocket connections
    // Adjust the URL and protocol as needed for your backend
    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/chat';
        const ws = new WebSocket(`${wsUrl}?tenant_id=${userData.user!.tenant_id}`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle new message
            if (data.type === 'new_message' && data.message) {
              const newMsg = data.message as ChatMessage;
              
              // Update messages if this is the active conversation
              if (selectedConversation?.phone_number === newMsg.from || 
                  selectedConversation?.phone_number === data.phone_number) {
                setMessages(prev => [...prev, newMsg]);
              }

              // Update conversation list
              setConversations(prev => {
                const updated = prev.map(conv => {
                  if (conv.phone_number === (newMsg.from_me ? data.phone_number : newMsg.from)) {
                    return {
                      ...conv,
                      last_message: newMsg.text,
                      last_message_time: newMsg.timestamp,
                      unread_count: newMsg.from_me ? conv.unread_count : conv.unread_count + 1,
                    };
                  }
                  return conv;
                });
                // Sort by last message time
                return updated.sort((a, b) => 
                  new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
                );
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, reconnecting in 5s...');
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Error connecting WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userData, isConnected, selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userData?.user?.tenant_id) return;

    setSendingMessage(true);
    try {
      const response = await apiClient.sendMessage(userData.user.tenant_id, {
        phone_number: selectedConversation.phone_number,
        text: newMessage.trim(),
      });

      // Optimistically add message to UI
      const optimisticMessage: ChatMessage = {
        id: response.message_id,
        from: 'me',
        text: newMessage.trim(),
        timestamp: response.timestamp,
        from_me: true,
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id
            ? { ...conv, last_message: newMessage.trim(), last_message_time: response.timestamp }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phone_number.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-slate-500 mt-4">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="size-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-yellow-600 text-[32px]">warning</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">WhatsApp Desconectado</h2>
          <p className="text-slate-600 mb-6">
            Configure o WhatsApp nas configurações para começar a atender seus pacientes.
          </p>
          <a
            href="/onboarding"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Configurar WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Conversations List - Left Sidebar */}
      <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Conversas</h1>
            <button className="size-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined">add_comment</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4 text-center">
              <span className="material-symbols-outlined text-[64px] mb-2">chat_bubble_outline</span>
              <p className="text-sm">
                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    // Mark as read
                    if (conversation.unread_count > 0) {
                      setConversations(prev =>
                        prev.map(c => c.id === conversation.id ? { ...c, unread_count: 0 } : c)
                      );
                    }
                  }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    selectedConversation?.id === conversation.id ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {conversation.profile_picture_url ? (
                      <img
                        src={conversation.profile_picture_url}
                        alt={conversation.name}
                        className="size-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                        {conversation.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 size-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {conversation.name || conversation.phone_number}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatLastMessageTime(conversation.last_message_time)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {conversation.last_message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - Right Side */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversation.profile_picture_url ? (
                  <img
                    src={selectedConversation.profile_picture_url}
                    alt={selectedConversation.name}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {selectedConversation.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedConversation.name || selectedConversation.phone_number}
                  </p>
                  <p className="text-xs text-slate-500">{selectedConversation.phone_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="size-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button className="size-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="size-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#efeae2] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxwYXRoIGQ9Ik0wIDEwMGwxMDAtMTAwTTEwMCAxMDBsMC0xMDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')]">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="material-symbols-outlined text-[64px] mb-2">chat_bubble_outline</span>
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-2">
                  {messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatMessageDate(messages[index - 1].timestamp) !== formatMessageDate(message.timestamp);

                    return (
                      <div key={message.id || index}>
                        {/* Date Separator */}
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <div className="bg-white/90 shadow-sm rounded-lg px-3 py-1 text-xs text-slate-600 font-medium">
                              {formatMessageDate(message.timestamp)}
                            </div>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                              message.from_me
                                ? 'bg-[#d9fdd3] rounded-tr-none'
                                : 'bg-white rounded-tl-none'
                            }`}
                          >
                            <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] text-slate-500">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.from_me && (
                                <span className="material-symbols-outlined text-[12px] text-blue-500">
                                  done_all
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <button className="size-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-600 shrink-0">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite uma mensagem"
                    rows={1}
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary max-h-32"
                    style={{ minHeight: '44px' }}
                  />
                  <button className="absolute right-2 bottom-2 size-8 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-600">
                    <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="size-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {sendingMessage ? (
                    <div className="animate-spin border-2 border-white border-t-transparent rounded-full size-5"></div>
                  ) : (
                    <span className="material-symbols-outlined">send</span>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-[#efeae2] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxwYXRoIGQ9Ik0wIDEwMGwxMDAtMTAwTTEwMCAxMDBsMC0xMDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')]">
            <div className="bg-white/90 rounded-2xl p-12 shadow-lg text-center max-w-md">
              <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-[48px]">chat</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Atendimento via WhatsApp</h2>
              <p className="text-slate-600">
                Selecione uma conversa à esquerda para começar a atender seus pacientes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
