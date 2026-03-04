import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Gift, Sparkles, Crown, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';

const REDEMPTION_OPTIONS = [
  {
    id: 'discount_10',
    title: '10% Off Next Swap',
    points: 100,
    icon: Gift,
    description: 'Get 10% off GuestPoints cost for your next booking',
    type: 'spent_discount',
  },
  {
    id: 'discount_25',
    title: '25% Off Next Swap',
    points: 250,
    icon: Sparkles,
    description: 'Get 25% off GuestPoints cost for your next booking',
    type: 'spent_discount',
  },
  {
    id: 'priority_support',
    title: 'Priority Support',
    points: 150,
    icon: Crown,
    description: '30 days of priority customer support',
    type: 'spent_upgrade',
  },
  {
    id: 'featured_listing',
    title: 'Featured Listing',
    points: 200,
    icon: Zap,
    description: 'Feature your property for 7 days',
    type: 'spent_perk',
  },
  {
    id: 'discount_50',
    title: '50% Off Next Swap',
    points: 500,
    icon: Crown,
    description: 'Get 50% off GuestPoints cost for your next booking',
    type: 'spent_discount',
  },
];

export default function PointsRedemptionDialog({ open, onOpenChange, user }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const queryClient = useQueryClient();

  const redeemPointsMutation = useMutation({
    mutationFn: async (option) => {
      const currentPoints = user?.guest_points || 0;
      const newBalance = currentPoints - option.points;

      // Create transaction record
      await api.entities.GuestPointTransaction.create({
        user_email: user.email,
        transaction_type: option.type,
        points: -option.points,
        balance_after: newBalance,
        description: `Redeemed: ${option.title}`,
        metadata: { redemption_id: option.id },
      });

      // Update user balance
      await api.auth.updateMe({ guest_points: newBalance });

      // Store active perk/discount
      const activePerks = user.active_perks || [];
      await api.auth.updateMe({
        active_perks: [...activePerks, {
          type: option.id,
          title: option.title,
          activated_at: new Date().toISOString(),
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      queryClient.invalidateQueries(['point-transactions']);
      toast.success('Points redeemed successfully!');
      onOpenChange(false);
      setSelectedOption(null);
    },
    onError: () => {
      toast.error('Failed to redeem points');
    },
  });

  const handleRedeem = () => {
    if (!selectedOption) return;
    redeemPointsMutation.mutate(selectedOption);
  };

  const userPoints = user?.guest_points || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            Redeem GuestPoints
          </DialogTitle>
          <DialogDescription>
            Choose a reward to redeem with your points
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700">Available Balance</p>
                  <p className="text-2xl font-bold text-amber-900">{userPoints} Points</p>
                </div>
                <Coins className="w-10 h-10 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          {/* Redemption Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {REDEMPTION_OPTIONS.map((option) => {
              const canAfford = userPoints >= option.points;
              const Icon = option.icon;
              const isSelected = selectedOption?.id === option.id;

              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-2 border-amber-500 shadow-md' 
                      : canAfford 
                        ? 'hover:border-amber-300 hover:shadow-sm' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canAfford && setSelectedOption(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-amber-600" />
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{option.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{option.description}</p>
                    <Badge variant={canAfford ? 'default' : 'secondary'} className="bg-amber-500">
                      <Coins className="w-3 h-3 mr-1" />
                      {option.points} Points
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={!selectedOption || redeemPointsMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {redeemPointsMutation.isPending ? 'Redeeming...' : 'Redeem Points'}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>How to earn more points:</strong> Complete stays (+100), leave reviews (+25), 
              verify your identity (+50), refer friends (+200), and maintain a great guest rating for bonuses!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}