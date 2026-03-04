import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentReviews({ reviews, detailed = false }) {
  const getStarColor = (rating) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 3.5) return 'text-amber-500';
    return 'text-orange-500';
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Guest Reviews
        </CardTitle>
        <CardDescription>
          {detailed ? 'All reviews from your guests' : 'Recent feedback from guests'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{review.reviewer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm font-semibold text-slate-700">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {format(new Date(review.created_date), 'MMM d, yyyy')}
                    </p>
                    {review.stay_date && (
                      <p className="text-xs text-slate-400 mt-1">
                        Stayed: {format(new Date(review.stay_date), 'MMM yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Property */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {review.property_title}
                  </Badge>
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {review.review_text}
                  </p>
                )}

                {/* Detailed Ratings */}
                {detailed && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                    {review.cleanliness_rating && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Cleanliness</p>
                        <p className="font-semibold text-slate-900">{review.cleanliness_rating}</p>
                      </div>
                    )}
                    {review.communication_rating && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Communication</p>
                        <p className="font-semibold text-slate-900">{review.communication_rating}</p>
                      </div>
                    )}
                    {review.accuracy_rating && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Accuracy</p>
                        <p className="font-semibold text-slate-900">{review.accuracy_rating}</p>
                      </div>
                    )}
                    {review.location_rating && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Location</p>
                        <p className="font-semibold text-slate-900">{review.location_rating}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Host Response */}
                {review.response_from_host && (
                  <div className="mt-3 pl-4 border-l-2 border-slate-300">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-medium text-slate-700">Your Response</p>
                    </div>
                    <p className="text-sm text-slate-600">{review.response_from_host}</p>
                  </div>
                )}

                {/* Helpful Count */}
                {review.helpful_count > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t">
                    <span>{review.helpful_count} people found this helpful</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Star className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No reviews yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Reviews will appear here after guests complete their stays
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}