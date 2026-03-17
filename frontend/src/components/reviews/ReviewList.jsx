import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, MessageSquare, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ReviewList({ propertyId, hostEmail, showModeration = false }) {
  const queryClient = useQueryClient();
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', propertyId, hostEmail],
    queryFn: async () => {
      if (propertyId) {
        return await api.entities.Review.filter({
          property_id: propertyId,
          status: showModeration ? undefined : 'approved'
        }, '-created_date');
      }
      if (hostEmail) {
        return await api.entities.Review.filter({
          target_email: hostEmail,
          status: showModeration ? undefined : 'approved'
        }, '-created_date');
      }
      return [];
    },
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const respondMutation = useMutation({
    mutationFn: async ({ reviewId, response }) => {
      return await api.entities.Review.update(reviewId, {
        response_from_host: response,
        response_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Response posted');
      setRespondingTo(null);
      setResponseText('');
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId) => {
      const review = reviews.find(r => r.id === reviewId);
      return await api.entities.Review.update(reviewId, {
        helpful_count: (review.helpful_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ reviewId, status, reason }) => {
      const moderator = await api.auth.me();
      return await api.entities.Review.update(reviewId, {
        status,
        flagged_reason: reason,
        moderated_by: moderator.email,
        moderated_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review moderated');
    },
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;


  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900">{averageRating}</div>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                      }`}
                  />
                ))}
              </div>
              <div className="text-sm text-slate-500 mt-1">{reviews.length} reviews</div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-slate-900">{review.reviewer_name}</div>
                <div className="text-sm text-slate-500">
                  {format(new Date(review.created_date), 'MMMM yyyy')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showModeration && (
                  <Badge variant={review.status === 'approved' ? 'default' : 'destructive'}>
                    {review.status}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-slate-700 mb-4">{review.review_text}</p>


            {/* Host Response */}
            {review.response_from_host && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="font-medium text-slate-900 mb-1">Response from host</div>
                <div className="text-sm text-slate-500 mb-2">
                  {format(new Date(review.response_date), 'MMMM d, yyyy')}
                </div>
                <p className="text-slate-700">{review.response_from_host}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => helpfulMutation.mutate(review.id)}
                className="text-slate-600"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Helpful ({review.helpful_count || 0})
              </Button>

              {user?.email === review.target_email && !review.response_from_host && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRespondingTo(review.id)}
                  className="text-slate-600"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Respond
                </Button>
              )}

              {showModeration && user?.role === 'admin' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moderateMutation.mutate({
                      reviewId: review.id,
                      status: 'flagged',
                      reason: 'Flagged for review'
                    })}
                    className="text-orange-600"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Flag
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moderateMutation.mutate({
                      reviewId: review.id,
                      status: 'removed',
                      reason: 'Removed by admin'
                    })}
                    className="text-red-600"
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>

            {/* Response Form */}
            {respondingTo === review.id && (
              <div className="mt-4 space-y-2">
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => respondMutation.mutate({
                      reviewId: review.id,
                      response: responseText
                    })}
                    disabled={!responseText.trim() || respondMutation.isPending}
                  >
                    Post Response
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRespondingTo(null);
                      setResponseText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}