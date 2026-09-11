export type Role = 'CUSTOMER' | 'ADMIN';
export type PropertyStatus = 'DRAFT' | 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'UNAVAILABLE' | 'ARCHIVED';
export type PropertyType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'PLOT' | 'VILLA' | 'OFFICE';
export type ListingType = 'BUY' | 'RENT';
export type Furnishing = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'FOLLOW_UP' | 'SITE_VISIT' | 'NEGOTIATION' | 'CONVERTED' | 'LOST' | 'NURTURE';
export type LeadTemperature = 'HOT' | 'WARM' | 'NURTURE' | 'COLD';
export type Intent = 'BUY' | 'RENT' | 'SELL' | 'INVEST' | 'INFORMATION' | 'PRICE_QUERY' | 'SITE_VISIT' | 'FINANCING' | 'PROPERTY_COMPARISON' | 'FOLLOW_UP';
export type LeadSource = 'WEBSITE' | 'GOOGLE_ADS' | 'META_ADS' | 'INSTAGRAM' | 'WHATSAPP' | 'PHONE' | 'REFERRAL' | 'PROPERTY_PORTAL' | 'OTHER';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type SiteVisitStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface PropertyDoc {
  _id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  city: string;
  locality: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  bedrooms: number;
  bathrooms: number;
  carpetArea: number;
  builtUpArea?: number;
  parking: boolean;
  furnishing: Furnishing;
  amenities: string[];
  images: string[];
  developer?: string;
  possessionDate?: string;
  status: PropertyStatus;
  assignedAgent?: { _id: string; name: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResultDoc {
  property: PropertyDoc;
  matchScore: number;
  reasons: string[];
}

export interface ExtractedCriteria {
  intent: Intent;
  propertyType?: PropertyType | '';
  locations: string[];
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  bedrooms?: number;
  amenities: string[];
  parking?: boolean;
  furnishing?: Furnishing;
  confidence: number;
}

export interface LeadDoc {
  _id: string;
  customerId: { _id: string; name: string; email: string; phone: string } | string;
  assignedAgent?: { _id: string; name: string; email?: string } | string;
  name: string;
  phone?: string;
  source: LeadSource;
  intent: Intent;
  propertyType?: PropertyType | '';
  preferredLocations: string[];
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  requirements: string[];
  leadScore: number;
  leadTemperature: LeadTemperature;
  status: LeadStatus;
  engagementCount: number;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  sentiment: Sentiment;
  interestedProperties: (Pick<PropertyDoc, '_id' | 'title' | 'price' | 'locality' | 'city'> | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageDoc {
  _id?: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI';
  senderId?: string;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ConversationDoc {
  _id: string;
  customerId: string | { _id: string; name: string };
  agentId?: string;
  leadId?: string;
  title: string;
  messages: MessageDoc[];
  summary?: {
    requirement?: string;
    budget?: string;
    location?: string;
    timeline?: string;
    preferences: string[];
    intent?: Intent;
    nextAction?: string;
  };
  detectedIntent?: Intent;
  sentiment: Sentiment;
  extractedRequirements?: {
    propertyType?: PropertyType;
    locations: string[];
    budgetMax?: number;
    budgetMin?: number;
    amenities: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface SiteVisitDoc {
  _id: string;
  customerId: { _id: string; name: string; phone?: string; email?: string } | string;
  leadId?: string;
  propertyId: Pick<PropertyDoc, '_id' | 'title' | 'locality' | 'city' | 'images' | 'price'> | string;
  agentId?: string | { _id: string; name: string };
  date: string;
  time: string;
  status: SiteVisitStatus;
  notes?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatReply {
  reply: string;
  conversationId: string;
  extracted: ExtractedCriteria;
  leadCaptured: boolean;
  leadId?: string;
  suggestions: string[];
  results?: SearchResultDoc[];
}

export interface ScoreBreakdown {
  score: number;
  reasons: string[];
}

export interface LeadPriorities {
  buckets: { HIGH: LeadDoc[]; MEDIUM: LeadDoc[]; LOW: LeadDoc[] };
}

export interface OverviewStats {
  properties: number;
  customers: number;
  agents: number;
  leads: number;
  hotLeads: number;
  visits: number;
  conversions: number;
  conversionRate: number;
}
