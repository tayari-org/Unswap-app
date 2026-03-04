import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck, MoreVertical, Reply, Trash2, FileText, Download, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ImageAttachment from './ImageAttachment';

export default function MessageGroup({ messages, isMe, user, onReply, onDelete, reactions = [], onReact }) {
  if (messages.length === 0) return null;
  
  const [showReactionPicker, setShowReactionPicker] = React.useState(null);
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar - only show for received messages */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0 text-amber-700 font-semibold text-xs mt-auto">
          {messages[0].sender_name?.charAt(0) || '?'}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[70%]`}>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group"
          >
            <div className="relative">
              <div
                className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${
                  isMe
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-br-md'
                    : 'bg-white text-slate-900 rounded-bl-md border border-slate-100'
                } ${index === 0 ? (isMe ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''}`}
              >
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((attachment, i) =>
                      attachment.type === 'image' ? (
                        <ImageAttachment key={i} src={attachment.url} />
                      ) : (
                        <a
                          key={i}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            isMe ? 'bg-amber-600/50' : 'bg-slate-50'
                          } hover:opacity-80 transition-opacity`}
                        >
                          <FileText className="w-4 h-4" />
                          <div className="text-xs">
                            <p className="font-medium truncate max-w-[200px]">{attachment.name}</p>
                            <p className={isMe ? 'text-white/70' : 'text-slate-500'}>
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Download className="w-3 h-3 ml-2" />
                        </a>
                      )
                    )}
                  </div>
                )}
                {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
              </div>

              {/* Reactions */}
              {reactions.filter(r => r.message_id === msg.id).length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(
                    reactions
                      .filter(r => r.message_id === msg.id)
                      .reduce((acc, r) => {
                        acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                        return acc;
                      }, {})
                  ).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => onReact(msg.id, emoji)}
                      className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                        reactions.find(r => r.message_id === msg.id && r.reaction === emoji && r.user_email === user?.email)
                          ? 'bg-amber-100 border border-amber-300'
                          : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="font-medium">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Message Actions */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isMe ? '-left-10' : '-right-10'
                } opacity-0 group-hover:opacity-100 transition-all duration-200`}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white hover:bg-slate-50 shadow-lg rounded-full border border-slate-200"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isMe ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={() => setShowReactionPicker(msg.id)}>
                      <Smile className="w-4 h-4 mr-2" />
                      React
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReply(msg)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(msg.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Reaction Picker */}
              {showReactionPicker === msg.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute ${isMe ? 'left-0' : 'right-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex gap-1 z-10`}
                >
                  {reactionEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(msg.id, emoji);
                        setShowReactionPicker(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Timestamp and Read Receipt - only on last message */}
        <div
          className={`flex items-center gap-1.5 text-xs px-1 ${
            isMe ? 'justify-end text-slate-400' : 'justify-start text-slate-500'
          }`}
        >
          <span className="font-medium">{format(new Date(messages[messages.length - 1].created_date), 'h:mm a')}</span>
          {isMe && (
            <span className="flex items-center">
              {messages[messages.length - 1].is_read ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}