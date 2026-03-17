import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { awardReviewPoints } from '../points/PointsEarningHelper';

export default function ReviewForm({ swapRequest, onSuccess }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      return await api.entities.Review.create(reviewData);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      
      // Award points for leaving a review
      const user = await api.auth.me();
      await awardReviewPoints(user.email, data.id);
      
      toast.success('Review submitted successfully! +25 GuestPoints awarded.');
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to submit review');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = await api.auth.me();
    
    submitReviewMutation.mutate({
      swap_request_id: swapRequest.id,
      property_id: swapRequest.property_id,
      property_title: swapRequest.property_title,
      author_email: user.email,
      reviewer_name: user.full_name || user.username || user.email,
      target_email: swapRequest.host_email,
      rating,
      review_text: reviewText,
      stay_date: swapRequest.check_in,
      status: 'approved'
    });
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoveredRating || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <StarRating 
            value={rating} 
            onChange={setRating} 
            label="Overall Rating" 
          />
          

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Your Review
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this property..."
              rows={5}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800"
            disabled={submitReviewMutation.isPending}
          >
            {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}