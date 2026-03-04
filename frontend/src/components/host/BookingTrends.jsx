import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function BookingTrends({ swapRequests, detailed = false }) {
  // Group requests by month for the last 6 months
  const getLast6MonthsData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(date, 'MMM yyyy');
      
      const monthRequests = swapRequests.filter(s => {
        const requestDate = new Date(s.created_date);
        return requestDate.getMonth() === date.getMonth() && 
               requestDate.getFullYear() === date.getFullYear();
      });

      months.push({
        month: format(date, 'MMM'),
        total: monthRequests.length,
        approved: monthRequests.filter(s => s.status === 'approved' || s.status === 'completed').length,
        pending: monthRequests.filter(s => s.status === 'pending').length,
        rejected: monthRequests.filter(s => s.status === 'rejected').length
      });
    }
    
    return months;
  };

  const chartData = getLast6MonthsData();

  // Status breakdown
  const statusCounts = {
    completed: swapRequests.filter(s => s.status === 'completed').length,
    approved: swapRequests.filter(s => s.status === 'approved').length,
    pending: swapRequests.filter(s => s.status === 'pending').length,
    rejected: swapRequests.filter(s => s.status === 'rejected').length,
  };

  const totalRequests = swapRequests.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Booking Trends
        </CardTitle>
        <CardDescription>
          Your booking activity over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-slate-900">{statusCounts.completed}</span>
            </div>
            <p className="text-sm text-slate-600">Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-slate-900">{statusCounts.approved}</span>
            </div>
            <p className="text-sm text-slate-600">Approved</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-slate-900">{statusCounts.pending}</span>
            </div>
            <p className="text-sm text-slate-600">Pending</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold text-slate-900">{statusCounts.rejected}</span>
            </div>
            <p className="text-sm text-slate-600">Rejected</p>
          </div>
        </div>

        {detailed && totalRequests > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-slate-900 mb-3">Recent Bookings</h4>
            <div className="space-y-3">
              {swapRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{request.property_title}</p>
                    <p className="text-sm text-slate-600">
                      {format(new Date(request.check_in), 'MMM d')} - {format(new Date(request.check_out), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.status === 'completed' || request.status === 'approved'
                        ? 'default'
                        : request.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}