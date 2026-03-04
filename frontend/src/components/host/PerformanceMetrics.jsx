import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PerformanceMetrics({ properties, selectedProperty, swapRequests }) {
  const filteredProperties = selectedProperty === 'all' 
    ? properties 
    : properties.filter(p => p.id === selectedProperty);

  // Calculate metrics for last 30 days vs previous 30 days
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentRequests = swapRequests.filter(s => 
    new Date(s.created_date) >= last30Days
  ).length;
  
  const previousRequests = swapRequests.filter(s => 
    new Date(s.created_date) >= last60Days && new Date(s.created_date) < last30Days
  ).length;

  const recentApproved = swapRequests.filter(s => 
    s.status === 'approved' && new Date(s.created_date) >= last30Days
  ).length;

  const approvalRate = recentRequests > 0 
    ? ((recentApproved / recentRequests) * 100).toFixed(0)
    : 0;

  const requestTrend = previousRequests > 0
    ? (((recentRequests - previousRequests) / previousRequests) * 100).toFixed(0)
    : recentRequests > 0 ? 100 : 0;

  const avgResponseTime = '< 24h'; // Simplified for now

  const metrics = [
    {
      title: 'Booking Requests',
      value: recentRequests,
      subtitle: 'Last 30 days',
      trend: parseFloat(requestTrend),
      trendLabel: `${Math.abs(requestTrend)}% vs previous period`
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      subtitle: 'Of requests approved',
      trend: approvalRate >= 60 ? 1 : approvalRate >= 40 ? 0 : -1,
      trendLabel: approvalRate >= 60 ? 'Excellent' : approvalRate >= 40 ? 'Good' : 'Could improve'
    },
    {
      title: 'Response Time',
      value: avgResponseTime,
      subtitle: 'Average',
      trend: 1,
      trendLabel: 'Fast responder'
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-slate-700">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{metric.subtitle}</p>
                </div>
                <div className={`flex items-center gap-2 ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="text-sm font-medium">{metric.trendLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}