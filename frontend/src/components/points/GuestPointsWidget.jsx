import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GuestPointsWidget({ user, onRedeem }) {
  const { data: transactions = [] } = useQuery({
    queryKey: ['point-transactions', user?.email],
    queryFn: () => api.entities.GuestPointTransaction.filter(
      { user_email: user?.email },
      '-created_date',
      20
    ),
    enabled: !!user?.email,
  });

  const totalEarned = transactions
    .filter(t => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);

  const totalSpent = Math.abs(
    transactions
      .filter(t => t.points < 0)
      .reduce((sum, t) => sum + t.points, 0)
  );

  const getTransactionIcon = (type) => {
    if (type.startsWith('earned')) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (type.startsWith('spent')) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Coins className="w-4 h-4 text-slate-600" />;
  };

  const getTransactionColor = (type) => {
    if (type.startsWith('earned')) return 'text-green-600';
    if (type.startsWith('spent')) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="space-y-4">
      {/* Points Balance */}
      <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Your Balance</p>
              <p className="text-4xl font-bold">{user?.guest_points || 500}</p>
              <p className="text-amber-100 text-sm mt-1">GuestPoints</p>
            </div>
            <Coins className="w-12 h-12 text-amber-200 opacity-50" />
          </div>
          <Button 
            onClick={onRedeem}
            variant="secondary"
            size="sm"
            className="w-full bg-white text-amber-600 hover:bg-amber-50"
          >
            <Gift className="w-4 h-4 mr-2" />
            Redeem Points
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-slate-500">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalEarned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-slate-500">Total Redeemed</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalSpent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your point transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(transaction.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </p>
                      <p className="text-xs text-slate-500">
                        Balance: {transaction.balance_after || user?.guest_points || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Coins className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Start earning by completing stays!</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}