import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Building2,
  Bed,
  Bath,
  Users,
  Calendar,
  Coins,
  Grid3X3,
  List,
  ChevronDown,
  Map as MapIcon,
  Home,
  Check
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import PropertyCard from '../components/properties/PropertyCard';

const dutyStations = [
  "UN HQ New York", "UNOG Geneva", "UNON Nairobi", "UNOV Vienna",
  "ESCAP Bangkok", "ECA Addis Ababa", "ECLAC Santiago", "ESCWA Beirut",
  "World Bank DC", "IMF DC", "WHO Geneva", "UNICEF NY", "UNESCO Paris",
  "FAO Rome", "ILO Geneva", "Other"
];

const propertyTypes = ["apartment", "house", "villa", "cabin", "penthouse", "townhouse"];

const availabilityTypes = [
  { value: 'short_term', label: 'Short-Term (1-14 days)' },
  { value: 'long_term', label: 'Long-Term (1-12 months)' },
  { value: 'both', label: 'Both' }
];

const specialTags = [
  "Mission-Ready",
  "Pet Care Included",
  "Plant Care Included",
  "Car Swap Available"
];

export default function FindProperties() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    duty_station: '',
    property_type: '',
    availability_type: '',
    bedrooms: 0,
    bathrooms: 0,
    max_points: 500,
    special_tags: [],
    amenities: [],
    security_features: []
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Get URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const location = urlParams.get('location');
    const dutyStation = urlParams.get('duty_station');

    if (location) setSearchQuery(location);
    if (dutyStation) setFilters(f => ({ ...f, duty_station: dutyStation }));
  }, []);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      try {
        return await api.entities.Property.filter({ status: 'active' }, '-created_date', 50);
      } catch {
        return [];
      }
    },
  });

  const filteredProperties = properties?.filter(property => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        property.title?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.country?.toLowerCase().includes(query) ||
        property.location?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Duty station filter
    if (filters.duty_station && property.duty_station !== filters.duty_station) {
      return false;
    }

    // Property type filter
    if (filters.property_type && property.property_type !== filters.property_type) {
      return false;
    }

    // Availability type filter
    if (filters.availability_type && property.availability_type !== filters.availability_type && property.availability_type !== 'both') {
      return false;
    }

    // Bedrooms filter
    if (filters.bedrooms > 0 && (property.bedrooms || 0) < filters.bedrooms) {
      return false;
    }

    // Bathrooms filter
    if (filters.bathrooms > 0 && (property.bathrooms || 0) < filters.bathrooms) {
      return false;
    }

    // Points filter
    if (filters.max_points < 500 && (property.smart_credit_value || 200) > filters.max_points) {
      return false;
    }

    // Special tags filter
    if (filters.special_tags.length > 0) {
      const hasAllTags = filters.special_tags.every(tag =>
        property.special_tags?.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    return true;
  }) || [];

  const clearFilters = () => {
    setFilters({
      duty_station: '',
      property_type: '',
      availability_type: '',
      bedrooms: 0,
      bathrooms: 0,
      max_points: 500,
      special_tags: [],
      amenities: [],
      security_features: []
    });
    setSearchQuery('');
  };

  const activeFilterCount = [
    filters.duty_station,
    filters.property_type,
    filters.availability_type,
    filters.bedrooms > 0,
    filters.bathrooms > 0,
    filters.max_points < 500,
    filters.special_tags.length > 0,
    filters.amenities.length > 0,
    filters.security_features.length > 0
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Duty Station */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Duty Station</label>
        <Select
          value={filters.duty_station}
          onValueChange={(v) => setFilters(f => ({ ...f, duty_station: v }))}
        >
          <SelectTrigger className="rounded-none border-slate-200 bg-slate-50/50">
            <SelectValue placeholder="Any duty station" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value={null}>Any duty station</SelectItem>
            {dutyStations.map(station => (
              <SelectItem key={station} value={station}>{station}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Property Type</label>
        <Select
          value={filters.property_type}
          onValueChange={(v) => setFilters(f => ({ ...f, property_type: v }))}
        >
          <SelectTrigger className="rounded-none border-slate-200 bg-slate-50/50">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value={null}>Any type</SelectItem>
            {propertyTypes.map(type => (
              <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Availability */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Stay Duration</label>
        <Select
          value={filters.availability_type}
          onValueChange={(v) => setFilters(f => ({ ...f, availability_type: v }))}
        >
          <SelectTrigger className="rounded-none border-slate-200 bg-slate-50/50">
            <SelectValue placeholder="Any duration" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value={null}>Any duration</SelectItem>
            {availabilityTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Min Bedrooms</label>
          <Select
            value={String(filters.bedrooms)}
            onValueChange={(v) => setFilters(f => ({ ...f, bedrooms: parseInt(v) }))}
          >
            <SelectTrigger className="rounded-none border-slate-200 bg-slate-50/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={String(num)}>
                  {num === 0 ? 'Any' : `${num}+`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Min Bathrooms</label>
          <Select
            value={String(filters.bathrooms)}
            onValueChange={(v) => setFilters(f => ({ ...f, bathrooms: parseInt(v) }))}
          >
            <SelectTrigger className="rounded-none border-slate-200 bg-slate-50/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {[0, 1, 2, 3, 4].map(num => (
                <SelectItem key={num} value={String(num)}>
                  {num === 0 ? 'Any' : `${num}+`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Points Range */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Max Points/Night</label>
          <span className="text-[10px] font-bold text-unswap-blue-deep tracking-widest">{filters.max_points} PTS</span>
        </div>
        <Slider
          value={[filters.max_points]}
          onValueChange={([v]) => setFilters(f => ({ ...f, max_points: v }))}
          max={500}
          min={50}
          step={25}
          className="mt-2"
        />
      </div>

      {/* Special Tags */}
      <div className="pt-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">Special Features</label>
        <div className="space-y-3">
          {specialTags.map(tag => (
            <div key={tag} className="flex items-center gap-3 group cursor-pointer" onClick={() => {
              setFilters(f => ({
                ...f,
                special_tags: f.special_tags.includes(tag)
                  ? f.special_tags.filter(t => t !== tag)
                  : [...f.special_tags, tag]
              }));
            }}>
              <div className={`w-4 h-4 rounded-none border transition-all flex items-center justify-center ${filters.special_tags.includes(tag) ? 'bg-unswap-blue-deep border-unswap-blue-deep' : 'border-slate-300 group-hover:border-slate-400'}`}>
                {filters.special_tags.includes(tag) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-[11px] font-medium uppercase tracking-widest transition-colors ${filters.special_tags.includes(tag) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-unswap-blue-deep hover:text-slate-900 font-bold text-[9px] uppercase tracking-widest h-10 border border-slate-100 hover:border-slate-200 transition-all">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header - Search & View Controls */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-unswap-blue-deep transition-colors" />
            <Input
              placeholder="Search by city, country, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-12 bg-slate-50/50 border-slate-100 rounded-none focus-visible:ring-0 focus-visible:border-unswap-blue-deep transition-all text-sm font-light tracking-tight placeholder:text-slate-400 placeholder:font-medium placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Filters Toggle - Mobile Only */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-10 rounded-none border-slate-200 px-6 font-bold text-[10px] uppercase tracking-widest">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 w-4 h-4 bg-unswap-blue-deep text-white flex items-center justify-center text-[9px]">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-r-0 rounded-none">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Filters</SheetTitle>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-px bg-slate-100 p-0.5 rounded-none border border-slate-200">
              {[
                { id: 'grid', icon: Grid3X3 },
                { id: 'list', icon: List },
                { id: 'map', icon: MapIcon }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`p-2.5 transition-all ${viewMode === mode.id ? 'bg-unswap-blue-deep text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-32 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em]">Filters</h3>
                {activeFilterCount > 0 && (
                  <Badge className="bg-unswap-blue-deep text-white rounded-none border-0 font-bold tracking-widest uppercase text-[9px] px-2 py-0.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Active Badges Header */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {filters.duty_station && (
                  <Badge variant="outline" className="h-7 rounded-none border-slate-200 bg-white px-3 gap-2 group hover:border-unswap-blue-deep transition-colors">
                    <Building2 className="w-3 h-3 text-unswap-blue-deep/50" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{filters.duty_station}</span>
                    <X className="w-3 h-3 cursor-pointer text-slate-300 group-hover:text-unswap-blue-deep" onClick={() => setFilters(f => ({ ...f, duty_station: '' }))} />
                  </Badge>
                )}
                {filters.property_type && (
                  <Badge variant="outline" className="h-7 rounded-none border-slate-200 bg-white px-3 gap-2 group hover:border-unswap-blue-deep transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 capitalize">{filters.property_type}</span>
                    <X className="w-3 h-3 cursor-pointer text-slate-300 group-hover:text-unswap-blue-deep" onClick={() => setFilters(f => ({ ...f, property_type: '' }))} />
                  </Badge>
                )}
                {filters.bedrooms > 0 && (
                  <Badge variant="outline" className="h-7 rounded-none border-slate-200 bg-white px-3 gap-2 group hover:border-unswap-blue-deep transition-colors">
                    <Bed className="w-3 h-3 text-unswap-blue-deep/50" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{filters.bedrooms}+</span>
                    <X className="w-3 h-3 cursor-pointer text-slate-300 group-hover:text-unswap-blue-deep" onClick={() => setFilters(f => ({ ...f, bedrooms: 0 }))} />
                  </Badge>
                )}
              </div>
            )}

            {/* Results Title Area */}
            <div className="mb-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-900">{filteredProperties.length}</span> properties found
                  </p>
                </div>
              </div>
            </div>

            {/* Listings Grid/List/Map */}
            <div className="min-h-[400px]">
              {isLoading ? (
                <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-[4/5] bg-slate-50 border border-slate-100 rounded-none animate-pulse" />
                  ))}
                </div>
              ) : viewMode === 'map' ? (
                <div className="bg-white border border-slate-200 rounded-none h-[600px] flex flex-col items-center justify-center p-12 text-center group">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:bg-unswap-blue-deep transition-all duration-500 group-hover:shadow-2xl">
                    <MapIcon className="w-8 h-8 text-slate-200 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Map View</h3>
                  <p className="text-slate-600 mb-4">
                    Interactive map visualization showing {filteredProperties.length} properties
                  </p>
                  <p className="text-sm text-slate-500 mb-8">
                    Map integration coming soon with geolocation markers for all properties
                  </p>
                  <Button variant="outline" onClick={() => setViewMode('grid')} className="rounded-none px-8 font-bold text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50">Return to Grid</Button>
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className={`grid gap-10 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  <AnimatePresence mode="popLayout">
                    {filteredProperties.map((property, index) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <PropertyCard
                          property={property}
                          index={index}
                          variant={viewMode === 'list' ? 'list' : 'default'}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-32 bg-white border border-slate-100 rounded-none">
                  <div className="w-16 h-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-600 mb-8">Try adjusting your filters or search criteria</p>
                  <Button onClick={clearFilters} className="bg-unswap-blue-deep text-white hover:bg-slate-900 rounded-none px-10 h-11 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl transition-all">Clear All Filters</Button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}