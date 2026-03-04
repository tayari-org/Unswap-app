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
  const [cleanliness, setCleanliness] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [location, setLocation] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      return await api.entities.Review.create(reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Review submitted successfully!');
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
      host_id: swapRequest.host_id,
      host_email: swapRequest.host_email,
      reviewer_id: user.id,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      rating,
      cleanliness_rating: cleanliness,
      communication_rating: communication,
      accuracy_rating: accuracy,
      location_rating: location,
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
          
          <div className="grid md:grid-cols-2 gap-4">
            <StarRating 
              value={cleanliness} 
              onChange={setCleanliness} 
              label="Cleanliness" 
            />
            <StarRating 
              value={communication} 
              onChange={setCommunication} 
              label="Communication" 
            />
            <StarRating 
              value={accuracy} 
              onChange={setAccuracy} 
              label="Accuracy" 
            />
            <StarRating 
              value={location} 
              onChange={setLocation} 
              label="Location" 
            />
          </div>

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