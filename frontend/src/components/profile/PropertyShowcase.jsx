import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Eye, Heart, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PropertyShowcase({ properties = [] }) {
    if (!properties.length) {
        return (
            <div className="text-center py-8 text-slate-400">
                <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No properties listed yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {properties.map((property) => (
                <Link key={property.id} to={createPageUrl(`PropertyDetails?id=${property.id}`)}>
                    <div className="rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="relative h-36">
                            <img
                                src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                                <Badge className={
                                    property.status === 'active' ? 'bg-emerald-500 text-white' :
                                        property.status === 'paused' ? 'bg-amber-500 text-white' :
                                            'bg-slate-500 text-white'
                                }>
                                    {property.status}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-3">
                            <p className="font-semibold text-slate-900 text-sm truncate">{property.title}</p>
                            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                                <MapPin className="w-3 h-3" />
                                {property.location}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {property.views_count || 0}</span>
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {property.favorites_count || 0}</span>
                                <span className="font-semibold text-amber-600">{property.smart_credit_value || 200} pts/night</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
