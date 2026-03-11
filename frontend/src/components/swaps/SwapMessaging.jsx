import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format } from 'date-fns';
import { User, X, Check, CheckCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyNewMessage } from '../notifications/notificationHelpers';
import MessageInput from '../messaging/MessageInput';
import TypingIndicator from '../messaging/TypingIndicator';
import ImageAttachment from '../messaging/ImageAttachment';

export default function SwapMessaging({ swapRequest, user, onClose }) {
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const conversationId = `swap_${swapRequest.id}`;

  const otherPartyEmail = swapRequest.host_email === user?.email ? swapRequest.requester_email : swapRequest.host_email;
  const otherPartyName = swapRequest.host_email === user?.email ? swapRequest.requester_name : (swapRequest.host_name || swapRequest.host_email);

  const { data: messages = [] } = useQuery({
    queryKey: ['swap-messages', conversationId],
    queryFn: () => api.entities.Message.filter({ conversation_id: conversationId }, 'created_date'),
  });

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = api.entities.Message.subscribe((event) => {
      if (['create', 'update'].includes(event.type) && event.data.conversation_id === conversationId) {
        queryClient.invalidateQueries(['swap-messages', conversationId]);
      }
    });
    return unsubscribe;
  }, [conversationId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachments = [] }) => {
      return api.entities.Message.create({
        conversation_id: conversationId,
        swap_request_id: swapRequest.id,
        sender_id: user?.id,
        sender_email: user?.email,
        sender_name: user?.full_name,
        recipient_id: swapRequest.host_email === user?.email ? swapRequest.requester_id : swapRequest.host_id,
        recipient_email: otherPartyEmail,
        content: content || '',
        attachments: attachments,
        message_type: attachments.length > 0 && !content.trim() ? 'image' : 'text',
        is_read: false
      }).then(async (msg) => {
        await notifyNewMessage({ recipientEmail: otherPartyEmail, senderName: user?.full_name, senderEmail: user?.email, conversationId });
        return msg;
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['swap-messages', conversationId]),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.entities.Message.update(id, { is_read: true, read_at: new Date().toISOString() }),
  });

  useEffect(() => {
    messages.filter(m => m.recipient_email === user?.email && !m.is_read)
      .forEach(m => {
        markAsReadMutation.mutate(m.id);
        queryClient.invalidateQueries(['user-notifications']);
      });
  }, [messages, user?.email]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const handleSend = (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return;
    sendMessageMutation.mutate({ content, attachments });
  };

  return (
    <div className="flex flex-col h-[80vh] bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="p-10 border-b bg-white flex items-center justify-between shadow-sm relative z-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-unswap-blue-deep/20" />
            <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[9px]">Secure Protocol</p>
          </div>
          <h3 className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            Coordinator <span className="italic font-serif text-unswap-blue-deep/60">Dialogue.</span>
          </h3>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right border-r pr-8 border-slate-100 hidden md:block">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1.5">Stay Interval</p>
            <p className="text-sm font-light tracking-tight text-slate-900">
              {swapRequest?.check_in && format(new Date(swapRequest.check_in), 'MMM d')} — {swapRequest?.check_out && format(new Date(swapRequest.check_out), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Badge className="rounded-none bg-unswap-blue-deep/5 text-unswap-blue-deep border-unswap-blue-deep/20 text-[9px] font-bold uppercase tracking-widest px-3 py-1">
              {swapRequest.status.replace('_', ' ')}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none text-slate-300 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {swapRequest.message && (
          <div className="flex flex-col items-center">
            <div className="max-w-[85%] bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Initial Request Message</span>
              <p className="text-sm text-slate-700 italic font-medium">"{swapRequest.message}"</p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.sender_email === user?.email;
            if (msg.message_type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200/40 py-1 px-3 rounded-full w-fit mx-auto">
                  {msg.content}
                </div>
              );
            }
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] space-y-1`}>
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm font-medium ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                    {msg.attachments?.map((url, i) => (
                      <div key={i} className="mb-2 rounded-lg overflow-hidden"><ImageAttachment src={url} /></div>
                    ))}
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-1 text-[10px] font-semibold ${isMe ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                    <span>{format(new Date(msg.created_date), 'HH:mm')}</span>
                    {isMe && (msg.is_read ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3" />)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <MessageInput onSend={handleSend} onTyping={setIsTyping} disabled={sendMessageMutation.isPending} />
        {isTyping && <div className="mt-2"><TypingIndicator name={otherPartyName} /></div>}
      </div>
    </div >
  );
}