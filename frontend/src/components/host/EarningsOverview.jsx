import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, Calendar, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function EarningsOverview({ swapRequests, properties }) {
  // Calculate earnings (GuestPoints) from completed swaps
  const completedSwaps = swapRequests.filter(s => s.status === 'completed');
  
  const totalEarnings = completedSwaps.reduce((sum, swap) => {
    return sum + (swap.total_points || 0);
  }, 0);

  const thisMonthSwaps = completedSwaps.filter(s => {
    const completedDate = new Date(s.completed_at || s.created_date);
    const now = new Date();
    return completedDate.getMonth() === now.getMonth() && 
           completedDate.getFullYear() === now.getFullYear();
  });

  const thisMonthEarnings = thisMonthSwaps.reduce((sum, swap) => {
    return sum + (swap.total_points || 0);
  }, 0);

  // Get last 6 months earnings data
  const getLast6MonthsEarnings = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const monthSwaps = completedSwaps.filter(s => {
        const swapDate = new Date(s.completed_at || s.created_date);
        return swapDate.getMonth() === date.getMonth() && 
               swapDate.getFullYear() === date.getFullYear();
      });

      const monthEarnings = monthSwaps.reduce((sum, swap) => sum + (swap.total_points || 0), 0);

      months.push({
        month: format(date, 'MMM'),
        earnings: monthEarnings,
        swaps: monthSwaps.length
      });
    }
    
    return months;
  };

  const earningsData = getLast6MonthsEarnings();

  // Calculate average per swap
  const avgPerSwap = completedSwaps.length > 0
    ? Math.round(totalEarnings / completedSwaps.length)
    : 0;

  // Projected annual earnings
  const monthsActive = Math.max(1, completedSwaps.length > 0 ? 12 : 1);
  const projectedAnnual = Math.round((totalEarnings / monthsActive) * 12);

  return (
    <div className="space-y-6">
      {/* Earnings Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">{totalEarnings}</p>
              <p className="text-sm text-slate-600">Total Earned</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">{thisMonthEarnings}</p>
              <p className="text-sm text-slate-600">This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">{avgPerSwap}</p>
              <p className="text-sm text-slate-600">Avg per Swap</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">{projectedAnnual}</p>
              <p className="text-sm text-slate-600">Projected Annual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Trend</CardTitle>
          <CardDescription>GuestPoints earned over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    name === 'earnings' ? `${value} points` : `${value} swaps`,
                    name === 'earnings' ? 'Earnings' : 'Swaps'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Property Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
          <CardDescription>Earnings breakdown by property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.map(property => {
              const propertySwaps = completedSwaps.filter(s => s.property_id === property.id);
              const propertyEarnings = propertySwaps.reduce((sum, s) => sum + (s.total_points || 0), 0);
              
              return (
                <div key={property.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{property.title}</p>
                    <p className="text-sm text-slate-600">{propertySwaps.length} completed swaps</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-600">{propertyEarnings}</p>
                    <p className="text-xs text-slate-500">points earned</p>
                  </div>
                </div>
              );
            })}
            
            {properties.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No properties listed yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}