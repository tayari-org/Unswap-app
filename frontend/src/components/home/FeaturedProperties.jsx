import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bed, Bath, Users, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeaturedProperties({ properties = [] }) {
  const displayProperties = properties.length > 0 ? properties.slice(0, 3) : [
    {
      id: 1,
      title: "Lakeside Diplomatic Suite",
      location: "Geneva, Switzerland",
      nearest_duty_station: "UNOG (Palais des Nations)",
      nightly_points: 450,
      bedrooms: 2,
      bathrooms: 2,
      max_guests: 4,
      is_verified: true,
      images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"]
    },
    {
      id: 2,
      title: "Manhattan Mission Penthouse",
      location: "New York, USA",
      nearest_duty_station: "UNHQ",
      nightly_points: 620,
      bedrooms: 3,
      bathrooms: 3,
      max_guests: 6,
      is_verified: true,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"]
    },
    {
      id: 3,
      title: "Gigiri Secure Residence",
      location: "Nairobi, Kenya",
      nearest_duty_station: "UNON",
      nightly_points: 380,
      bedrooms: 4,
      bathrooms: 4,
      max_guests: 8,
      is_verified: true,
      images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"]
    }
  ];

  return (
    <section className="py-16 px-6 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-slate-100" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <p className="text-indigo-600 font-bold tracking-[0.3em] uppercase text-xs">The Anchor Collection</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-extralight text-slate-900 tracking-tighter">
              Featured <span className="italic font-serif text-slate-800">Residences</span>
            </h2>
            <p className="text-slate-500 mt-2 max-w-lg font-light leading-relaxed text-sm">
              Vetted accommodations for frequent geographical rotation, located within 15 minutes of primary duty stations.
            </p>
          </div>

          <Link to={createPageUrl('FindProperties')}>
            <Button variant="outline" size="sm" className="text-slate-900 border-slate-200 hover:bg-slate-50 group px-6">
              Explore Full Directory
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {displayProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group cursor-pointer"
            >
              <Link to={createPageUrl('PropertyDetails') + `?id=${property.id}`}>
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-100 mb-4 bg-slate-50 shadow-sm transition-shadow hover:shadow-xl">
                  <img
                    src={property.images?.[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Credits Tag */}
                  <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-xl shadow-sm">
                    <span className="text-slate-900 font-bold text-base">{property.nightly_points}</span>
                    <span className="text-slate-500 text-[9px] ml-1 uppercase tracking-widest">Credits</span>
                  </div>

                  {/* Verification Badge */}
                  {property.is_verified && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-lg">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Vault Verified</span>
                    </div>
                  )}

                  {/* Bottom Info on Image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center text-indigo-300 text-[9px] font-bold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                      <MapPin className="w-2.5 h-2.5 mr-1" />
                      {property.nearest_duty_station}
                    </div>
                    <h3 className="text-lg font-medium text-white transition-colors truncate">
                      {property.title}
                    </h3>
                  </div>
                </div>

                {/* Property Specs */}
                <div className="grid grid-cols-3 py-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Bed className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-medium uppercase tracking-tighter">{property.bedrooms} BR</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 border-x border-slate-100 justify-center">
                    <Bath className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-medium uppercase tracking-tighter">{property.bathrooms} BA</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 justify-end">
                    <Users className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-medium uppercase tracking-tighter">{property.max_guests} Guests</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}