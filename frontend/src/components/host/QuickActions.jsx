import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, Calendar, Star, Home, Settings, Plus, Clock, TrendingUp
} from 'lucide-react';

export default function QuickActions({ pendingCount, unreadCount }) {
  const actions = [
    {
      icon: Clock,
      label: 'Review Requests',
      description: 'Pending swap requests',
      badge: pendingCount,
      link: 'MySwaps',
      color: 'text-orange-600 bg-orange-50'
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      description: 'Chat with guests',
      badge: unreadCount,
      link: 'Messages',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: Home,
      label: 'Manage Listings',
      description: 'Edit your properties',
      link: 'MyListings',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Plus,
      label: 'Add Listing',
      description: 'Create new property',
      link: 'PropertyForm',
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: Star,
      label: 'View Reviews',
      description: 'Guest feedback',
      link: 'HostDashboard',
      color: 'text-amber-600 bg-amber-50'
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Profile & preferences',
      link: 'Settings',
      color: 'text-slate-600 bg-slate-50'
    }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action, index) => (
            <Link key={index} to={createPageUrl(action.link)}>
              <button className="w-full group">
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform relative`}>
                    <action.icon className="w-6 h-6" />
                    {action.badge > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-900 text-sm">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}