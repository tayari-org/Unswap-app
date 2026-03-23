import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function HostContactDialog({ open, onOpenChange, host, currentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  // Check login when opening dialog
  React.useEffect(() => {
    if (open && !currentUser) {
      toast.error('Please log in to send messages');
      api.auth.redirectToLogin(window.location.pathname);
      onOpenChange(false);
    }
  }, [open, currentUser, onOpenChange]);

  const conversationId = [currentUser?.email, host?.email].sort().join('_');

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      return api.entities.Message.create({
        conversation_id: conversationId,
        sender_email: currentUser?.email,
        sender_name: currentUser?.full_name || currentUser?.email,
        recipient_email: host?.email,
        content,
        message_type: 'text',
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      toast.success('Message sent!');
      onOpenChange(false);
      setMessage('');
      navigate(createPageUrl('Messages'));
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contact {host?.full_name || 'Host'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Send a message to the host of this property.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label>Your Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! I'm interested in learning more about your property..."
            className="mt-2"
            rows={5}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}