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

function MessageTick({ isRead }) {
  if (isRead) {
    // Double blue tick = read
    return <CheckCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  }
  // Single grey tick = sent (not yet read)
  return <Check className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />;
}

export default function MessageGroup({ messages, isMe, user, onReply, onDelete, reactions = [], onReact }) {
  if (messages.length === 0) return null;

  const [showReactionPicker, setShowReactionPicker] = React.useState(null);
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-3`}>
      {/* Avatar - only show for received messages */}
      {!isMe && (
        <div className="w-8 h-8 rounded-none bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 border border-slate-100 font-extralight text-sm mt-auto shadow-sm">
          {messages[0].sender_name?.charAt(0) || '?'}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[80%]`}>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative"
          >
            <div className="relative">
              <div
                className={`px-3 md:px-4 py-2 md:py-2.5 rounded-none shadow-sm relative transition-all duration-500 ${isMe
                  ? 'bg-unswap-blue-deep text-white border-l-[6px] border-white/10 hover:shadow-2xl'
                  : 'bg-white text-slate-900 border border-slate-100 hover:shadow-2xl'
                  }`}
              >
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {msg.attachments.map((attachment, i) =>
                      attachment.type === 'image' ? (
                        <div key={i} className="rounded-none overflow-hidden border border-slate-100/10">
                          <ImageAttachment src={attachment.url} />
                        </div>
                      ) : (
                        <a
                          key={i}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 p-3 rounded-none ${isMe ? 'bg-white/10' : 'bg-slate-50'
                            } hover:opacity-80 transition-all border border-transparent hover:border-white/20`}
                        >
                          <FileText className="w-4 h-4" />
                          <div className="text-[10px] font-bold uppercase tracking-widest">
                            <p className="truncate max-w-[150px]">{attachment.name}</p>
                            <p className={isMe ? 'text-white/60' : 'text-slate-400'}>
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Download className="w-3 h-3 ml-2" />
                        </a>
                      )
                    )}
                  </div>
                )}

                {/* Content + inline timestamp + tick */}
                <div className="flex items-end gap-2">
                  {msg.content && (
                    <p className="text-sm font-light leading-relaxed tracking-tight whitespace-pre-wrap break-words flex-1">
                      {msg.content}
                    </p>
                  )}
                  {/* Timestamp + tick — always shown inline, bottom-right of bubble */}
                  <div className={`flex items-center gap-1 flex-shrink-0 ml-auto pl-2 ${isMe ? 'text-white/40' : 'text-slate-300'}`}>
                    <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </span>
                    {isMe && <MessageTick isRead={msg.is_read} />}
                  </div>
                </div>
              </div>

              {/* Reactions - Architectural Pill */}
              {reactions.filter(r => r.message_id === msg.id).length > 0 && (
                <div className={`flex flex-wrap gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                      className={`px-2.5 py-1 rounded-none text-[10px] font-bold flex items-center gap-2 transition-all border shadow-sm ${reactions.find(r => r.message_id === msg.id && r.reaction === emoji && r.user_email === user?.email)
                        ? 'bg-unswap-blue-deep text-white border-unswap-blue-deep'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <span>{emoji}</span>
                      <span className="tracking-tighter">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Message Actions - Minimalist */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-12' : '-right-12'
                  } opacity-0 group-hover:opacity-100 transition-all duration-300 z-10`}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 bg-white border border-slate-200 rounded-none shadow-xl hover:bg-slate-50"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isMe ? 'start' : 'end'} className="rounded-none border-slate-200 p-1">
                    <DropdownMenuItem onClick={() => setShowReactionPicker(msg.id)} className="rounded-none py-2 text-[10px] font-bold uppercase tracking-widest">
                      <Smile className="w-4 h-4 mr-3 text-slate-400" />
                      React
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReply(msg)} className="rounded-none py-2 text-[10px] font-bold uppercase tracking-widest">
                      <Reply className="w-4 h-4 mr-3 text-slate-400" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(msg.id)} className="rounded-none py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 focus:text-red-600 focus:bg-rose-50">
                      <Trash2 className="w-4 h-4 mr-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Reaction Picker - Architectural Overlay */}
              {showReactionPicker === msg.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute ${isMe ? 'left-0' : 'right-0'} top-full mt-2 bg-white rounded-none shadow-2xl border border-slate-200 p-2 flex gap-1 z-20`}
                >
                  {reactionEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(msg.id, emoji);
                        setShowReactionPicker(null);
                      }}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-none transition-all text-xl grayscale hover:grayscale-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
