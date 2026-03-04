import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Grid3X3, List, Loader2, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import PropertyCard from '../components/properties/PropertyCard';
import PropertyFilters from '../components/properties/PropertyFilters';

export default function FindProperties() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);

  const [filters, setFilters] = useState({
    search: urlParams.get('location') || '',
    dutyStation: urlParams.get('dutyStation') || 'All Stations',
    propertyType: 'all',
    availability: 'all',
    minPoints: 0,
    maxPoints: 1000,
    bedrooms: 0,
    verifiedOnly: false,
    mobilityTags: [],
    amenities: [],
    checkIn: '',
    checkOut: '',
    minRating: 0,
  });

  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', 'active'],
    queryFn: () => api.entities.Property.filter({ status: 'active' }, '-created_date', 100),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries(['current-user']),
  });

  const toggleFavorite = (propertyId) => {
    if (!user) return;
    const saved = user.saved_properties || [];
    const newSaved = saved.includes(propertyId)
      ? saved.filter((id) => id !== propertyId)
      : [...saved, propertyId];
    updateUserMutation.mutate({ saved_properties: newSaved });
  };

  const filteredProperties = useMemo(() => {
    let result = [...properties];
    
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(s) ||
          p.location?.toLowerCase().includes(s)
      );
    }
    
    if (filters.dutyStation && filters.dutyStation !== 'All Stations' && filters.dutyStation !== '') {
      result = result.filter((p) => p.nearest_duty_station === filters.dutyStation);
    }
    
    if (filters.propertyType && filters.propertyType !== 'all') {
      result = result.filter((p) => p.property_type === filters.propertyType);
    }
    
    if (filters.availability && filters.availability !== 'all') {
      result = result.filter((p) => p.availability_type === filters.availability);
    }
    
    result = result.filter(
      (p) => (p.smart_credit_value || 0) >= filters.minPoints && 
             (p.smart_credit_value || 0) <= filters.maxPoints
    );
    
    if (filters.bedrooms > 0) {
      result = result.filter((p) => (p.bedrooms || 0) >= filters.bedrooms);
    }
    
    if (filters.verifiedOnly) {
      result = result.filter((p) => p.is_verified === true);
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((p) => {
        const propAmenities = p.amenities || [];
        return filters.amenities.every(amenity => propAmenities.includes(amenity));
      });
    }
    
    if (filters.mobilityTags && filters.mobilityTags.length > 0) {
      result = result.filter((p) => {
        const propTags = p.mobility_tags || [];
        return filters.mobilityTags.some(tag => propTags.includes(tag));
      });
    }
    
    if (filters.checkIn && filters.checkOut) {
      result = result.filter((p) => {
        const availFrom = p.available_from ? new Date(p.available_from) : null;
        const availTo = p.available_to ? new Date(p.available_to) : null;
        const checkIn = new Date(filters.checkIn);
        const checkOut = new Date(filters.checkOut);
        
        if (availFrom && availTo) {
          return checkIn >= availFrom && checkOut <= availTo;
        }
        return true;
      });
    }
    
    if (filters.minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= filters.minRating);
    }
    
    if (sortBy === 'points_low')
      result.sort((a, b) => (a.smart_credit_value || 0) - (b.smart_credit_value || 0));
    if (sortBy === 'points_high')
      result.sort((a, b) => (b.smart_credit_value || 0) - (a.smart_credit_value || 0));
    
    return result;
  }, [properties, filters, sortBy]);

  const activeFiltersCount = [
    filters.search,
    filters.dutyStation !== 'All Stations',
    filters.propertyType !== 'all',
    filters.availability !== 'all',
    filters.verifiedOnly,
    filters.checkIn,
    filters.checkOut,
    filters.minRating > 0,
    filters.amenities?.length > 0,
    filters.mobilityTags?.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        
        {/* Filters */}
        <PropertyFilters 
          filters={filters}
          setFilters={setFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Results bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-bold text-slate-700">
              Matches:{' '}
              <span className="text-indigo-600 font-extrabold">
                {filteredProperties.length} Properties
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-10 border-slate-200 text-xs font-bold uppercase tracking-wider">
                <SelectValue placeholder="Sort Protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Latest Posting</SelectItem>
                <SelectItem value="points_low">Points: Low → High</SelectItem>
                <SelectItem value="points_high">Points: High → Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <Button
                variant="ghost" size="sm"
                className={`px-4 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost" size="sm"
                className={`px-4 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid / empty / loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 opacity-20" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Querying Secure Registry...
            </span>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-3xl border border-dashed border-slate-200">
            <Building2 className="w-16 h-16 mx-auto mb-6 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-900">No Asset Matches</h3>
            <p className="text-slate-500 mt-2">
              Try relaxing your search parameters or selecting a different station.
            </p>
          </div>
        ) : (
          <div className={`grid gap-10 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
            {filteredProperties.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <PropertyCard
                  property={p}
                  isFavorite={user?.saved_properties?.includes(p.id)}
                  onFavorite={toggleFavorite}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}