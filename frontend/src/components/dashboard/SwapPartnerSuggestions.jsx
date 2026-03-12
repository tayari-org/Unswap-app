import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Sparkles, Loader2, MapPin, Home, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SwapPartnerSuggestions({ user, userProperties }) {
  const [suggestions, setSuggestions] = useState([]);

  const { data: allProperties = [] } = useQuery({
    queryKey: ['all-properties-for-matching'],
    queryFn: () => api.entities.Property.filter({ status: 'active' }, '-created_date', 100),
  });

  const { isLoading } = useQuery({
    queryKey: ['swap-partner-suggestions', user?.email, userProperties?.length],
    queryFn: async () => {
      if (!userProperties?.length || !allProperties.length) return [];

      const userPropsContext = userProperties.slice(0, 3).map(p => ({
        id: p.id,
        location: p.location,
        type: p.property_type,
        duty_station: p.nearest_duty_station,
        bedrooms: p.bedrooms,
        points: p.nightly_points
      }));

      const response = await api.integrations.Core.InvokeLLM({
        prompt: `You are a swap matching AI for UNswap, a diplomatic housing exchange platform.

User owns these properties:
${userPropsContext.map(p => `- ${p.location}, ${p.type}, near ${p.duty_station}, ${p.bedrooms} bed, ${p.points} pts/night`).join('\n')}

Available properties for potential swaps:
${allProperties.filter(p => p.owner_email !== user?.email).slice(0, 50).map(p => 
  `- ID: ${p.id}, Location: ${p.location}, Type: ${p.property_type}, Near: ${p.nearest_duty_station || 'N/A'}, Owner: ${p.owner_email}`
).join('\n')}

Suggest up to 5 properties that would be ideal swap partners based on:
1. Complementary locations (e.g., Geneva <-> New York, DC <-> Vienna)
2. Similar property values/sizes for fair exchanges
3. Reciprocal swap preferences
4. Common duty station rotations
5. Similar quality and amenities

Return ONLY a JSON array with property IDs and brief match reasons.`,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  property_id: { type: "string" },
                  reason: { type: "string" }
                }
              },
              maxItems: 5
            }
          }
        }
      });

      const matches = response.matches || [];
      const matchedProperties = matches.map(m => {
        const property = allProperties.find(p => p.id === m.property_id);
        return property ? { ...property, match_reason: m.reason } : null;
      }).filter(Boolean);

      setSuggestions(matchedProperties);
      return matchedProperties;
    },
    enabled: !!user && !!userProperties?.length && allProperties.length > 0,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });

  if (!userProperties?.length) return null;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-3 text-blue-900">Finding perfect swap partners...</span>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Perfect Swap Matches
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  AI-curated partners for your listings
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={createPageUrl('PropertyDetails') + '?id=' + property.id}>
                <div className="p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'}
                      alt={property.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {property.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {property.location}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {property.nightly_points || 200} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="text-blue-600 font-medium">Why this matches:</span> {property.match_reason}
                      </p>
                      <div className="flex items-center gap-2">
                        <Home className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {property.bedrooms} bed • {property.property_type}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          <Link to={createPageUrl('FindProperties')}>
            <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
              Browse All Properties
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}