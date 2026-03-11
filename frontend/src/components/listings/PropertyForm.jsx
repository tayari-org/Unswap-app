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
    smart_credit_value: property?.smart_credit_value || 200,
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
    nightly_points: property?.nightly_points || property?.smart_credit_value || 200,
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
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.num}>
            <div
              className={`flex items-center cursor-pointer ${step >= s.num ? 'text-amber-600' : 'text-slate-400'}`}
              onClick={() => setStep(s.num)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s.num ? 'bg-amber-500 text-white' : 'bg-slate-200'
                }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className="ml-2 hidden sm:block text-sm font-medium">{s.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${step > s.num ? 'bg-amber-500' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="property-form-step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label>Property Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Cozy 2BR near UNOG Geneva"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your property..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Property Type *</Label>
                    <Select value={formData.property_type} onValueChange={(v) => handleChange('property_type', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g., Geneva"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g., Switzerland"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nearest Duty Station</Label>
                    <Select value={formData.nearest_duty_station} onValueChange={(v) => handleChange('nearest_duty_station', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                      <SelectContent>
                        {DUTY_STATIONS.map(station => (
                          <SelectItem key={station} value={station}>{station}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Distance/Commute Time</Label>
                    <Input
                      value={formData.distance_to_duty_station}
                      onChange={(e) => handleChange('distance_to_duty_station', e.target.value)}
                      placeholder="e.g., 15 min by tram"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Bedrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bedrooms}
                      onChange={(e) => handleChange('bedrooms', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Bathrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bathrooms}
                      onChange={(e) => handleChange('bathrooms', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Max Guests</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.max_guests}
                      onChange={(e) => handleChange('max_guests', parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>GuestPoints per Night</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.nightly_points}
                    onChange={(e) => handleChange('nightly_points', parseInt(e.target.value) || 0)}
                    className="mt-1 w-40"
                  />
                  <p className="text-sm text-slate-500 mt-1">Average is ~200 points/night</p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="property-form-step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label>Property Photos</Label>
                  <p className="text-sm text-slate-500 mb-4">Upload high-quality photos of your property</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">Upload Photos</span>
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
                className="space-y-6"
              >
                <div>
                  <Label className="mb-4 block">Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(amenity => (
                      <Badge
                        key={amenity}
                        variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
                        className={`cursor-pointer px-4 py-2 text-sm ${formData.amenities.includes(amenity) ? 'bg-amber-500 hover:bg-amber-600' : ''
                          }`}
                        onClick={() => toggleArrayItem('amenities', amenity)}
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-4 block">Mobility-Specific Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {MOBILITY_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={formData.mobility_tags.includes(tag) ? 'default' : 'outline'}
                        className={`cursor-pointer px-4 py-2 text-sm ${formData.mobility_tags.includes(tag) ? 'bg-slate-800 hover:bg-slate-700' : ''
                          }`}
                        onClick={() => toggleArrayItem('mobility_tags', tag)}
                      >
                        {tag}
                      </Badge>
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
                className="space-y-6"
              >
                <div>
                  <Label className="mb-2 block">Security Checklist</Label>
                  <p className="text-sm text-slate-500 mb-4">Help colleagues understand security features available</p>

                  <div className="space-y-4">
                    {[
                      { key: 'separate_workspace', label: 'Separate professional workspace available' },
                      { key: 'secure_wifi', label: 'Secure Wi-Fi network' },
                      { key: 'locked_storage', label: 'Locked closets/storage for sensitive materials' },
                      { key: 'building_security', label: 'Building security (doorman, cameras, etc.)' },
                      { key: 'safe_available', label: 'Safe available for documents/valuable' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                        <Checkbox
                          id={item.key}
                          checked={formData.security_checklist[item.key]}
                          onCheckedChange={(checked) => handleSecurityChange(item.key, checked)}
                        />
                        <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
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
                className="space-y-8"
              >
                <div>
                  <Label>Swap Types Accepted</Label>
                  <p className="text-sm text-slate-500 mb-4">What kind of swaps will you accept?</p>
                  <div className="flex flex-wrap gap-2">
                    {['reciprocal', 'guestpoints', 'both'].map(type => (
                      <Badge
                        key={type}
                        variant={formData.swap_types_accepted.includes(type) ? 'default' : 'outline'}
                        className={`cursor-pointer px-4 py-2 text-sm capitalize ${formData.swap_types_accepted.includes(type) ? 'bg-amber-500 hover:bg-amber-600' : ''
                          }`}
                        onClick={() => toggleArrayItem('swap_types_accepted', type)}
                      >
                        {type === 'reciprocal' ? 'Reciprocal Swaps' : type === 'guestpoints' ? 'GuestPoints' : 'Both'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label>Availability Type</Label>
                  <Select value={formData.availability_type} onValueChange={(v) => handleChange('availability_type', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short_term">Short-term (R&R, 1-14 days)</SelectItem>
                      <SelectItem value="long_term">Long-term (Rotations, 6-12 months)</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Stay (nights)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.minimum_stay}
                      onChange={(e) => handleChange('minimum_stay', parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Maximum Stay (nights)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maximum_stay}
                      onChange={(e) => handleChange('maximum_stay', parseInt(e.target.value) || 30)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Available From</Label>
                    <Input
                      type="date"
                      value={formData.available_from}
                      onChange={(e) => handleChange('available_from', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Available To</Label>
                    <Input
                      type="date"
                      value={formData.available_to}
                      onChange={(e) => handleChange('available_to', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Swap Preference</Label>
                  <Select value={formData.swap_preference} onValueChange={(v) => handleChange('swap_preference', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reciprocal_only">Reciprocal Swaps Only</SelectItem>
                      <SelectItem value="guestpoints_only">GuestPoints Only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
              )}

              {step < 5 ? (
                <Button onClick={() => setStep(step + 1)} className="bg-slate-900 hover:bg-slate-800">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={saving || !formData.title || !formData.city || !formData.country}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {property ? 'Update Property' : 'Publish Property'}
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