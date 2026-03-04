import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Home, Eye, Heart, Edit, Trash2, MoreVertical, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import PropertyForm from '../components/listings/PropertyForm';
import VerificationRequiredDialog from '../components/verification/VerificationRequiredDialog';
import PropertyVerificationReward from '../components/listings/PropertyVerificationReward';

export default function MyListings() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const isAuth = await api.auth.isAuthenticated();
      if (!isAuth) {
        api.auth.redirectToLogin(window.location.pathname);
        return null;
      }
      return api.auth.me();
    },
  });

  const { data: verification } = useQuery({
    queryKey: ['user-verification', user?.email],
    queryFn: () => api.entities.Verification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const isVerified = user?.verification_status === 'verified' || user?.role === 'admin';

  // Check verification on page load
  React.useEffect(() => {
    if (user && !isVerified) {
      setShowVerificationDialog(true);
    }
  }, [user, isVerified]);

  const handleAddProperty = () => {
    if (!isVerified) {
      setShowVerificationDialog(true);
      return;
    }
    setEditingProperty(null);
    setShowForm(true);
  };

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['my-properties', user?.email],
    queryFn: () => api.entities.Property.filter({ owner_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Property.create({
      ...data,
      owner_id: user?.id,
      owner_email: user?.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-properties']);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-properties']);
      setShowForm(false);
      setEditingProperty(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-properties']);
      setDeleteId(null);
    },
  });

  const handleSubmit = async (data) => {
    if (editingProperty) {
      await updateMutation.mutateAsync({ id: editingProperty.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    archived: 'bg-red-100 text-red-700',
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleToggleStatus = async (property) => {
    const newStatus = property.status === 'active' ? 'paused' : 'active';
    await updateMutation.mutateAsync({ id: property.id, data: { status: newStatus } });
  };

  // Don't render content if not verified
  if (user && !isVerified && showVerificationDialog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <VerificationRequiredDialog 
          open={showVerificationDialog} 
          onOpenChange={(open) => {
            setShowVerificationDialog(open);
            if (!open) {
              window.history.back();
            }
          }}
          action="access My Listings"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">My Listings</h1>
              <p className="text-slate-600">Manage your properties and swap availability</p>
            </div>
            <Button 
              onClick={handleAddProperty}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Property
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Listings', value: properties.length, icon: Home },
            { label: 'Active', value: properties.filter(p => p.status === 'active').length, icon: CheckCircle },
            { label: 'Total Views', value: properties.reduce((sum, p) => sum + (p.views_count || 0), 0), icon: Eye },
            { label: 'Favorites', value: properties.reduce((sum, p) => sum + (p.favorites_count || 0), 0), icon: Heart },
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Properties List */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties yet</h3>
            <p className="text-slate-600 mb-6">List your first property to start swapping with colleagues</p>
            <Button onClick={handleAddProperty} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Property
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusColors[property.status]}>
                                  {property.status}
                                </Badge>
                                {property.is_verified && (
                                  <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {property.title}
                              </h3>
                              <p className="text-slate-500 text-sm">{property.location}</p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(property)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(property)}>
                                  {property.status === 'active' ? (
                                    <>
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Pause Listing
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Activate Listing
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteId(property.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{property.views_count || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              <span>{property.favorites_count || 0} favorites</span>
                            </div>
                            <div>
                              <span className="font-semibold text-amber-600">{property.smart_credit_value || 200}</span> pts/night
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Property Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          </DialogHeader>
          <PropertyForm
            property={editingProperty}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingProperty(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Required Dialog */}
      <VerificationRequiredDialog 
        open={showVerificationDialog} 
        onOpenChange={setShowVerificationDialog}
        action="list a property"
      />

      {/* Handle referral rewards for verified properties */}
      {properties?.filter(p => p.is_verified).map(property => (
        <PropertyVerificationReward
          key={property.id}
          propertyId={property.id}
          ownerEmail={user?.email}
        />
      ))}
    </div>
  );
}