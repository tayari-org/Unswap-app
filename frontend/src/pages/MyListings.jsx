import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Home, Eye, Heart, Edit, Trash2, MoreVertical, AlertCircle, CheckCircle, LayoutDashboard } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import PropertyForm from '../components/listings/PropertyForm';
import VerificationRequiredDialog from '../components/verification/VerificationRequiredDialog';
import PropertyVerificationReward from '../components/listings/PropertyVerificationReward';

export default function MyListings() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
  }, [user, isVerified, showVerificationDialog]);

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Structural Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-unswap-blue-deep/20" />
                <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[10px]">Properties</p>
              </div>
              <h1 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">My <span className="italic font-serif">Listings</span></h1>
              <p className="text-slate-500 text-sm font-light">Manage your properties and swap availability</p>
            </div>
            <Button
              onClick={handleAddProperty}
              className="bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-14 px-8 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-80 shrink-0">
            <nav className="flex flex-col gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'properties', label: 'Properties', icon: Home, badge: properties.length },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between w-full px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-l-2 ${activeTab === item.id
                    ? 'bg-white border-unswap-blue-deep text-unswap-blue-deep shadow-lg shadow-unswap-blue-deep/5'
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-unswap-blue-deep' : 'text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-unswap-blue-deep text-white text-[9px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-12"
                >
                  {/* Stats Grid - High Contrast */}
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Total Listings', value: properties.length, icon: Home },
                      { label: 'Active Listings', value: properties.filter(p => p.status === 'active').length, icon: CheckCircle },
                      { label: 'Total Views', value: properties.reduce((sum, p) => sum + (p.views_count || 0), 0), icon: Eye },
                      { label: 'Favorites', value: properties.reduce((sum, p) => sum + (p.favorites_count || 0), 0), icon: Heart },
                    ].map((stat, index) => (
                      <Card key={index} className="rounded-none border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 border-l-4 border-l-unswap-blue-deep/5 hover:border-l-unswap-blue-deep">
                        <CardContent className="p-8 flex items-center gap-6">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center transition-all duration-500 group-hover:bg-unswap-blue-deep group-hover:text-white">
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-extralight text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-white p-12 border border-slate-100 rounded-none border-l-4 border-l-unswap-blue-deep">
                    <h3 className="text-xl font-light tracking-tight text-slate-900 mb-4 italic font-serif">Properties Overview</h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed max-w-2xl">
                      Manage your property portfolio and track performance across your listings. View engagement metrics and manage the lifecycle of each property in your collection.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'properties' && (
                <motion.div
                  key="properties"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Properties List - Architectural Cards */}
                  {isLoading ? (
                    <div className="text-center py-20">
                      <div className="inline-block w-8 h-8 border-2 border-unswap-blue-deep/20 border-t-unswap-blue-deep rounded-full animate-spin" />
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Loading...</p>
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center mx-auto mb-8 border border-slate-100">
                        <Home className="w-8 h-8 text-slate-200" />
                      </div>
                      <h3 className="text-2xl font-light text-slate-900 tracking-tight mb-2">No properties yet</h3>
                      <p className="text-slate-500 text-sm font-light mb-8 max-w-sm mx-auto">List your first property to start swapping with colleagues</p>
                      <Button onClick={handleAddProperty} className="bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-14 px-10 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Property
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <AnimatePresence>
                        {properties.map((property, index) => (
                          <motion.div
                            key={property.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05, duration: 0.5 }}
                          >
                            <Card className="rounded-none border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                              <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row min-h-[220px]">
                                  {/* Image - Architectural Zoom */}
                                  <div className="w-full md:w-64 lg:w-80 h-48 md:h-auto flex-shrink-0 relative overflow-hidden">
                                    <img
                                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'}
                                      alt={property.title}
                                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500" />
                                  </div>

                                  {/* Content area */}
                                  <div className="flex-1 flex flex-col p-8 lg:p-10">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Badge className={`rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm ${statusColors[property.status]}`}>
                                            {property.status}
                                          </Badge>
                                          {property.is_verified && (
                                            <Badge className="rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-unswap-blue-deep/10 text-unswap-blue-deep border-unswap-blue-deep/20 border">Verified</Badge>
                                          )}
                                        </div>
                                        <h3 className="text-2xl font-light text-slate-900 tracking-tight leading-tight group-hover:text-unswap-blue-deep transition-colors duration-300">
                                          {property.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400">
                                          <p className="text-[10px] font-bold uppercase tracking-[0.1em]">{property.location}</p>
                                        </div>
                                      </div>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-10 w-10 p-0 rounded-none hover:bg-slate-100">
                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-slate-200 w-48 shadow-xl">
                                          <DropdownMenuItem onClick={() => handleEdit(property)} className="cursor-pointer py-3 rounded-none">
                                            <Edit className="w-3.5 h-3.5 mr-3 text-slate-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Edit</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleToggleStatus(property)} className="cursor-pointer py-3 rounded-none focus:bg-slate-50">
                                            {property.status === 'active' ? (
                                              <>
                                                <AlertCircle className="w-3.5 h-3.5 mr-3 text-amber-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Pause Listing</span>
                                              </>
                                            ) : (
                                              <>
                                                <CheckCircle className="w-3.5 h-3.5 mr-3 text-emerald-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Activate Listing</span>
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => setDeleteId(property.id)}
                                            className="text-red-600 cursor-pointer py-3 rounded-none focus:bg-rose-50"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 mr-3 text-red-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                                      <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-2 text-slate-500">
                                          <Eye className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest">{property.views_count || 0} views</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                          <Heart className="w-3.5 h-3.5 text-rose-300" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest">{property.favorites_count || 0} favorites</span>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-sm font-bold text-unswap-blue-deep tracking-wider">{property.smart_credit_value || 200}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1.5">pts / night</span>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Property Form Dialog - Architectural refinement */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border-0 shadow-2xl p-0">
          <div className="p-8 border-b bg-slate-50">
            <DialogTitle className="text-3xl font-extralight tracking-tighter text-slate-900">
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-light mt-1 uppercase tracking-widest">
              Provide the details of your property to list it on the platform.
            </DialogDescription>
          </div>
          <div className="p-8">
            <PropertyForm
              property={editingProperty}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingProperty(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation - High Contrast */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-none border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light tracking-tight">Delete Property</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-light pt-2">
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-none font-bold text-[10px] uppercase tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600 rounded-none font-bold text-[10px] uppercase tracking-widest text-white shadow-lg"
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