import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, TrendingUp, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PropertyCard from '../properties/PropertyCard';

export default function PropertyRecommendations({ user }) {
  const [recommendations, setRecommendations] = useState([]);

  const { data: savedProperties = [] } = useQuery({
    queryKey: ['saved-properties', user?.saved_properties],
    queryFn: async () => {
      if (!user?.saved_properties?.length) return [];
      const props = await Promise.all(
        user.saved_properties.slice(0, 5).map(id =>
          api.entities.Property.filter({ id }).then(res => res[0])
        )
      );
      return props.filter(Boolean);
    },
    enabled: !!user?.saved_properties?.length,
  });

  const { data: swapHistory = [] } = useQuery({
    queryKey: ['swap-history', user?.email],
    queryFn: () => api.entities.SwapRequest.filter({
      $or: [{ requester_email: user?.email }, { host_email: user?.email }],
      status: 'completed'
    }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const { data: allProperties = [] } = useQuery({
    queryKey: ['all-properties-for-recommendations'],
    queryFn: () => api.entities.Property.filter({ status: 'active' }, '-created_date', 100),
  });

  const { isLoading } = useQuery({
    queryKey: ['property-recommendations', user?.email],
    queryFn: async () => {
      if (!user || !allProperties.length) return [];

      const userContext = {
        duty_station: user.duty_station,
        organization: user.organization,
        staff_grade: user.staff_grade,
        saved_properties: savedProperties.map(p => ({
          location: p.location,
          type: p.property_type,
          duty_station: p.nearest_duty_station
        })),
        past_swaps: swapHistory.map(s => ({
          location: s.property_title,
          swap_type: s.swap_type
        }))
      };

      const response = await api.integrations.Core.InvokeLLM({
        prompt: `You are a property recommendation AI for UNswap, a diplomatic housing exchange platform.

User Profile:
- Duty Station: ${userContext.duty_station || 'Not specified'}
- Organization: ${userContext.organization || 'Not specified'}
- Staff Grade: ${userContext.staff_grade || 'Not specified'}

User has saved ${savedProperties.length} properties and completed ${swapHistory.length} swaps.
${savedProperties.length > 0 ? `Saved properties include: ${savedProperties.map(p => p.location).join(', ')}` : ''}

Available Properties: ${allProperties.length} active listings

Based on the user's profile and preferences, recommend 6 property IDs from this list that would be most relevant:
${allProperties.slice(0, 50).map(p => `- ID: ${p.id}, Location: ${p.location}, Type: ${p.property_type}, Near: ${p.nearest_duty_station || 'N/A'}`).join('\n')}

Consider:
1. Proximity to their duty station or common rotation stations
2. Properties near duty stations of their organization
3. Similar property types to what they've saved
4. Properties in locations they might need for career progression
5. Reciprocal swap opportunities

Return ONLY a JSON array of property IDs (up to 6), nothing else.`,
        response_json_schema: {
          type: "object",
          properties: {
            property_ids: {
              type: "array",
              items: { type: "string" },
              maxItems: 6
            }
          }
        }
      });

      const recommendedIds = response.property_ids || [];
      const recommended = allProperties.filter(p => recommendedIds.includes(p.id));
      setRecommendations(recommended);
      return recommended;
    },
    enabled: !!user && allProperties.length > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (!user || isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-3 text-purple-900">Generating personalized recommendations...</span>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Recommended for You</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                AI-powered suggestions based on your profile and preferences
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PropertyCard
                  property={property}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}