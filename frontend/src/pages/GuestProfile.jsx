import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  User, Star, Calendar, MapPin, Shield, MessageSquare, 
  ArrowLeft, Lock, Save, Edit2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function GuestProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Get guest email from URL params
  const urlParams = new URLSearchParams(location.search);
  const guestEmail = urlParams.get('email');
  
  const [noteText, setNoteText] = useState('');
  const [noteRating, setNoteRating] = useState(0);
  const [editingNote, setEditingNote] = useState(null);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  // Fetch guest user info
  const { data: guestUsers = [] } = useQuery({
    queryKey: ['guest-user', guestEmail],
    queryFn: () => api.entities.User.filter({ email: guestEmail }),
    enabled: !!guestEmail,
  });

  const guestUser = guestUsers[0];

  // Fetch guest's past swaps as a guest (requester)
  const { data: guestSwaps = [] } = useQuery({
    queryKey: ['guest-swaps', guestEmail],
    queryFn: () => api.entities.SwapRequest.filter({ 
      requester_email: guestEmail,
      status: 'completed'
    }),
    enabled: !!guestEmail,
  });

  // Fetch reviews left BY the guest
  const { data: reviewsLeftByGuest = [] } = useQuery({
    queryKey: ['guest-reviews-left', guestEmail],
    queryFn: () => api.entities.Review.filter({ 
      reviewer_email: guestEmail,
      status: 'approved'
    }),
    enabled: !!guestEmail,
  });

  // Fetch reviews ABOUT the guest (when they were a host)
  const { data: reviewsAboutGuest = [] } = useQuery({
    queryKey: ['guest-reviews-about', guestEmail],
    queryFn: () => api.entities.Review.filter({ 
      host_email: guestEmail,
      status: 'approved'
    }),
    enabled: !!guestEmail,
  });

  // Fetch private host notes (only visible to the current host)
  const { data: hostNotes = [] } = useQuery({
    queryKey: ['host-notes', currentUser?.email, guestEmail],
    queryFn: () => api.entities.HostNote.filter({ 
      host_email: currentUser?.email,
      guest_email: guestEmail
    }),
    enabled: !!currentUser?.email && !!guestEmail,
  });

  // Create/Update host note
  const saveNoteMutation = useMutation({
    mutationFn: (data) => {
      if (editingNote) {
        return api.entities.HostNote.update(editingNote.id, data);
      }
      return api.entities.HostNote.create({
        ...data,
        host_email: currentUser?.email,
        guest_email: guestEmail,
        guest_name: guestSwaps[0]?.requester_name || guestEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['host-notes']);
      setNoteText('');
      setNoteRating(0);
      setEditingNote(null);
      toast.success(editingNote ? 'Note updated' : 'Note saved');
    },
  });

  // Delete host note
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => api.entities.HostNote.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['host-notes']);
      toast.success('Note deleted');
    },
  });

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    saveNoteMutation.mutate({
      note: noteText,
      rating: noteRating || undefined,
    });
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteText(note.note);
    setNoteRating(note.rating || 0);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteText('');
    setNoteRating(0);
  };

  // Calculate stats
  const totalStays = guestSwaps.length;
  const avgRatingAsGuest = reviewsAboutGuest.length > 0
    ? (reviewsAboutGuest.reduce((sum, r) => sum + r.rating, 0) / reviewsAboutGuest.length).toFixed(1)
    : 'N/A';
  
  const avgRatingGiven = reviewsLeftByGuest.length > 0
    ? (reviewsLeftByGuest.reduce((sum, r) => sum + r.rating, 0) / reviewsLeftByGuest.length).toFixed(1)
    : 'N/A';

  if (!guestEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No guest email provided</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Guest Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {guestUser?.avatar_url ? (
                  <img src={guestUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  {guestUser?.username || guestUser?.full_name}
                </h1>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">
                      <strong>{totalStays}</strong> completed stays
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm text-slate-700">
                      <strong>{avgRatingAsGuest}</strong> avg rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Past Stays */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Past Stays
              </CardTitle>
              <CardDescription>
                Properties this guest has stayed at
              </CardDescription>
            </CardHeader>
            <CardContent>
              {guestSwaps.length > 0 ? (
                <div className="space-y-3">
                  {guestSwaps.slice(0, 5).map((swap) => (
                    <div key={swap.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-900">{swap.property_title}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {swap.swap_type === 'reciprocal' ? 'Reciprocal Swap' : 'GuestPoints'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {guestSwaps.length > 5 && (
                    <p className="text-sm text-slate-500 text-center pt-2">
                      + {guestSwaps.length - 5} more stays
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p>No completed stays yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Left by Guest */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Reviews Given
              </CardTitle>
              <CardDescription>
                Feedback this guest has left for hosts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLeftByGuest.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-900">{avgRatingGiven}</p>
                    <p className="text-sm text-slate-600 mt-1">Average rating given</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= parseFloat(avgRatingGiven)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {reviewsLeftByGuest.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900 text-sm">{review.property_title}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-slate-600 line-clamp-2">{review.review_text}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {format(new Date(review.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Star className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p>No reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Private Host Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Private Notes
              <Badge variant="secondary" className="ml-2">Only visible to you</Badge>
            </CardTitle>
            <CardDescription>
              Add private notes about this guest that only you can see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Note Input */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="note">Your Note</Label>
                <Textarea
                  id="note"
                  placeholder="Add your observations, preferences, or any important details about this guest..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Private Rating (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNoteRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 cursor-pointer transition-colors ${
                          star <= noteRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  {noteRating > 0 && (
                    <button
                      onClick={() => setNoteRating(0)}
                      className="ml-2 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveNote}
                  disabled={!noteText.trim() || saveNoteMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingNote ? 'Update Note' : 'Save Note'}
                </Button>
                {editingNote && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Saved Notes */}
            {hostNotes.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Your Previous Notes</h4>
                {hostNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {note.rating && (
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= note.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.note}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {format(new Date(note.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditNote(note)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No notes yet. Add your first note above.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}