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
    <div className="p-4 border-t border-slate-100 bg-white shadow-lg">
      {/* Reply Preview */}
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 border-l-4 border-blue-500 rounded-lg flex items-start justify-between shadow-sm"
        >
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
              <Reply className="w-3 h-3" />
              Replying to {replyingTo.sender_name}
            </p>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{replyingTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0 hover:bg-blue-100"
            onClick={onCancelReply}
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {attachments.map((attachment, index) => (
            attachment.type === 'image' ? (
              <ImageAttachment 
                key={index} 
                src={attachment.url} 
                isPreview 
                onRemove={() => removeAttachment(index)} 
              />
            ) : (
              <div key={index} className="relative p-3 bg-slate-100 rounded-lg flex items-center gap-2 max-w-xs">
                <Paperclip className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{attachment.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e, 'image')}
          accept="image/*"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={documentInputRef}
          onChange={(e) => handleFileUpload(e, 'document')}
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={(e) => handleFileUpload(e, 'video')}
          accept="video/*"
          multiple
          className="hidden"
        />

        {/* Attach Menu */}
        <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              disabled={uploading}
              className="text-slate-500 hover:text-slate-700 flex-shrink-0"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 p-2">
            <div className="grid gap-1">
              <Button
                variant="ghost"
                className="justify-start gap-3 h-11"
                onClick={() => documentInputRef.current?.click()}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Document</span>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-3 h-11"
                onClick={() => {
                  fileInputRef.current?.click();
                  videoInputRef.current?.click();
                }}
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Image className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Photos & videos</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Emoji Picker */}
        <EmojiPicker onSelect={handleEmojiSelect} />

        {/* Message Input */}
        <Textarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          disabled={disabled}
          rows={1}
        />

        {/* Send Button */}
        <Button 
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled || uploading || !isVerified}
          className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all flex-shrink-0"
          size="icon"
          title={!isVerified ? "Only verified users can send messages" : ""}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}