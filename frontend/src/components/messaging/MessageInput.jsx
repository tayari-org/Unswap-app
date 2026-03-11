import React, { useState, useRef } from 'react';
import { Send, Image, Loader2, Paperclip, X, Reply, Plus, FileText, Camera, Mic, User as UserIcon, PieChart, Calendar, Sticker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api/apiClient';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import EmojiPicker from './EmojiPicker';
import ImageAttachment from './ImageAttachment';
import MessageTemplates from './MessageTemplates';

export default function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
  replyingTo = null,
  onCancelReply = null,
  isVerified = true
}) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Emit typing indicator with debounce
    if (onTyping) {
      onTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  // Cleanup typing indicator on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onTyping) {
        onTyping(false);
      }
    };
  }, [onTyping]);

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleTemplateSelect = (template) => {
    setMessage(template);
  };

  const handleFileUpload = async (e, type = 'image') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setShowAttachMenu(false);

    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        const fileType = file.type.startsWith('image/') ? 'image' :
          file.type.startsWith('video/') ? 'video' : 'document';
        return {
          url: file_url,
          type: fileType,
          name: file.name,
          size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (documentInputRef.current) documentInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    if (!isVerified) {
      toast.error('Only verified users can send messages');
      return;
    }

    onSend(message, attachments);
    setMessage('');
    setAttachments([]);

    if (onTyping) {
      onTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-8 border-t border-slate-100 bg-white">
      {/* Reply Preview - Architectural Adjustment */}
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-slate-50 border-l-4 border-unswap-blue-deep/30 flex items-start justify-between shadow-sm"
        >
          <div className="flex-1">
            <p className="text-[10px] font-bold text-unswap-blue-deep uppercase tracking-widest flex items-center gap-2">
              <Reply className="w-3 h-3" />
              REFERENCING: {replyingTo.sender_name}
            </p>
            <p className="text-sm font-light text-slate-500 mt-2 line-clamp-2 italic leading-relaxed">"{replyingTo.content}"</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 hover:bg-slate-200 rounded-none"
            onClick={onCancelReply}
          >
            <X className="w-4 h-4 text-slate-400" />
          </Button>
        </motion.div>
      )}

      {/* Attachment Previews - Architectural Grid */}
      {attachments.length > 0 && (
        <div className="flex gap-4 mb-6 flex-wrap">
          {attachments.map((attachment, index) => (
            attachment.type === 'image' ? (
              <div key={index} className="relative group">
                <ImageAttachment
                  src={attachment.url}
                  isPreview
                  onRemove={() => removeAttachment(index)}
                />
                <div className="absolute inset-0 border border-unswap-blue-deep/10 pointer-events-none group-hover:border-unswap-blue-deep transition-colors" />
              </div>
            ) : (
              <div key={index} className="relative p-4 bg-slate-50 rounded-none border border-slate-100 flex items-center gap-3 min-w-[200px] border-l-2 border-l-unswap-blue-deep/20 transition-all hover:border-l-unswap-blue-deep">
                <FileText className="w-4 h-4 text-unswap-blue-deep/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest truncate">{attachment.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatFileSize(attachment.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 hover:bg-slate-200 rounded-none"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </div>
            )
          ))}
        </div>
      )}

      <div className="flex items-end gap-0 bg-slate-50/50 border border-slate-100 transition-all duration-700 focus-within:border-unswap-blue-deep/20 focus-within:bg-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
        {/* Hidden file inputs */}
        <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" multiple className="hidden" />
        <input type="file" ref={documentInputRef} onChange={(e) => handleFileUpload(e, 'document')} accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" multiple className="hidden" />
        <input type="file" ref={videoInputRef} onChange={(e) => handleFileUpload(e, 'video')} accept="video/*" multiple className="hidden" />

        {/* Attach Menu - Institutional Styling */}
        <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={uploading}
              className="text-slate-300 hover:text-unswap-blue-deep flex-shrink-0 rounded-none h-14 w-14 hover:bg-slate-50 transition-all duration-500"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin opacity-40" />
              ) : (
                <Plus className="w-5 h-5 transition-transform duration-700 group-hover:rotate-90 opacity-40 group-hover:opacity-100" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-72 p-1 rounded-none border-slate-200 shadow-2xl">
            <div className="grid gap-0.5">
              <Button
                variant="ghost"
                className="justify-start gap-4 h-14 rounded-none px-6 hover:bg-slate-50"
                onClick={() => documentInputRef.current?.click()}
              >
                <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center border border-slate-100">
                  <FileText className="w-4 h-4 text-unswap-blue-deep/60" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Document</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset verification docs</p>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-4 h-14 rounded-none px-6 hover:bg-slate-50"
                onClick={() => {
                  fileInputRef.current?.click();
                  videoInputRef.current?.click();
                }}
              >
                <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center border border-slate-100">
                  <Image className="w-4 h-4 text-unswap-blue-deep/60" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Media</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Property visuals & video</p>
                </div>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Emoji Picker - Styled */}
        <div className="self-center">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>

        {/* Message Input - Minimalist Field */}
        <Textarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-h-[44px] max-h-48 resize-none border-0 bg-transparent focus-visible:ring-0 text-sm font-light tracking-tight px-2 py-3 leading-relaxed placeholder:text-slate-300 placeholder:italic"
          disabled={disabled}
          rows={1}
        />

        {/* Send Button - High Contrast Square */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled || uploading || !isVerified}
          className="bg-unswap-blue-deep hover:bg-slate-900 text-white shadow-xl transition-all flex-shrink-0 h-11 w-11 rounded-none p-0 group"
          title={!isVerified ? "Only verified users can send messages" : "Secure Send"}
        >
          <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Button>
      </div>

      {!isVerified && (
        <p className="mt-3 text-[9px] font-bold text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <X className="w-3 h-3" />
          Verification required for outbound communications
        </p>
      )}
    </div>
  );
}