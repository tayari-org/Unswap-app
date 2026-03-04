import React from 'react';
import { Search, MapPin, SlidersHorizontal, X, Calendar, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const DUTY_STATIONS = [
  "All Stations", "UNHQ New York", "UNOG Geneva", "UNON Nairobi", "UNOV Vienna",
  "ESCAP Bangkok", "ECA Addis Ababa", "ECLAC Santiago", "ESCWA Beirut",
  "World Bank DC", "IMF DC", "WHO Geneva", "UNICEF New York", "Other"
];

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
];

const AVAILABILITY_TYPES = [
  { value: 'all', label: 'Any Duration' },
  { value: 'short_term', label: 'Short-term (R&R)' },
  { value: 'long_term', label: 'Long-term (Rotations)' },
  { value: 'both', label: 'Flexible' },
];

const MOBILITY_TAGS = [
  'Mission-Ready', 'Pet Care', 'Car Swap', 'Plant Care', 
  'Secure Building', 'Home Office', 'Family Friendly'
];

const AMENITIES = [
  'Wi-Fi', 'Parking', 'Air Conditioning', 'Kitchen', 'Washer & Dryer',
  'Balcony', 'Garden', 'Gym', 'Pool', 'Workspace'
];

export default function PropertyFilters({ filters, setFilters, activeFiltersCount, onApplyFilters }) {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      dutyStation: 'All Stations',
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
  };

  const handleApplyFilters = () => {
    onApplyFilters?.();
    setSheetOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by location, title..."
            className="pl-10 h-12 border-slate-200"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Duty Station */}
        <Select value={filters.dutyStation} onValueChange={(v) => updateFilter('dutyStation', v)}>
          <SelectTrigger className="w-full lg:w-52 h-12">
            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Duty Station" />
          </SelectTrigger>
          <SelectContent>
            {DUTY_STATIONS.map((station) => (
              <SelectItem key={station} value={station}>{station}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Property Type */}
        <Select value={filters.propertyType} onValueChange={(v) => updateFilter('propertyType', v)}>
          <SelectTrigger className="w-full lg:w-40 h-12">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Availability */}
        <Select value={filters.availability} onValueChange={(v) => updateFilter('availability', v)}>
          <SelectTrigger className="w-full lg:w-44 h-12">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters */}
         <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
           <SheetTrigger asChild>
             <Button variant="outline" className="h-12 px-4">
               <SlidersHorizontal className="w-4 h-4 mr-2" />
               More Filters
               {activeFiltersCount > 0 && (
                 <Badge className="ml-2 bg-amber-500 text-white">{activeFiltersCount}</Badge>
               )}
             </Button>
           </SheetTrigger>
           <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto mt-6 space-y-6 pr-4">
              {/* Points Range */}
              <div>
                <Label className="text-sm font-medium">GuestPoints per night</Label>
                <div className="mt-4 px-2">
                  <Slider
                    value={[filters.minPoints, filters.maxPoints]}
                    min={0}
                    max={1000}
                    step={50}
                    onValueChange={([min, max]) => {
                      updateFilter('minPoints', min);
                      updateFilter('maxPoints', max);
                    }}
                  />
                  <div className="flex justify-between mt-2 text-sm text-slate-600">
                    <span>{filters.minPoints} pts</span>
                    <span>{filters.maxPoints} pts</span>
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <Label className="text-sm font-medium">Minimum Bedrooms</Label>
                <div className="flex gap-2 mt-3">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      variant={filters.bedrooms === num ? 'default' : 'outline'}
                      className={`w-10 h-10 p-0 ${filters.bedrooms === num ? 'bg-slate-900' : ''}`}
                      onClick={() => updateFilter('bedrooms', num)}
                    >
                      {num === 0 ? 'Any' : num}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Verified Only */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={filters.verifiedOnly}
                  onCheckedChange={(checked) => updateFilter('verifiedOnly', checked)}
                />
                <Label htmlFor="verified" className="text-sm">Verified properties only</Label>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Travel Dates
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600">Check-in</Label>
                    <Input
                      type="date"
                      value={filters.checkIn || ''}
                      onChange={(e) => updateFilter('checkIn', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Check-out</Label>
                    <Input
                      type="date"
                      value={filters.checkOut || ''}
                      onChange={(e) => updateFilter('checkOut', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  <Star className="w-4 h-4 inline mr-1" />
                  Minimum Guest Rating
                </Label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={filters.minRating === rating ? 'default' : 'outline'}
                      className={`flex-1 ${filters.minRating === rating ? 'bg-slate-900' : ''}`}
                      onClick={() => updateFilter('minRating', rating)}
                      size="sm"
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => (
                    <Badge
                      key={amenity}
                      variant={filters.amenities?.includes(amenity) ? 'default' : 'outline'}
                      className={`cursor-pointer ${filters.amenities?.includes(amenity) ? 'bg-blue-500' : ''}`}
                      onClick={() => {
                        const selectedAmenities = filters.amenities || [];
                        const newAmenities = selectedAmenities.includes(amenity)
                          ? selectedAmenities.filter(a => a !== amenity)
                          : [...selectedAmenities, amenity];
                        updateFilter('amenities', newAmenities);
                      }}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Mobility Tags */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Mobility Features</Label>
                <div className="flex flex-wrap gap-2">
                  {MOBILITY_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.mobilityTags?.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer ${filters.mobilityTags?.includes(tag) ? 'bg-amber-500' : ''}`}
                      onClick={() => {
                        const tags = filters.mobilityTags || [];
                        const newTags = tags.includes(tag)
                          ? tags.filter(t => t !== tag)
                          : [...tags, tag];
                        updateFilter('mobilityTags', newTags);
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              </div>

              {/* Apply Filters Button - Fixed at bottom */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Reset
                </Button>
                <Button 
                  onClick={handleApplyFilters}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Apply Filters
                </Button>
              </div>
              </SheetContent>
              </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          {filters.search && (
            <Badge variant="secondary" className="px-3 py-1">
              Search: {filters.search}
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateFilter('search', '')} />
            </Badge>
          )}
          {filters.dutyStation !== 'All Stations' && (
            <Badge variant="secondary" className="px-3 py-1">
              {filters.dutyStation}
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateFilter('dutyStation', 'All Stations')} />
            </Badge>
          )}
          {filters.verifiedOnly && (
            <Badge variant="secondary" className="px-3 py-1">
              Verified Only
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateFilter('verifiedOnly', false)} />
            </Badge>
          )}
          {filters.checkIn && (
            <Badge variant="secondary" className="px-3 py-1">
              From: {filters.checkIn}
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateFilter('checkIn', '')} />
            </Badge>
          )}
          {filters.checkOut && (
            <Badge variant="secondary" className="px-3 py-1">
              To: {filters.checkOut}
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateFilter('checkOut', '')} />
            </Badge>
          )}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {filters.minRating}+ Rating
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateFilter('minRating', 0)} />
            </Badge>
          )}
          {filters.amenities?.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="px-3 py-1">
              {amenity}
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => {
                updateFilter('amenities', filters.amenities.filter(a => a !== amenity));
              }} />
            </Badge>
          ))}
          {filters.mobilityTags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-3 py-1">
              {tag}
              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => {
                updateFilter('mobilityTags', filters.mobilityTags.filter(t => t !== tag));
              }} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}