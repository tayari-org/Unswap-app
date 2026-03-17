import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/apiClient';
import { Upload, X, Plus, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'cabin', 'condo', 'townhouse'];
const DUTY_STATIONS = [
  "UNHQ New York", "UNOG Geneva", "UNON Nairobi", "UNOV Vienna",
  "ESCAP Bangkok", "ECA Addis Ababa", "ECLAC Santiago", "ESCWA Beirut",
  "World Bank DC", "IMF DC", "WHO Geneva", "UNICEF New York", "Other"
];
const AMENITIES = [
  'Wi-Fi', 'Air Conditioning', 'Heating', 'Kitchen', 'Washer', 'Dryer',
  'Parking', 'Pool', 'Gym', 'Elevator', 'Balcony', 'Garden', 'Pet Friendly'
];
const MOBILITY_TAGS = [
  'Mission-Ready', 'Pet Care Included', 'Plant Care Included', 'Car Swap Available',
  'Secure Building', 'Home Office', 'Family Friendly', 'Near Public Transit'
];

export default function PropertyForm({ property, onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    property_type: property?.property_type || 'apartment',
    city: property?.city || '',
    country: property?.country || '',
    address: property?.address || '',
    nearest_duty_station: property?.nearest_duty_station || '',
    distance_to_duty_station: property?.distance_to_duty_station || '',
    images: property?.images || [],
    bedrooms: property?.bedrooms || 1,
    bathrooms: property?.bathrooms || 1,
    max_guests: property?.max_guests || 2,
    nightly_points: property?.nightly_points || 200,
    amenities: property?.amenities || [],
    mobility_tags: property?.mobility_tags || [],
    security_checklist: property?.security_checklist || {
      separate_workspace: false,
      secure_wifi: false,
      locked_storage: false,
      building_security: false,
      safe_available: false,
    },
    availability_type: property?.availability_type || 'both',
    minimum_stay: property?.minimum_stay || 1,
    maximum_stay: property?.maximum_stay || 30,
    available_from: property?.available_from || '',
    available_to: property?.available_to || '',
    swap_preference: property?.swap_preference || 'both',
    swap_types_accepted: property?.swap_types_accepted || [],
    nightly_points: property?.nightly_points || 200,
    status: property?.status || 'draft',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      security_checklist: { ...prev.security_checklist, [field]: checked }
    }));
  };

  const toggleArrayItem = (field, item) => {
    const array = formData[field] || [];
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
    handleChange(field, newArray);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newImages = [...formData.images];

    for (const file of files) {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      newImages.push(file_url);
    }

    handleChange('images', newImages);
    setUploading(false);
  };

  const removeImage = (index) => {
    handleChange('images', formData.images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (asDraft = false) => {
    setSaving(true);
    await onSubmit({
      ...formData,
      status: asDraft ? 'draft' : 'active',
    });
    setSaving(false);
  };

  const steps = [
    { num: 1, title: 'Basic Info' },
    { num: 2, title: 'Photos' },
    { num: 3, title: 'Amenities' },
    { num: 4, title: 'Security' },
    { num: 5, title: 'Availability' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps - Institutional refinement */}
      <div className="flex items-center justify-between mb-16 relative">
        {/* Connection Line Background */}
        <div className="absolute top-5 left-0 right-0 h-[1px] bg-slate-100 -z-10" />
        
        {steps.map((s, index) => (
          <React.Fragment key={s.num}>
            <div
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => setStep(s.num)}
            >
              <div className={`w-10 h-10 rounded-none rotate-45 border flex items-center justify-center transition-all duration-500 relative bg-white ${step >= s.num 
                ? 'border-unswap-blue-deep bg-unswap-blue-deep text-white shadow-lg' 
                : 'border-slate-200 text-slate-300 hover:border-slate-400'
              }`}>
                <div className="-rotate-45 font-serif italic text-xs">
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
              </div>
              <span className={`mt-6 text-[9px] font-bold uppercase tracking-[0.3em] transition-colors ${step >= s.num ? 'text-unswap-blue-deep' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <Card className="rounded-none border-slate-100 shadow-none">
        <CardContent className="p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="property-form-step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Executive Portfolio — Geneva District"
                    className="h-14 rounded-none border-slate-200 bg-stone-50/50 focus:ring-0 focus:border-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Provide a detailed overview of the architectural and functional aspects..."
                    rows={6}
                    className="rounded-none border-slate-200 bg-stone-50/50 focus:ring-0 focus:border-slate-400 resize-none p-4"
                  />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Property Type *</Label>
                    <Select value={formData.property_type} onValueChange={(v) => handleChange('property_type', v)}>
                      <SelectTrigger className="h-14 rounded-none border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type} value={type} className="rounded-none py-3">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g., Geneva"
                      className="h-14 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Country *</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g., Switzerland"
                      className="h-14 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-50 pt-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nearest Duty Station</Label>
                    <Select value={formData.nearest_duty_station} onValueChange={(v) => handleChange('nearest_duty_station', v)}>
                      <SelectTrigger className="h-14 rounded-none border-slate-200 bg-white">
                        <SelectValue placeholder="Nearest Duty Station" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {DUTY_STATIONS.map(station => (
                          <SelectItem key={station} value={station} className="rounded-none py-3">{station}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Distance to Duty Station</Label>
                    <Input
                      value={formData.distance_to_duty_station}
                      onChange={(e) => handleChange('distance_to_duty_station', e.target.value)}
                      placeholder="e.g., 15 min via tram"
                      className="h-14 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 bg-stone-50 p-8 border border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Bedrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bedrooms}
                      onChange={(e) => handleChange('bedrooms', parseInt(e.target.value) || 0)}
                      className="h-12 rounded-none border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Bathrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bathrooms}
                      onChange={(e) => handleChange('bathrooms', parseInt(e.target.value) || 0)}
                      className="h-12 rounded-none border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Max Guests</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.max_guests}
                      onChange={(e) => handleChange('max_guests', parseInt(e.target.value) || 1)}
                      className="h-12 rounded-none border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-8 bg-unswap-blue-deep/5 border border-unswap-blue-deep/10">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-unswap-blue-deep">Nightly Points</Label>
                    <p className="text-[11px] text-slate-500 font-light">Calculated GuestPoints per night for your property</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={0}
                      value={formData.nightly_points}
                      onChange={(e) => handleChange('nightly_points', parseInt(e.target.value) || 0)}
                      className="h-14 w-32 rounded-none border-unswap-blue-deep/20 bg-white text-xl font-extralight text-center focus:ring-unswap-blue-deep"
                    />
                    <span className="text-[10px] font-bold text-unswap-blue-deep uppercase tracking-widest">pts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="property-form-step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-unswap-blue-deep/30" />
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Property Photos</Label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-light uppercase tracking-widest pl-11">Upload high-quality photos of your property.</p>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-none overflow-hidden group border border-slate-100 shadow-sm">
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-slate-900/80 text-white rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-video rounded-none border-[1px] border-dashed border-slate-200 bg-stone-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-unswap-blue-deep/40 hover:bg-stone-100/50 transition-all duration-300 group">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                      ) : (
                        <>
                          <div className="w-10 h-10 border border-slate-200 flex items-center justify-center bg-white group-hover:border-unswap-blue-deep/20 transition-colors">
                            <Plus className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Upload Photos</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="property-form-step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-6">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block pb-2 border-b border-slate-50">Standard Amenities</Label>
                  <div className="flex flex-wrap gap-3">
                    {AMENITIES.map(amenity => (
                      <button
                        key={amenity}
                        onClick={() => toggleArrayItem('amenities', amenity)}
                        className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${formData.amenities.includes(amenity) 
                          ? 'bg-unswap-blue-deep border-unswap-blue-deep text-white shadow-md' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block pb-2 border-b border-slate-50">Professional Mobility Tags</Label>
                  <div className="flex flex-wrap gap-3">
                    {MOBILITY_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleArrayItem('mobility_tags', tag)}
                        className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${formData.mobility_tags.includes(tag) 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-stone-50 border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="property-form-step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-unswap-blue-deep/30" />
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Security Checklist</Label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-light uppercase tracking-widest pl-11 mb-8">Select all security features that apply to your property.</p>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'separate_workspace', label: 'Dedicated professional workspace' },
                      { key: 'secure_wifi', label: 'Encrypted Wi-Fi infrastructure' },
                      { key: 'locked_storage', label: 'Secure storage for confidential assets' },
                      { key: 'building_security', label: '24/7 Building monitoring / Concierge' },
                      { key: 'safe_available', label: 'Digital document safe available' },
                    ].map(item => (
                      <div 
                        key={item.key} 
                        className={`flex items-center space-x-5 p-6 border transition-all duration-300 rounded-none ${formData.security_checklist[item.key] 
                          ? 'border-unswap-blue-deep bg-unswap-blue-deep/5 shadow-sm' 
                          : 'border-slate-100 bg-stone-50/30'
                        }`}
                      >
                        <Checkbox
                          id={item.key}
                          checked={formData.security_checklist[item.key]}
                          onCheckedChange={(checked) => handleSecurityChange(item.key, checked)}
                          className="rounded-none border-slate-300 data-[state=checked]:bg-unswap-blue-deep data-[state=checked]:border-unswap-blue-deep"
                        />
                        <Label htmlFor={item.key} className="cursor-pointer text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">{item.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="property-form-step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-6">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block pb-2 border-b border-slate-100">Swap Types Accepted</Label>
                  <div className="flex flex-wrap gap-3">
                    {['reciprocal', 'guestpoints', 'both'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleArrayItem('swap_types_accepted', type)}
                        className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${formData.swap_types_accepted.includes(type) 
                          ? 'bg-unswap-blue-deep border-unswap-blue-deep text-white shadow-md' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {type === 'reciprocal' ? 'Reciprocal Swaps' : type === 'guestpoints' ? 'GuestPoints' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Availability Type</Label>
                    <Select value={formData.availability_type} onValueChange={(v) => handleChange('availability_type', v)}>
                      <SelectTrigger className="h-14 rounded-none border-slate-200 bg-stone-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="short_term" className="rounded-none py-3">Short-term (1-14 days)</SelectItem>
                        <SelectItem value="long_term" className="rounded-none py-3">Long-term (6-12 months)</SelectItem>
                        <SelectItem value="both" className="rounded-none py-3">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Swap Preference</Label>
                    <Select value={formData.swap_preference} onValueChange={(v) => handleChange('swap_preference', v)}>
                      <SelectTrigger className="h-14 rounded-none border-slate-200 bg-stone-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="reciprocal_only" className="rounded-none py-3">Reciprocal Swaps Only</SelectItem>
                        <SelectItem value="guestpoints_only" className="rounded-none py-3">GuestPoints Only</SelectItem>
                        <SelectItem value="both" className="rounded-none py-3">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Minimum Stay</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        value={formData.minimum_stay}
                        onChange={(e) => handleChange('minimum_stay', parseInt(e.target.value) || 1)}
                        className="h-14 rounded-none border-slate-200 bg-white pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Nights</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Maximum Stay</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        value={formData.maximum_stay}
                        onChange={(e) => handleChange('maximum_stay', parseInt(e.target.value) || 30)}
                        className="h-14 rounded-none border-slate-200 bg-white pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Nights</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 bg-stone-50 p-10 border border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Available From</Label>
                    <Input
                      type="date"
                      value={formData.available_from}
                      onChange={(e) => handleChange('available_from', e.target.value)}
                      className="h-12 rounded-none border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Available To</Label>
                    <Input
                      type="date"
                      value={formData.available_to}
                      onChange={(e) => handleChange('available_to', e.target.value)}
                      className="h-12 rounded-none border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-16 pt-10 border-t border-slate-100">
            <div>
              {step > 1 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(step - 1)}
                  className="rounded-none h-14 px-8 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              {onCancel && (
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  className="rounded-none h-14 px-8 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </Button>
              )}

              {step < 5 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  className="rounded-none h-14 px-12 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg transition-all active:scale-95"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSubmit(true)} 
                    disabled={saving}
                    className="rounded-none h-14 px-8 text-[10px] font-bold uppercase tracking-[0.3em] border-slate-200 text-slate-500 hover:bg-stone-50 transition-colors"
                  >
                    Archive Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={saving || !formData.title || !formData.city || !formData.country}
                    className="rounded-none h-14 px-12 bg-unswap-blue-deep text-white hover:bg-slate-900 text-[10px] font-bold uppercase tracking-[0.4em] shadow-xl transition-all active:scale-95"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      property ? 'Confirm Updates' : 'Publish Listing'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}