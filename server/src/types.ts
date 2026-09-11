import type {
  Furnishing,
  Intent,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  ListingType,
  PropertyStatus,
  PropertyType,
  Role,
  Sentiment,
  SiteVisitStatus,
} from './config/constants.js';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDoc {
  _id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number; // stored in whole rupees
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
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDoc {
  _id: string;
  customerId: string;
  assignedAgent?: string;
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
  interestedProperties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDoc {
  _id: string;
  customerId: string;
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
  extractedRequirements: {
    propertyType?: PropertyType | '';
    locations: string[];
    budgetMax?: number;
    budgetMin?: number;
    amenities: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageDoc {
  _id: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI';
  senderId?: string;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface SavedPropertyDoc {
  _id: string;
  customerId: string;
  propertyId: string;
  createdAt: string;
}

export interface SiteVisitDoc {
  _id: string;
  customerId: string;
  leadId?: string;
  propertyId: string;
  agentId?: string;
  date: string;
  time: string;
  status: SiteVisitStatus;
  notes?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDoc {
  _id: string;
  type: string;
  actorId?: string;
  customerId?: string;
  leadId?: string;
  propertyId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
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
  furnishing?: Furnishing;
  parking?: boolean;
  confidence: number;
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

export interface AuthResponse {
  token: string;
  user: UserDoc;
}
