import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, User, X, Pin, Smile } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MessageInput from '../components/messaging/MessageInput';
import TypingIndicator from '../components/messaging/TypingIndicator';
import ImageAttachment from '../components/messaging/ImageAttachment';
import UserProfileDialog from '../components/messaging/UserProfileDialog';
import MessageGroup from '../components/messaging/MessageGroup';
import DateSeparator from '../components/messaging/DateSeparator';

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReactions, setShowReactions] = useState(null);

  const [showUserProfile, setShowUserProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const isAuth = await api.auth.isAuthenticated();
      if (!isAuth) {
        api.auth.redirectToLogin(window.location.pathname);
        return null;
      }
      return api.auth.me();
    },
  });

  const { data: userVerification } = useQuery({
    queryKey: ['user-verification', user?.email],
    queryFn: () => api.entities.Verification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const isUserVerified = userVerification?.[0]?.status === 'approved';

  const { data: messages = [] } = useQuery({
    queryKey: ['all-messages', user?.email],
    queryFn: () => api.entities.Message.filter({
      $or: [{ sender_email: user?.email }, { recipient_email: user?.email }]
    }, '-created_date', 500),
    enabled: !!user?.email,
  });

  // Fetch all users to get usernames
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.entities.User.list(),
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch typing status for selected conversation
  const { data: typingStatuses = [] } = useQuery({
    queryKey: ['typing-status', user?.email, selectedConversation],
    queryFn: () => api.entities.TypingStatus.filter({
      recipient_email: user?.email,
      user_email: selectedConversation,
      is_typing: true
    }),
    enabled: !!user?.email && !!selectedConversation,
    refetchInterval: 1000, // Check every second
  });

  // Fetch pinned conversations
  const { data: pinnedConversations = [] } = useQuery({
    queryKey: ['pinned-conversations', user?.email],
    queryFn: () => api.entities.PinnedConversation.filter({
      user_email: user?.email
    }),
    enabled: !!user?.email,
  });

  // Fetch all reactions
  const { data: allReactions = [] } = useQuery({
    queryKey: ['message-reactions'],
    queryFn: () => api.entities.MessageReaction.list(),
  });

  // Real-time message subscriptions
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = api.entities.Message.subscribe((event) => {
      // Update messages in real-time when new messages arrive
      if (event.type === 'create') {
        const msg = event.data;
        if (msg.sender_email === user.email || msg.recipient_email === user.email) {
          queryClient.invalidateQueries(['all-messages']);
          
          // Show toast notification for incoming messages
          if (msg.recipient_email === user.email) {
            const hasAttachments = msg.attachments && msg.attachments.length > 0;
            const senderUser = allUsers.find(u => u.email === msg.sender_email);
            const senderName = senderUser?.username || senderUser?.full_name || msg.sender_name || msg.sender_email;
            
            toast.success(
              `New message from ${senderName}`,
              {
                description: hasAttachments && !msg.content 
                  ? '📷 Sent a photo' 
                  : msg.content?.substring(0, 60) + (msg.content?.length > 60 ? '...' : ''),
                duration: 5000,
              }
            );
          }
          
          // Auto-mark as read if conversation is open
          if (selectedConversation && msg.recipient_email === user.email && 
              msg.sender_email === selectedConversation && !msg.is_read) {
            markAsReadMutation.mutate(msg.id);
          }
        }
      } else if (event.type === 'update') {
        // Handle read receipts updates in real-time
        queryClient.invalidateQueries(['all-messages']);
      }
    });

    return unsubscribe;
  }, [user?.email, selectedConversation]);

  // Real-time typing status subscriptions
  useEffect(() => {
    if (!user?.email || !selectedConversation) return;

    const unsubscribe = api.entities.TypingStatus.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        const status = event.data;
        if (status.recipient_email === user.email && status.user_email === selectedConversation) {
          queryClient.invalidateQueries(['typing-status']);
        }
      }
    });

    return unsubscribe;
  }, [user?.email, selectedConversation]);

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    messages.forEach(msg => {
      const otherEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
      
      if (!convMap.has(otherEmail)) {
        // Find the user in allUsers to get their username
        const otherUser = allUsers.find(u => u.email === otherEmail);
        const otherName = otherUser?.username || otherUser?.full_name || otherEmail.split('@')[0];
        
        convMap.set(otherEmail, {
          email: otherEmail,
          name: otherName,
          messages: [],
          lastMessage: msg,
          unreadCount: 0,
          isPinned: pinnedConversations.some(p => p.conversation_with === otherEmail),
        });
      }
      
      const conv = convMap.get(otherEmail);
      conv.messages.push(msg);
      
      if (msg.recipient_email === user?.email && !msg.is_read) {
        conv.unreadCount++;
      }
    });

    const allConvs = Array.from(convMap.values());
    
    // Sort: pinned first, then by last message date
    return allConvs.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date);
    });
  }, [messages, user?.email, allUsers, pinnedConversations]);

  const selectedMessages = React.useMemo(() => {
    if (!selectedConversation) return [];
    const conv = conversations.find(c => c.email === selectedConversation);
    const allMessages = conv?.messages || [];
    
    // Filter out deleted messages for current user
    let visibleMessages = allMessages.filter(msg => {
      if (msg.sender_email === user?.email && msg.deleted_by_sender) return false;
      if (msg.recipient_email === user?.email && msg.deleted_by_recipient) return false;
      return true;
    });
    
    // Apply search filter if active
    if (messageSearchQuery.trim()) {
      const query = messageSearchQuery.toLowerCase();
      visibleMessages = visibleMessages.filter(msg => {
        // Search in message content
        const contentMatch = msg.content?.toLowerCase().includes(query);
        
        // Search in attachment names
        const attachmentMatch = msg.attachments?.some(att => 
          att.name?.toLowerCase().includes(query)
        );
        
        // Search in date
        const dateMatch = format(new Date(msg.created_date), 'MMM d, yyyy').toLowerCase().includes(query);
        
        return contentMatch || attachmentMatch || dateMatch;
      });
    }
    
    // Only show top-level messages (not in a thread)
    return visibleMessages
      .filter(msg => !msg.parent_message_id)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [conversations, selectedConversation, user?.email, messageSearchQuery]);

  // Group messages by date and sender
  const messageGroups = React.useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentSender = null;
    let currentGroup = [];

    selectedMessages.forEach((msg) => {
      const msgDate = format(new Date(msg.created_date), 'yyyy-MM-dd');
      const msgSender = msg.sender_email;

      // New date - add date separator
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ type: 'messages', messages: currentGroup, sender: currentSender });
          currentGroup = [];
        }
        groups.push({ type: 'date', date: msg.created_date });
        currentDate = msgDate;
        currentSender = null;
      }

      // Same sender - add to current group
      if (msgSender === currentSender) {
        currentGroup.push(msg);
      } else {
        // Different sender - start new group
        if (currentGroup.length > 0) {
          groups.push({ type: 'messages', messages: currentGroup, sender: currentSender });
        }
        currentGroup = [msg];
        currentSender = msgSender;
      }
    });

    // Add last group
    if (currentGroup.length > 0) {
      groups.push({ type: 'messages', messages: currentGroup, sender: currentSender });
    }

    return groups;
  }, [selectedMessages]);



  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const msg = await api.entities.Message.create(data);
      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-messages']);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => api.entities.Message.update(messageId, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries(['all-messages']),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, userEmail }) => {
      const message = await api.entities.Message.list();
      const msg = message.find(m => m.id === messageId);
      
      if (msg.sender_email === userEmail) {
        await api.entities.Message.update(messageId, { 
          deleted_by_sender: true,
          deleted_at: new Date().toISOString()
        });
      } else {
        await api.entities.Message.update(messageId, { 
          deleted_by_recipient: true,
          deleted_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-messages']);
      toast.success('Message deleted');
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, reaction }) => {
      // Check if user already reacted with this emoji
      const existing = allReactions.find(
        r => r.message_id === messageId && r.user_email === user?.email && r.reaction === reaction
      );

      if (existing) {
        // Remove reaction
        await api.entities.MessageReaction.delete(existing.id);
      } else {
        // Add reaction
        await api.entities.MessageReaction.create({
          message_id: messageId,
          user_email: user?.email,
          user_name: user?.username || user?.full_name,
          reaction
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['message-reactions']);
    },
  });

  const pinConversationMutation = useMutation({
    mutationFn: async (conversationEmail) => {
      const existing = pinnedConversations.find(
        p => p.conversation_with === conversationEmail
      );

      if (existing) {
        // Unpin
        await api.entities.PinnedConversation.delete(existing.id);
        toast.success('Conversation unpinned');
      } else {
        // Pin
        await api.entities.PinnedConversation.create({
          user_email: user?.email,
          conversation_with: conversationEmail,
          pinned_at: new Date().toISOString()
        });
        toast.success('Conversation pinned');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pinned-conversations']);
    },
  });

  const handleTyping = async (isTyping) => {
    if (!selectedConversation || !user?.email) return;
    
    try {
      // Find existing typing status
      const existingStatuses = await api.entities.TypingStatus.filter({
        user_email: user.email,
        recipient_email: selectedConversation
      });

      if (isTyping) {
        if (existingStatuses.length > 0) {
          // Update existing status
          await api.entities.TypingStatus.update(existingStatuses[0].id, {
            is_typing: true,
            last_updated: new Date().toISOString()
          });
        } else {
          // Create new status
          await api.entities.TypingStatus.create({
            user_email: user.email,
            recipient_email: selectedConversation,
            is_typing: true,
            last_updated: new Date().toISOString()
          });
        }

        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-clear after 2 seconds
        typingTimeoutRef.current = setTimeout(async () => {
          if (existingStatuses.length > 0) {
            await api.entities.TypingStatus.update(existingStatuses[0].id, {
              is_typing: false
            });
          }
        }, 2000);
      } else {
        // Stop typing
        if (existingStatuses.length > 0) {
          await api.entities.TypingStatus.update(existingStatuses[0].id, {
            is_typing: false
          });
        }
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = selectedMessages.filter(
        m => m.recipient_email === user?.email && !m.is_read
      );
      unreadMessages.forEach(m => markAsReadMutation.mutate(m.id));
    }
  }, [selectedConversation, selectedMessages]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  const handleSendMessage = (content, attachments = []) => {
    if ((!content.trim() && attachments.length === 0) || !selectedConversation) return;

    const hasDocuments = attachments.some(a => a.type === 'document');
    const hasImages = attachments.some(a => a.type === 'image');
    
    let messageType = 'text';
    if (hasDocuments && !content.trim()) messageType = 'document';
    else if (hasImages && !content.trim()) messageType = 'image';

    sendMessageMutation.mutate({
      sender_id: user?.id,
      sender_email: user?.email,
      sender_name: user?.full_name,
      recipient_email: selectedConversation,
      content: content || '',
      attachments: attachments,
      is_read: false,
      message_type: messageType,
      parent_message_id: replyingTo?.id || null,
    });

    // Update thread count if replying
    if (replyingTo?.id) {
      const parentId = replyingTo.parent_message_id || replyingTo.id;
      api.entities.Message.list().then(msgs => {
        const parent = msgs.find(m => m.id === parentId);
        if (parent) {
          api.entities.Message.update(parentId, {
            thread_count: (parent.thread_count || 0) + 1
          });
        }
      });
    }

    setReplyingTo(null);
  };

  const handleDeleteMessage = (messageId) => {
    deleteMessageMutation.mutate({ messageId, userEmail: user?.email });
  };

  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase();
    // Search in contact name, email, and message content
    const nameMatch = conv.name.toLowerCase().includes(query);
    const emailMatch = conv.email.toLowerCase().includes(query);
    const messageMatch = conv.messages.some(msg => 
      msg.content?.toLowerCase().includes(query)
    );
    return nameMatch || emailMatch || messageMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Messages</h1>

        <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col shadow-lg border-0">
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-amber-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 bg-white">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start messaging colleagues</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.email}
                    onClick={() => setSelectedConversation(conv.email)}
                    whileHover={{ scale: 0.99 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 flex items-center gap-3 border-b border-slate-50 hover:bg-slate-50/80 transition-all text-left relative group ${
                      selectedConversation === conv.email ? 'bg-gradient-to-r from-amber-50 to-amber-50/50 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    {/* Pin Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pinConversationMutation.mutate(conv.email);
                      }}
                      className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        conv.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Pin className={`w-3 h-3 ${conv.isPinned ? 'fill-current' : ''}`} />
                    </button>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                      selectedConversation === conv.email ? 'bg-amber-100 ring-2 ring-amber-200' : 'bg-slate-100'
                    }`}>
                      <User className={`w-5 h-5 ${selectedConversation === conv.email ? 'text-amber-700' : 'text-slate-500'}`} />
                      {conv.unreadCount > 0 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-md">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-semibold truncate ${
                          conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'
                        }`}>{conv.name}</p>
                        <span className={`text-xs ${
                          conv.unreadCount > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'
                        }`}>
                          {format(new Date(conv.lastMessage.created_date), 'MMM d')}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'
                      }`}>
                        {conv.lastMessage.content || '📎 Attachment'}
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden shadow-lg border-0">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center ring-2 ring-amber-100 flex-shrink-0">
                        <User className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {conversations.find(c => c.email === selectedConversation)?.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUserProfile(true)}
                      className="flex-shrink-0"
                    >
                      <User className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">View Profile</span>
                    </Button>
                  </div>
                  
                  {/* Message Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search messages, dates, attachments..."
                      className="pl-9 pr-9 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-amber-500"
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                    />
                    {messageSearchQuery && (
                      <button
                        onClick={() => setMessageSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-slate-50">
                  <AnimatePresence>
                    {messageGroups.map((group, index) => {
                      if (group.type === 'date') {
                        return <DateSeparator key={`date-${index}`} date={group.date} />;
                      }

                      const isMe = group.sender === user?.email;
                      return (
                        <MessageGroup
                          key={`group-${index}`}
                          messages={group.messages}
                          isMe={isMe}
                          user={user}
                          onReply={setReplyingTo}
                          onDelete={handleDeleteMessage}
                          reactions={allReactions}
                          onReact={(messageId, reaction) => addReactionMutation.mutate({ messageId, reaction })}
                        />
                      );
                    })}
                  </AnimatePresence>
                  
                  {/* Typing Indicator */}
                  {(() => {
                    const typingUser = typingStatuses.find(
                      ts => ts.user_email === selectedConversation && 
                            ts.recipient_email === user?.email &&
                            ts.is_typing
                    );
                    return typingUser && (
                      <TypingIndicator 
                        name={conversations.find(c => c.email === selectedConversation)?.name || 'Someone'} 
                      />
                    );
                  })()}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input with Emoji & Attachments */}
                <MessageInput 
                  onSend={handleSendMessage}
                  onTyping={handleTyping}
                  disabled={sendMessageMutation.isPending}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  isVerified={isUserVerified}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-amber-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700 mb-1">Your Messages</p>
                  <p className="text-sm text-slate-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* User Profile Dialog */}
      <UserProfileDialog 
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        userEmail={selectedConversation}
      />
    </div>
  );
}