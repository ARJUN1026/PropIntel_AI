/**
 * Seed script: creates demo users, properties, leads, conversations,
 * site visits and activities. Run with `npm run seed` from server/.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Property } from '../src/models/Property.js';
import { Lead } from '../src/models/Lead.js';
import { Conversation } from '../src/models/Conversation.js';
import { SiteVisit } from '../src/models/SiteVisit.js';
import { Activity } from '../src/models/Activity.js';
import { SavedProperty } from '../src/models/SavedProperty.js';
import { computeLeadScore, temperatureFor } from '../src/services/lead/leadScoring.js';

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const CITIES: { city: string; localities: string[] }[] = [
  { city: 'Bangalore', localities: ['Whitefield', 'Electronic City', 'HSR Layout', 'Sarjapur', 'Hebbal'] },
  { city: 'Dehradun', localities: ['Rajpur Road', 'Sahastradhara', 'Clement Town', 'Vasant Vihar'] },
  { city: 'Delhi NCR', localities: ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj'] },
  { city: 'Noida', localities: ['Sector 128', 'Sector 150', 'Greater Noida West'] },
  { city: 'Gurgaon', localities: ['DLF Phase 3', 'Sohna Road', 'Golf Course Road'] },
  { city: 'Pune', localities: ['Baner', 'Hinjewadi', 'Kharadi'] },
  { city: 'Mumbai', localities: ['Andheri West', 'Powai', 'Thane West'] },
  { city: 'Hyderabad', localities: ['Gachibowli', 'Kondapur', 'Madhapur'] },
  { city: 'Chandigarh', localities: ['Zirakpur', 'Mohali', 'Panchkula'] },
];

const TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'VILLA', 'PLOT', 'OFFICE'] as const;
const AMENITIES = ['Gym', 'Swimming Pool', 'Parking', 'Covered Parking', 'Lift', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'Children Play Area'];
const DEVELOPERS = ['Green Valley Builders', 'Skyline Group', 'Metro Homes', 'Pristine Estates', 'Urban Nest'];
const SOURCES = ['WEBSITE', 'GOOGLE_ADS', 'META_ADS', 'INSTAGRAM', 'WHATSAPP', 'PHONE', 'REFERRAL', 'PROPERTY_PORTAL'] as const;
const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'NURTURE'] as const;
const TIMELINES = ['Within 3 months', '3-6 months', '6-12 months', 'Just exploring'];
const NAMES = ['Rahul Sharma', 'Priya Verma', 'Amit Patel', 'Neha Gupta', 'Rohit Singh', 'Sneha Joshi', 'Vikram Mehta', 'Ananya Rao', 'Karan Malhotra', 'Divya Nair', 'Arjun Reddy', 'Ishita Bose', 'Siddharth Khan', 'Meera Iyer', 'Aditya Rane', 'Pooja Desai'];

function priceFor(type: string, city: string): number {
  const cityFactor: Record<string, number> = { Bangalore: 1.0, Mumbai: 1.8, 'Delhi NCR': 1.2, Gurgaon: 1.15, Noida: 0.9, Pune: 0.85, Hyderabad: 0.9, Dehradun: 0.5, Chandigarh: 0.65 };
  const base: Record<string, number> = { '1BHK': 3_500_000, '2BHK': 6_500_000, '3BHK': 11_000_000, '4BHK': 18_000_000, VILLA: 25_000_000, PLOT: 8_000_000, OFFICE: 15_000_000 };
  const rent = type === 'OFFICE' ? 0.03 : 0.004;
  const isRent = Math.random() < 0.15;
  const value = base[type] * (cityFactor[city] ?? 1) * (0.8 + Math.random() * 0.5);
  return Math.round((isRent ? value * rent : value) / 10000) * 10000;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/propintel';
  await mongoose.connect(uri);
  console.log(`[seed] connected to ${uri}`);

  await Promise.all([
    User.deleteMany({}), Property.deleteMany({}), Lead.deleteMany({}),
    Conversation.deleteMany({}), SiteVisit.deleteMany({}), Activity.deleteMany({}), SavedProperty.deleteMany({}),
  ]);

  // ---- users ----
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const staffHash = await bcrypt.hash('Admin@123', 10);
  const customerHash = await bcrypt.hash('Customer@123', 10);

  const admin = await User.create({ name: 'Admin User', email: 'admin@propintel.ai', phone: '9000000001', passwordHash: adminHash, role: 'ADMIN' });

  const staffData = [
    { name: 'Amit Patel', email: 'amit@propintel.ai' },
    { name: 'Priya Sales', email: 'priya@propintel.ai' },
    { name: 'Rohit Singh', email: 'rohit@propintel.ai' },
    { name: 'Neha Gupta', email: 'neha@propintel.ai' },
  ];
  const agents = await User.create(staffData.map(a => ({ ...a, phone: `900000001${staffData.indexOf(a) + 1}`, passwordHash: staffHash, role: 'ADMIN' })));

  const customerData = [
    { name: 'Rahul Sharma', email: 'rahul@example.com' },
    { name: 'Priya Verma', email: 'priya.c@example.com' },
    { name: 'Sneha Joshi', email: 'sneha@example.com' },
    { name: 'Vikram Mehta', email: 'vikram@example.com' },
    { name: 'Ananya Rao', email: 'ananya@example.com' },
    { name: 'Karan Malhotra', email: 'karan@example.com' },
  ];
  const customers = await User.create(customerData.map(c => ({ ...c, phone: `981110000${customerData.indexOf(c) + 1}`, passwordHash: customerHash, role: 'CUSTOMER' })));

  // extra synthetic customers (lead-only, no login needed)
  const extraCustomers = await User.create(
    Array.from({ length: 60 }, (_, i) => ({
      name: randomItem(NAMES),
      email: `customer${i + 10}@example.com`,
      phone: `98${String(10000000 + i * 137).slice(0, 8)}`,
      passwordHash: customerHash,
      role: 'CUSTOMER',
    })),
  );
  const allCustomers = [...customers, ...extraCustomers];

  // ---- properties ----
  const properties = await Property.create(
    Array.from({ length: 140 }, () => {
      const cityInfo = randomItem(CITIES);
      const type = randomItem([...TYPES]);
      const bedroomMap: Record<string, number> = { '1BHK': 1, '2BHK': 2, '3BHK': 3, '4BHK': 4, VILLA: 4, PLOT: 0, OFFICE: 0 };
      const locality = randomItem(cityInfo.localities);
      const amenities = AMENITIES.filter(() => Math.random() < 0.45);
      if (Math.random() < 0.7 && !amenities.includes('Parking')) amenities.push('Parking');
      const isRent = Math.random() < 0.15;
      return {
        title: `${type === 'PLOT' ? 'Residential Plot' : `${type} Apartment`} in ${locality}`,
        description: `Well-planned ${type} in ${locality}, ${cityInfo.city}. Modern amenities, good connectivity and clear titles.`,
        propertyType: type,
        listingType: isRent ? 'RENT' : 'BUY',
        price: priceFor(type, cityInfo.city),
        city: cityInfo.city,
        locality,
        location: `${locality}, ${cityInfo.city}`,
        bedrooms: bedroomMap[type] ?? 0,
        bathrooms: Math.max(1, (bedroomMap[type] ?? 1) - (Math.random() < 0.3 ? 1 : 0)),
        carpetArea: type === 'PLOT' ? randomInt(600, 2400) : randomInt(450, 2200),
        parking: amenities.includes('Parking'),
        furnishing: randomItem(['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED']),
        amenities,
        images: [`https://picsum.photos/seed/propintel-${randomInt(1, 9999)}/800/500`],
        developer: randomItem(DEVELOPERS),
        possessionDate: randomItem(['Dec 2026', 'Mar 2027', 'Jun 2027', 'Dec 2027', 'Dec 2028', 'Ready to move']),
        status: Math.random() < 0.9 ? 'AVAILABLE' : randomItem(['RESERVED', 'SOLD', 'RENTED']),
        assignedAgent: randomItem(agents)._id,
      };
    }),
  );

  // ---- leads ----
  const leadCounter = { converted: 0 };
  const leads = [];
  for (let i = 0; i < 320; i++) {
    const customer = randomItem(allCustomers);
    const status = randomItem([...STATUSES, ...STATUSES, 'NEW', 'CONTACTED', 'QUALIFIED']); // weight active stages
    const type = randomItem([...TYPES]);
    const cityInfo = randomItem(CITIES);
    const hasBudget = Math.random() < 0.75;
    const budgetMax = hasBudget ? priceFor(type, cityInfo.city) : undefined;
    const hasLocations = Math.random() < 0.7;
    const draft = {
      customerId: customer._id,
      assignedAgent: Math.random() < 0.85 ? randomItem(agents)._id : undefined,
      name: customer.name,
      phone: customer.phone,
      source: randomItem([...SOURCES]),
      intent: randomItem(['BUY', 'BUY', 'BUY', 'RENT', 'INVEST']),
      propertyType: Math.random() < 0.8 ? type : '',
      preferredLocations: hasLocations ? [randomItem(cityInfo.localities)] : [],
      budgetMin: Math.random() < 0.2 ? Math.round((budgetMax ?? 5_000_000) * 0.7) : undefined,
      budgetMax,
      timeline: Math.random() < 0.6 ? randomItem(TIMELINES) : undefined,
      requirements: AMENITIES.filter(() => Math.random() < 0.3).slice(0, 3),
      status,
      engagementCount: randomInt(0, 8),
      interestedProperties: [randomItem(properties)._id],
    };
    const { score } = computeLeadScore(draft);
    leadCounter.converted += status === 'CONVERTED' ? 1 : 0;
    leads.push({
      ...draft,
      leadScore: score,
      leadTemperature: temperatureFor(score),
      lastContactedAt: new Date(Date.now() - randomInt(0, 30) * 86_400_000),
      nextFollowUpAt: ['FOLLOW_UP', 'QUALIFIED', 'SITE_VISIT'].includes(status) ? new Date(Date.now() - randomInt(-3, 5) * 86_400_000) : undefined,
    });
  }
  const leadDocs = await Lead.create(leads);

  // ---- conversations (grounded in lead requirements) ----
  for (const lead of leadDocs.slice(0, 60)) {
    const loc = lead.preferredLocations[0] ?? lead.propertyType ?? 'properties';
    const budget = lead.budgetMax ? `under ₹${(lead.budgetMax / 100000).toFixed(0)} lakh` : 'flexible budget';
    await Conversation.create({
      customerId: lead.customerId,
      agentId: lead.assignedAgent,
      leadId: lead._id,
      title: `${lead.propertyType || 'Property'} search`,
      detectedIntent: lead.intent,
      sentiment: randomItem(['POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE']),
      extractedRequirements: {
        propertyType: lead.propertyType || undefined,
        locations: lead.preferredLocations,
        budgetMax: lead.budgetMax,
        amenities: lead.requirements,
      },
      messages: [
        { senderType: 'CUSTOMER', content: `I need a ${lead.propertyType || 'property'} in ${loc} ${budget}.`, timestamp: new Date(Date.now() - 3 * 86_400_000) },
        { senderType: 'AI', content: `Great! I found several ${lead.propertyType || 'properties'} in ${loc} within your budget. ${lead.propertyType ? 'Would you like to see top matches with parking and other amenities?' : 'What is your budget?'}`, timestamp: new Date(Date.now() - 3 * 86_400_000 + 60_000) },
        { senderType: 'CUSTOMER', content: 'Yes, please share the details.', timestamp: new Date(Date.now() - 2 * 86_400_000) },
        { senderType: 'AI', content: 'Shared 4 top matches with match scores. Would you like to schedule a site visit?', timestamp: new Date(Date.now() - 2 * 86_400_000 + 60_000) },
      ],
      summary: {
        requirement: lead.propertyType || 'Property',
        budget: lead.budgetMax ? `₹${(lead.budgetMax / 100000).toFixed(0)}L` : 'Flexible',
        location: lead.preferredLocations[0] ?? '—',
        timeline: lead.timeline,
        preferences: lead.requirements,
        intent: lead.intent,
        nextAction: lead.leadScore >= 80 ? 'Schedule site visit' : 'Share property options',
      },
    });
  }

  // ---- site visits ----
  for (const lead of leadDocs.filter(l => l.status === 'SITE_VISIT').slice(0, 20)) {
    await SiteVisit.create({
      customerId: lead.customerId,
      leadId: lead._id,
      propertyId: lead.interestedProperties[0],
      agentId: lead.assignedAgent,
      date: new Date(Date.now() + randomInt(1, 14) * 86_400_000).toISOString().slice(0, 10),
      time: randomItem(['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM']),
      status: randomItem(['REQUESTED', 'CONFIRMED', 'CONFIRMED', 'COMPLETED']),
    });
  }

  // ---- saved properties ----
  for (const customer of customers) {
    for (const property of [randomItem(properties), randomItem(properties)]) {
      await SavedProperty.create({ customerId: customer._id, propertyId: property._id });
    }
  }

  // ---- activities ----
  await Activity.create({ type: 'LEAD_CREATED', actorId: admin._id, description: 'Seeded demo dataset' });

  console.log('[seed] done:');
  console.log(`  users: ${await User.countDocuments()} (admin/staff/customers)`);
  console.log(`  properties: ${await Property.countDocuments()}`);
  console.log(`  leads: ${await Lead.countDocuments()}`);
  console.log(`  conversations: ${await Conversation.countDocuments()}`);
  console.log(`  site visits: ${await SiteVisit.countDocuments()}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('[seed:fatal]', err);
  process.exit(1);
});
