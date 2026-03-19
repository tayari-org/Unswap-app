/**
 * Seed script: Insert 3 demo properties for qasim@jacquelinetsuma.com
 * Run from the backend directory:
 *   node scripts/seed-properties.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OWNER_EMAIL = 'qasim@jacquelinetsuma.com';

const properties = [
  {
    owner_email: OWNER_EMAIL,
    title: 'Executive Apartment — Geneva Champel District',
    description:
      'A refined 2-bedroom apartment in the prestigious Champel neighbourhood, minutes from UNOG and WHO headquarters. Bright south-facing living room, fully equipped kitchen, high-speed encrypted Wi-Fi, and a dedicated home-office space ideal for remote diplomatic work. Building has 24/7 concierge and secure underground parking.',
    property_type: 'apartment',
    status: 'active',
    is_featured: true,
    city: 'Geneva',
    country: 'Switzerland',
    address: 'Rue de Contamines 12, 1206 Geneva',
    nearest_duty_station: 'UNOG Geneva',
    distance_to_duty_station: '12 min by tram (Tram 5)',
    host_phone: '+41 22 000 1111',
    handoff_method: 'concierge',
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    nightly_points: 220,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Heating', 'Kitchen', 'Washer', 'Parking', 'Elevator', 'Balcony']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80',
    ]),
    mobility_tags: JSON.stringify(['Mission-Ready', 'Home Office', 'Secure Building', 'Near Public Transit']),
    security_checklist: JSON.stringify({
      separate_workspace: true,
      secure_wifi: true,
      locked_storage: true,
      building_security: true,
      safe_available: false,
    }),
    availability_type: 'both',
    minimum_stay: 7,
    maximum_stay: 90,
    available_from: '2026-04-01',
    available_to: '2026-12-31',
    swap_preference: 'both',
    swap_types_accepted: JSON.stringify(['reciprocal', 'guestpoints']),
    average_rating: 4.8,
    total_reviews: 6,
    total_swaps: 4,
  },
  {
    owner_email: OWNER_EMAIL,
    title: 'Diplomatic Villa — Nairobi Karen Estate',
    description:
      'A spacious 3-bedroom villa set within a landscaped and gated compound in Karen, Nairobi — a preferred residential area for UN, UNEP, and UN-Habitat staff at UNON. Features a private pool, garden, domestic staff quarters, and reliable satellite internet with power backup. Ideal for families on medium to long-term rotational assignments.',
    property_type: 'villa',
    status: 'active',
    is_featured: false,
    city: 'Nairobi',
    country: 'Kenya',
    address: '14 Karen Close, Karen, Nairobi',
    nearest_duty_station: 'UNON Nairobi',
    distance_to_duty_station: '20 min by car via Ngong Road',
    host_phone: '+254 700 111 222',
    handoff_method: 'in_person',
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    nightly_points: 180,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Kitchen', 'Washer', 'Dryer', 'Parking', 'Pool', 'Garden', 'Pet Friendly']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    ]),
    mobility_tags: JSON.stringify(['Mission-Ready', 'Pet Care Included', 'Plant Care Included', 'Family Friendly', 'Secure Building']),
    security_checklist: JSON.stringify({
      separate_workspace: true,
      secure_wifi: true,
      locked_storage: true,
      building_security: true,
      safe_available: true,
    }),
    availability_type: 'long_term',
    minimum_stay: 30,
    maximum_stay: 365,
    available_from: '2026-05-01',
    available_to: '2027-04-30',
    swap_preference: 'reciprocal_only',
    swap_types_accepted: JSON.stringify(['reciprocal']),
    average_rating: 4.6,
    total_reviews: 3,
    total_swaps: 2,
  },
  {
    owner_email: OWNER_EMAIL,
    title: 'Modern 1-Bedroom — Vienna 1st District',
    description:
      'A sleek and well-appointed one-bedroom apartment in Vienna\'s historic first district, walking distance from UNOV, IAEA, and CTBTO headquarters. Fully furnished with a modern open-plan kitchen, high-speed internet, and access to a building gym. Perfect for solo diplomats or couples on short-term assignments.',
    property_type: 'apartment',
    status: 'active',
    is_featured: false,
    city: 'Vienna',
    country: 'Austria',
    address: 'Rathausstraße 8, 1010 Vienna',
    nearest_duty_station: 'UNOV Vienna',
    distance_to_duty_station: '8 min walk to VIC (Vienna International Centre)',
    host_phone: '+43 1 000 2222',
    handoff_method: 'lockbox',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    nightly_points: 150,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Heating', 'Kitchen', 'Washer', 'Gym', 'Elevator']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    ]),
    mobility_tags: JSON.stringify(['Mission-Ready', 'Home Office', 'Near Public Transit']),
    security_checklist: JSON.stringify({
      separate_workspace: false,
      secure_wifi: true,
      locked_storage: true,
      building_security: false,
      safe_available: false,
    }),
    availability_type: 'short_term',
    minimum_stay: 5,
    maximum_stay: 60,
    available_from: '2026-04-15',
    available_to: '2026-10-31',
    swap_preference: 'both',
    swap_types_accepted: JSON.stringify(['reciprocal', 'guestpoints']),
    average_rating: 4.9,
    total_reviews: 8,
    total_swaps: 6,
  },
];

async function main() {
  console.log(`\n🌱 Seeding 3 properties for ${OWNER_EMAIL}...\n`);

  for (const prop of properties) {
    const created = await prisma.property.create({ data: prop });
    console.log(`  ✅ Created: "${created.title}" (${created.city}, ${created.country}) — ID: ${created.id}`);
  }

  console.log('\n✨ Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
