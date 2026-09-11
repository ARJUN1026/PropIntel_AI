# PropIntel AI

## AI-Powered Real Estate Sales, Property Intelligence & Lead Management Platform

**Version:** 1.0
**Status:** Full Product Specification
**Project Type:** AI-Powered SaaS / Real Estate Technology Platform
**Primary Focus:** Generative AI, RAG, AI Agents, Property Recommendation, CRM, Lead Intelligence and Analytics

---

# 1. Product Overview

PropIntel AI is an AI-powered real estate platform designed to simplify property discovery for customers and improve lead management, sales productivity and business intelligence for real estate companies.

The platform combines:

* AI conversational property search
* Personalized property recommendations
* RAG-based property knowledge
* AI lead capture
* AI lead scoring
* AI intent detection
* AI conversation summarization
* AI follow-up generation
* AI Sales Copilot
* Property comparison
* Site visit management
* Real estate CRM
* Property management
* Campaign analytics
* Property demand intelligence
* Customer sentiment analysis
* Duplicate lead detection
* AI-generated property descriptions
* Real estate business analytics

The system serves three primary users:

1. Customer / Buyer
2. Real Estate Agent
3. Admin / Sales Manager

---

# 2. Problem Statement

Traditional real estate businesses often manage properties, customers, leads, conversations and follow-ups across disconnected systems.

Customers have difficulty finding properties that actually match their requirements because traditional property search depends heavily on filters and manual browsing.

Sales agents receive leads from multiple channels but often have to manually qualify, prioritize and follow up with them.

Real estate companies also lack centralized intelligence about:

* Which leads are high-intent
* Which properties are most demanded
* Which marketing channels generate quality leads
* Which customers need follow-up
* Which agents are performing well
* Why leads fail to convert
* What customers are actually looking for

PropIntel AI solves these problems by providing an intelligent platform that understands natural-language customer requirements, recommends relevant properties, retrieves verified information from property documents, scores and prioritizes leads, assists sales agents, automates repetitive workflows and provides business intelligence through analytics.

---

# 3. Business Objectives

The primary objectives are:

* Improve property discovery
* Reduce customer search time
* Improve lead qualification
* Prioritize high-intent customers
* Reduce missed follow-ups
* Improve agent productivity
* Centralize customer interactions
* Improve property recommendation quality
* Provide trustworthy property information
* Improve site-visit conversion
* Provide actionable sales intelligence
* Identify property demand trends
* Improve marketing ROI
* Reduce duplicate leads
* Automate repetitive sales tasks

---

# 4. Target Users

## 4.1 Customer

Customers looking to:

* Buy property
* Rent property
* Sell property
* Invest in property
* Compare properties
* Schedule site visits
* Ask property-related questions

---

## 4.2 Real Estate Agent

Agents use the system to:

* Manage leads
* Contact customers
* View customer requirements
* Prioritize leads
* Track follow-ups
* Schedule site visits
* Manage conversations
* Use AI-generated responses
* Get AI recommendations
* Track sales activities

---

## 4.3 Admin / Sales Manager

Administrators manage:

* Properties
* Agents
* Customers
* Leads
* Documents
* Campaigns
* Analytics
* AI knowledge base
* System configuration

---

# 5. Product Scope

The platform consists of the following major modules:

```text
PropIntel AI
│
├── Authentication & Authorization
│
├── Customer Platform
│   ├── AI Property Search
│   ├── Property Discovery
│   ├── Recommendations
│   ├── Property Comparison
│   ├── Saved Properties
│   ├── AI Assistant
│   ├── Inquiries
│   └── Site Visits
│
├── AI Engine
│   ├── LLM
│   ├── Intent Detection
│   ├── Entity Extraction
│   ├── Property Matching
│   ├── Lead Scoring
│   ├── Conversation Summary
│   ├── Sentiment Analysis
│   ├── Follow-up Generation
│   └── AI Sales Copilot
│
├── RAG Knowledge System
│   ├── Document Upload
│   ├── PDF Processing
│   ├── Chunking
│   ├── Embeddings
│   ├── Vector Search
│   └── Source-based Answers
│
├── Agent CRM
│   ├── Leads
│   ├── Customers
│   ├── Conversations
│   ├── Follow-ups
│   ├── Site Visits
│   └── AI Copilot
│
├── Admin
│   ├── Properties
│   ├── Agents
│   ├── Leads
│   ├── Documents
│   ├── Campaigns
│   └── System Management
│
└── Analytics
    ├── Lead Analytics
    ├── Sales Analytics
    ├── Campaign Analytics
    ├── Property Demand
    ├── Agent Performance
    └── AI Insights
```

---

# 6. Authentication & Authorization

## 6.1 Registration

Users can register using:

* Name
* Email
* Phone
* Password
* Account type

Supported roles:

```text
CUSTOMER
AGENT
ADMIN
```

---

## 6.2 Login

Users can log in using:

* Email
* Password

Authentication uses:

* JWT
* Password hashing using bcrypt
* Protected API routes
* Role-based authorization

---

## 6.3 Role-Based Access

### Customer

Can access:

* Properties
* Search
* Recommendations
* AI Assistant
* Saved properties
* Comparisons
* Inquiries
* Site visits

### Agent

Can access:

* Leads
* Customers
* Conversations
* Follow-ups
* Properties
* Site visits
* AI Sales Copilot

### Admin

Can access:

* Entire platform
* Properties
* Agents
* Customers
* Leads
* Documents
* Campaigns
* Analytics
* AI configuration

---

# 7. Customer Module

## 7.1 Customer Dashboard

Dashboard displays:

* Personalized recommendations
* Recent searches
* Saved properties
* Upcoming site visits
* Recent conversations
* Recommended actions

Example:

```text
Welcome back, Rahul

Recommended for you
-------------------
Property A     94% Match
Property B     91% Match
Property C     88% Match

Upcoming Site Visit
-------------------
Green Valley
15 September
11:00 AM
```

---

# 8. AI Property Search

This is one of the core features.

Customers can search using natural language.

Example:

> "I need a 3BHK in Bangalore under ₹1.2 crore near Whitefield with parking and a gym."

The AI extracts:

```text
Property Type: 3BHK
Location: Whitefield
City: Bangalore
Maximum Budget: ₹1.2 Cr
Parking: Required
Gym: Preferred
Intent: BUY
```

The system converts natural language into structured search criteria.

---

## 8.1 Supported Search Parameters

* City
* Locality
* Property type
* Bedrooms
* Bathrooms
* Minimum area
* Maximum area
* Minimum price
* Maximum price
* Amenities
* Furnishing
* Parking
* Property status
* Purchase/rental intent
* Investment preference

---

# 9. AI Intent Detection

The system detects customer intent.

Supported intents:

```text
BUY
RENT
SELL
INVEST
INFORMATION
PRICE_QUERY
SITE_VISIT
FINANCING
PROPERTY_COMPARISON
FOLLOW_UP
```

Example:

> "I want to rent a 2BHK near Rajpur Road."

AI output:

```json
{
  "intent": "RENT",
  "propertyType": "2BHK",
  "location": "Rajpur Road"
}
```

---

# 10. Entity Extraction

The AI extracts useful entities from conversations.

Example:

> "I need a 3BHK around 90 lakh in Dehradun with parking."

Extracted:

```text
Property Type → 3BHK
Budget → ₹90,00,000
Location → Dehradun
Amenity → Parking
```

The extracted information is stored against the customer profile and lead.

---

# 11. Property Recommendation Engine

The recommendation engine ranks properties based on customer requirements.

Example:

```text
Customer Requirements
        ↓
Candidate Properties
        ↓
Filtering
        ↓
Feature Matching
        ↓
AI / Scoring Engine
        ↓
Ranked Properties
```

---

## 11.1 Match Score

Each property receives a match score.

Example:

```text
Property A

Budget compatibility      25/25
Location                  24/25
Property type             20/20
Amenities                 13/15
Size                      10/10
--------------------------------
Total                     92/100
```

Displayed as:

**92% Match**

---

## 11.2 Recommendation Explanation

The system should explain recommendations.

Example:

> "This property is highly suitable because it is within your budget, located in your preferred area, has parking and a gym, and matches your requested 3BHK configuration."

---

# 12. AI Real Estate Assistant

The platform includes a conversational AI assistant.

Customers can ask:

* "Show me 2BHK properties under ₹80 lakh."
* "Which property is closest to the metro?"
* "Does this property have covered parking?"
* "What is the possession date?"
* "Show me similar properties."
* "Compare these properties."
* "Schedule a site visit."

The assistant maintains conversation context.

---

# 13. Conversation Memory

The AI should maintain relevant conversation state.

Example:

```text
Customer:
I need a 2BHK.

AI:
Which location?

Customer:
Whitefield.

AI:
What's your budget?

Customer:
80 lakh.
```

The system remembers:

```text
Property Type: 2BHK
Location: Whitefield
Budget: ₹80L
```

The information can be reused for future recommendations.

---

# 14. RAG Property Knowledge System

The RAG system allows the AI to answer questions using property-specific documents.

Supported documents:

* Property brochures
* Floor plans
* Pricing documents
* Amenities documents
* Payment plans
* FAQs
* Location guides
* Possession information
* Project specifications
* Other authorized property documents

---

# 15. RAG Processing Pipeline

```text
Document Upload
      ↓
PDF/Text Extraction
      ↓
Cleaning
      ↓
Chunking
      ↓
Embedding Generation
      ↓
Vector Database
      ↓
Semantic Search
      ↓
Relevant Chunks
      ↓
LLM
      ↓
Grounded Answer
```

---

# 16. Document Chunking

Documents should be split into manageable chunks.

Recommended initial configuration:

```text
Chunk Size: ~500–800 tokens
Overlap: ~50–100 tokens
```

Configuration should remain adjustable.

Each chunk stores:

```text
documentId
propertyId
chunkText
embedding
pageNumber
metadata
```

---

# 17. RAG Question Answering

Customer:

> "What is the possession date?"

System:

```text
Question
   ↓
Embedding
   ↓
Vector Search
   ↓
Relevant Property Document
   ↓
Relevant Page/Chunk
   ↓
LLM
   ↓
Answer
```

The UI should show:

```text
Answer

Expected possession is December 2028.

Source:
Project X Brochure
Page 8
```

The AI should avoid inventing information that is not present in the knowledge base.

---

# 18. Property Comparison

Customers can compare multiple properties.

Comparison fields:

* Price
* Property type
* Bedrooms
* Bathrooms
* Carpet area
* Built-up area
* Location
* Parking
* Amenities
* Furnishing
* Possession
* Developer
* Match score

Example:

```text
                    Property A   Property B   Property C

Price               ₹75L         ₹82L         ₹79L
Type                2BHK         2BHK         2BHK
Area                1150 sqft    1250 sqft    1180 sqft
Parking             Yes          Yes          No
Gym                 Yes          Yes          Yes
Location Score      9/10         8/10         9/10
AI Match            94%          88%          85%
```

The AI provides a comparison summary.

---

# 19. Saved Properties

Customers can:

* Save property
* Remove property
* View saved properties
* Organize saved properties
* Compare saved properties

---

# 20. Property Inquiry

Customers can submit:

* General inquiry
* Price inquiry
* Availability inquiry
* Property-specific inquiry
* Financing inquiry
* Site visit request

Every inquiry can create or update a lead.

---

# 21. AI Lead Capture

The platform automatically converts relevant customer interactions into leads.

Example:

```text
Customer:
I want a 3BHK in Noida.

AI:
What's your budget?

Customer:
Around ₹1 crore.

AI:
When do you plan to purchase?

Customer:
Within 3 months.
```

Lead created:

```text
Customer: Rahul
Intent: BUY
Property Type: 3BHK
Location: Noida
Budget: ₹1 Cr
Timeline: 3 Months
```

---

# 22. Lead Management

Lead statuses:

```text
NEW
CONTACTED
QUALIFIED
FOLLOW_UP
SITE_VISIT
NEGOTIATION
CONVERTED
LOST
NURTURE
```

---

# 23. AI Lead Scoring

Every lead receives an AI-assisted score.

Example:

```text
Budget confirmed          +20
Location confirmed        +15
Property type confirmed   +15
Purchase timeline         +20
Site visit requested      +20
Engagement                +10
--------------------------------
Total                     100
```

Lead classification:

```text
80–100 → HOT
60–79  → WARM
40–59  → NURTURE
0–39   → COLD
```

---

# 24. AI Lead Explanation

The system should explain why a lead received its score.

Example:

```text
Lead Score: 91/100
Status: HOT

Reasons:

✓ Budget confirmed
✓ Purchase timeline under 3 months
✓ Preferred location confirmed
✓ Requested property details
✓ Requested site visit

Recommended Action:
Contact customer immediately.
```

---

# 25. AI Lead Prioritization

Agents should see leads ranked by priority.

Example:

```text
HIGH PRIORITY

1. Rahul — 92
   Site visit requested

2. Priya — 88
   Budget confirmed

3. Amit — 84
   Viewed 5 properties

MEDIUM PRIORITY

4. Neha — 68
5. Rohit — 63
```

---

# 26. Duplicate Lead Detection

The system detects potential duplicate leads using:

* Phone number
* Email
* Name similarity
* Property interest
* Conversation similarity

Example:

```text
Lead A
Rahul Sharma
987XXXXXXX

Lead B
Rahul S.
987XXXXXXX

Potential Duplicate: 96%
```

Agent can:

```text
Merge
Keep Separate
Dismiss
```

---

# 27. Agent CRM

Agent dashboard includes:

```text
Dashboard
Leads
Customers
Properties
Conversations
Follow-ups
Site Visits
Tasks
AI Sales Copilot
```

---

# 28. Customer Profile for Agents

Agents can see:

```text
Customer
-------------------------
Name
Phone
Email
Intent
Budget
Location
Property Type
Purchase Timeline
Preferred Amenities
Lead Score
Lead Source
Conversation History
Saved Properties
Site Visits
Last Contact
Next Follow-up
```

---

# 29. Conversation History

Agents can view:

* Customer messages
* Agent messages
* AI messages
* Timestamp
* Property discussed
* Customer intent
* Lead changes

---

# 30. AI Conversation Summarization

Long conversations are automatically summarized.

Example:

```text
CUSTOMER SUMMARY

Requirement:
3BHK

Budget:
₹1.2 Cr

Location:
Whitefield

Timeline:
1–3 months

Preferences:
✓ Parking
✓ Gym
✓ Near IT park

Customer Intent:
HIGH

Next Recommended Action:
Schedule site visit.
```

---

# 31. AI Sentiment Analysis

The platform analyzes customer conversations.

Possible classifications:

```text
POSITIVE
NEUTRAL
NEGATIVE
```

Example:

```text
Customer Sentiment

Positive     72%
Neutral      20%
Negative      8%
```

If negative sentiment is detected:

```text
⚠ Customer dissatisfaction detected

Reason:
Delayed response
```

Admin/agent can intervene.

---

# 32. AI Follow-Up Assistant

The system detects leads requiring follow-up.

Example:

```text
Lead: Priya
Status: WARM
Last Contact: 3 days ago
Recommended Action: Follow up today
```

AI generates a message:

> Hi Priya, I wanted to follow up regarding the 2BHK properties we discussed. I found two new options that match your preferred budget. Would you like me to share the details?

Agent actions:

```text
Edit
Copy
Send
Dismiss
```

AI must not automatically send messages without explicit authorization.

---

# 33. AI Sales Copilot

The Sales Copilot helps agents understand what they should work on.

Agent asks:

> "What should I focus on today?"

AI analyzes CRM data.

Example:

```text
TODAY'S PRIORITIES

🔥 3 Hot Leads

1. Rahul
   Site visit requested

2. Priya
   Budget confirmed

3. Amit
   High engagement

🟡 7 Warm Leads
Need follow-up.

⚠ 4 leads haven't been contacted
for more than 24 hours.
```

---

# 34. AI Recommended Next Action

For each lead, AI recommends:

```text
CALL CUSTOMER
SEND PROPERTY OPTIONS
SCHEDULE SITE VISIT
FOLLOW UP
REQUEST BUDGET
REQUEST LOCATION
MOVE TO NURTURE
```

Example:

```text
Lead Score: 86

AI Recommendation:
Schedule a site visit.

Reason:
Customer has confirmed budget,
location and purchase timeline.
```

---

# 35. Site Visit Management

Customers can request site visits.

Information:

```text
Property
Customer
Agent
Date
Time
Location
Status
Notes
```

Statuses:

```text
REQUESTED
CONFIRMED
RESCHEDULED
COMPLETED
CANCELLED
NO_SHOW
```

---

# 36. Site Visit Workflow

```text
Customer
   ↓
Request Site Visit
   ↓
Agent Notification
   ↓
Agent Confirms
   ↓
Calendar Entry
   ↓
Customer Reminder
   ↓
Site Visit
   ↓
Agent Records Outcome
   ↓
Lead Updated
```

---

# 37. Property Management

Admins/authorized agents can:

* Create property
* Edit property
* Delete property
* Publish property
* Unpublish property
* Upload images
* Upload documents
* Manage pricing
* Manage amenities
* Manage availability

---

# 38. Property Data

Each property should contain:

```text
Property ID
Title
Description
Property Type
Listing Type
Price
Location
City
Locality
Latitude
Longitude
Bedrooms
Bathrooms
Carpet Area
Built-up Area
Parking
Furnishing
Amenities
Images
Developer
Possession Date
Status
Agent
Documents
Created At
Updated At
```

---

# 39. Property Status

Supported statuses:

```text
DRAFT
AVAILABLE
RESERVED
SOLD
RENTED
UNAVAILABLE
ARCHIVED
```

---

# 40. AI Property Description Generator

Admin enters property information:

```text
3BHK
1450 sq.ft
₹1.1 Cr
2 balconies
Parking
Gym
Swimming pool
Near metro
```

AI generates:

* Property description
* Short description
* SEO description
* Social media caption

Admin must review the generated content before publishing.

---

# 41. Property Image Intelligence

Advanced feature.

The system can classify uploaded images:

```text
Living Room
Bedroom
Kitchen
Bathroom
Exterior
Balcony
Amenities
Floor Plan
```

Possible future capabilities:

* Duplicate image detection
* Image quality detection
* Automatic tagging
* Room classification

---

# 42. AI Market Intelligence

The platform analyzes property and customer data to identify trends.

Example:

```text
Whitefield

Average Price: ₹8,750/sq.ft
Demand: HIGH
Average Budget: ₹92L
Rental Interest: MEDIUM
Buyer Interest: HIGH
```

AI generates insights such as:

> "2BHK properties under ₹80 lakh are currently the most frequently requested segment in this dataset."

---

# 43. Property Demand Intelligence

Analyze:

* Most requested locations
* Most requested property types
* Most requested price ranges
* Most requested amenities
* Demand over time

Example:

```text
Most Requested Locations

Whitefield       ██████████
Electronic City  ████████
HSR Layout       ██████
Sarjapur         █████
```

---

# 44. Customer Budget Intelligence

Analyze customer requirements.

Example:

```text
Budget Distribution

₹30–50L       18%
₹50–75L       32%
₹75L–1Cr      28%
₹1–2Cr        17%
₹2Cr+          5%
```

---

# 45. Marketing / Lead Source Analytics

Supported lead sources:

```text
WEBSITE
GOOGLE_ADS
META_ADS
INSTAGRAM
WHATSAPP
PHONE
REFERRAL
PROPERTY_PORTAL
OTHER
```

Analytics:

* Leads by source
* Qualified leads by source
* Site visits by source
* Conversions by source
* Cost per lead
* Conversion rate

---

# 46. AI Marketing Insight

Example:

```text
Lead Sources

Google Ads
380 leads
8.7% conversion

Instagram
420 leads
5.3% conversion

Referral
180 leads
12.4% conversion
```

AI insight:

> Referral leads have the highest conversion rate in the current dataset. Consider increasing referral acquisition efforts.

---

# 47. Agent Performance Analytics

Metrics:

* Leads assigned
* Leads contacted
* Qualified leads
* Site visits
* Conversions
* Average response time
* Follow-up completion
* Conversion rate

Example:

```text
Agent Performance

Amit
Leads: 240
Qualified: 84
Site Visits: 32
Conversions: 9
Conversion Rate: 10.7%

Priya
Leads: 210
Qualified: 91
Site Visits: 39
Conversions: 12
Conversion Rate: 13.2%
```

---

# 48. Sales Funnel Analytics

The dashboard should display:

```text
TOTAL LEADS
     ↓
QUALIFIED LEADS
     ↓
SITE VISITS
     ↓
NEGOTIATIONS
     ↓
CONVERSIONS
```

Example:

```text
2,458 Leads
   ↓
843 Qualified
   ↓
312 Site Visits
   ↓
98 Negotiations
   ↓
41 Conversions
```

---

# 49. Response Time Analytics

Track:

* Average first response time
* Average follow-up response time
* Uncontacted leads
* Overdue follow-ups

Example:

```text
Average Response Time
14 minutes

Target
<15 minutes

Performance
GOOD
```

---

# 50. Admin Dashboard

Admin dashboard should provide:

```text
Total Properties
Total Customers
Total Agents
Total Leads
Hot Leads
Site Visits
Conversions
Revenue
Conversion Rate
```

---

# 51. Notifications

Notifications can be triggered for:

* New lead
* Hot lead
* Follow-up due
* Site visit requested
* Site visit confirmed
* Customer message
* Duplicate lead detected
* Negative sentiment
* Property inquiry

---

# 52. Search and Filtering

Property filters:

```text
Location
Price
Bedrooms
Bathrooms
Property Type
Area
Amenities
Parking
Furnishing
Status
```

Lead filters:

```text
Lead Score
Status
Intent
Source
Assigned Agent
Location
Budget
Created Date
```

---

# 53. Global AI Assistant

Agents/admins can ask questions about their business data.

Examples:

> "How many hot leads do I have?"

> "Which property is getting the most inquiries?"

> "Which agent has the highest conversion rate?"

> "Which marketing source generates the best leads?"

> "Which leads need follow-up today?"

The AI should retrieve data from authorized application sources before generating answers.

---

# 54. AI Guardrails

The AI must:

* Avoid inventing property information
* Prefer retrieved property documents
* Clearly indicate unavailable information
* Avoid making unsupported investment guarantees
* Avoid pretending to be a legal/financial advisor
* Respect user permissions
* Protect customer information
* Provide source references for RAG answers

Example:

If information isn't available:

> "I couldn't find this information in the available property documents. Please contact the assigned agent for confirmation."

---

# 55. Data Privacy

The platform should protect:

* Customer names
* Phone numbers
* Emails
* Conversations
* Lead information
* Property documents
* Agent information

Requirements:

* Password hashing
* JWT authentication
* Role-based access
* API authorization
* Input validation
* Secure file handling
* Environment variables for secrets
* No API keys in frontend code

---

# 56. Recommended Technology Stack

## Frontend

```text
React.js
TypeScript
Vite
Tailwind CSS
React Router
TanStack Query
Recharts
```

---

## Backend

```text
Node.js
Express.js
TypeScript
JWT
bcrypt
Zod / Joi
```

---

## Database

```text
MongoDB
Mongoose
```

---

## AI

Use one primary LLM provider.

Possible choices:

```text
Google Gemini
OpenAI
```

AI capabilities:

* Conversational AI
* Structured extraction
* Classification
* Summarization
* Recommendation explanation
* Content generation

---

## RAG

```text
Embedding Model
+
Vector Database
```

Possible vector databases:

```text
Endee
Qdrant
Pinecone
```

---

## File Storage

Possible:

```text
AWS S3
Cloudinary
```

---

## Cache / Queue

Optional:

```text
Redis
```

Use it for:

* Caching
* Rate limiting
* Background jobs
* Notifications

---

# 57. High-Level Architecture

```text
                       USER
                        │
                        ↓
                  React Frontend
                        │
                        ↓
                 API Gateway
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
     Auth API       Property API       CRM API
        │               │                │
        └───────────────┼────────────────┘
                        ↓
                  AI Orchestrator
                        │
        ┌───────────────┼──────────────────┐
        ↓               ↓                  ↓
     LLM Service     RAG Service      AI Analytics
        │               │                  │
        ↓               ↓                  ↓
     Gemini/        Vector DB          Analytics
     OpenAI
                        │
                        ↓
                    MongoDB
```

---

# 58. RAG Architecture

```text
                 Property Documents
                         │
                         ↓
                  Document Parser
                         │
                         ↓
                     Chunking
                         │
                         ↓
                    Embeddings
                         │
                         ↓
                    Vector DB
                         │
                         │
Customer Question ───────┤
                         ↓
                  Semantic Search
                         ↓
                  Relevant Chunks
                         ↓
                      LLM
                         ↓
              Grounded AI Response
                         ↓
                  Source Citation
```

---

# 59. Recommendation Architecture

```text
Customer Requirements
          ↓
Entity Extraction
          ↓
Structured Preferences
          ↓
Property Filtering
          ↓
Candidate Properties
          ↓
Matching Algorithm
          ↓
AI Ranking / Explanation
          ↓
Top Recommendations
```

---

# 60. Lead Intelligence Architecture

```text
Customer Interaction
        ↓
Conversation Analysis
        ↓
Intent Detection
        ↓
Entity Extraction
        ↓
Engagement Analysis
        ↓
Lead Scoring
        ↓
Lead Classification
        ↓
Recommended Action
```

---

# 61. Suggested API Structure

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

## Properties

```text
GET    /api/properties
GET    /api/properties/:id
POST   /api/properties
PUT    /api/properties/:id
DELETE /api/properties/:id
```

---

## AI Search

```text
POST /api/ai/property-search
POST /api/ai/recommend-properties
POST /api/ai/property-question
POST /api/ai/compare-properties
```

---

## AI Assistant

```text
POST /api/ai/chat
GET  /api/ai/conversations
GET  /api/ai/conversations/:id
```

---

## Leads

```text
GET    /api/leads
GET    /api/leads/:id
POST   /api/leads
PUT    /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/:id/score
POST   /api/leads/:id/summarize
POST   /api/leads/:id/follow-up
```

---

## Site Visits

```text
GET  /api/site-visits
POST /api/site-visits
PUT  /api/site-visits/:id
DELETE /api/site-visits/:id
```

---

## Documents

```text
POST /api/documents/upload
GET  /api/documents
DELETE /api/documents/:id
POST /api/documents/:id/process
```

---

## Analytics

```text
GET /api/analytics/overview
GET /api/analytics/leads
GET /api/analytics/properties
GET /api/analytics/agents
GET /api/analytics/campaigns
GET /api/analytics/demand
```

---

# 62. Database Collections

Recommended MongoDB collections:

```text
users
properties
property_documents
property_chunks
leads
customers
agents
conversations
messages
saved_properties
site_visits
activities
notifications
campaigns
analytics
```

---

# 63. User Schema

```text
User
├── _id
├── name
├── email
├── phone
├── passwordHash
├── role
├── avatar
├── preferences
├── isActive
├── createdAt
└── updatedAt
```

---

# 64. Property Schema

```text
Property
├── _id
├── title
├── description
├── propertyType
├── listingType
├── price
├── location
├── city
├── locality
├── coordinates
├── bedrooms
├── bathrooms
├── carpetArea
├── builtUpArea
├── amenities[]
├── parking
├── furnishing
├── images[]
├── developer
├── possessionDate
├── status
├── assignedAgent
├── documents[]
├── createdAt
└── updatedAt
```

---

# 65. Lead Schema

```text
Lead
├── _id
├── customerId
├── assignedAgent
├── source
├── intent
├── propertyType
├── preferredLocation[]
├── budget
├── timeline
├── requirements[]
├── leadScore
├── leadTemperature
├── status
├── lastContactedAt
├── nextFollowUpAt
├── sentiment
├── interestedProperties[]
├── createdAt
└── updatedAt
```

---

# 66. Conversation Schema

```text
Conversation
├── _id
├── customerId
├── agentId
├── leadId
├── messages[]
├── summary
├── detectedIntent
├── sentiment
├── extractedRequirements
├── createdAt
└── updatedAt
```

---

# 67. Message Schema

```text
Message
├── _id
├── conversationId
├── sender
├── senderType
├── content
├── metadata
├── timestamp
```

---

# 68. Property Document Schema

```text
PropertyDocument
├── _id
├── propertyId
├── name
├── fileUrl
├── fileType
├── fileSize
├── processingStatus
├── totalPages
├── uploadedBy
├── createdAt
└── updatedAt
```

---

# 69. Property Chunk Schema

```text
PropertyChunk
├── _id
├── documentId
├── propertyId
├── chunkText
├── embeddingId
├── pageNumber
├── metadata
└── createdAt
```

---

# 70. Site Visit Schema

```text
SiteVisit
├── _id
├── customerId
├── leadId
├── propertyId
├── agentId
├── date
├── time
├── status
├── notes
├── outcome
├── createdAt
└── updatedAt
```

---

# 71. Frontend Pages

## Public Pages

```text
Landing Page
Properties
Property Details
Login
Register
```

---

## Customer Pages

```text
Customer Dashboard
AI Property Search
AI Assistant
Property Results
Property Details
Compare
Saved Properties
My Inquiries
Site Visits
Profile
```

---

## Agent Pages

```text
Agent Dashboard
Leads
Lead Details
Customers
Customer Details
Conversations
Follow-ups
Site Visits
Properties
AI Sales Copilot
Analytics
```

---

## Admin Pages

```text
Admin Dashboard
Properties
Add Property
Edit Property
Agents
Customers
Leads
Documents
Knowledge Base
Campaigns
Analytics
Settings
```

---

# 72. UI/UX Requirements

The interface should look like a modern SaaS product.

Design principles:

* Clean
* Professional
* Responsive
* Minimal
* Data-driven
* AI-focused
* Easy navigation

Recommended visual hierarchy:

```text
Primary Action
        ↓
Important Information
        ↓
AI Insight
        ↓
Detailed Data
```

---

# 73. Customer Homepage

Sections:

```text
Hero
"Find a property that fits your life."

AI Search Bar

Featured Properties

Recommended Properties

Popular Locations

How PropIntel AI Works

AI Assistant CTA

Testimonials

Footer
```

---

# 74. Property Card

Each property card displays:

```text
Image
Property Name
Location
Price
Bedrooms
Bathrooms
Area
Amenities
AI Match %
Save Button
View Details
```

---

# 75. AI Search UI

Example:

```text
┌─────────────────────────────────────────────┐
│ 🤖 Tell me what you're looking for...       │
│                                             │
│ "3BHK in Dehradun under ₹90L with parking" │
│                                      Search │
└─────────────────────────────────────────────┘
```

AI then displays extracted preferences:

```text
3BHK ✓
Dehradun ✓
₹90L max ✓
Parking ✓
```

---

# 76. AI Recommendation UI

```text
Top Matches For You

┌───────────────────────────────┐
│ Property A                    │
│                               │
│ AI Match              94%     │
│                               │
│ Why this matches              │
│ ✓ Within your budget          │
│ ✓ Preferred location          │
│ ✓ Parking                     │
│ ✓ 3BHK                         │
│                               │
│ View Property                 │
└───────────────────────────────┘
```

---

# 77. Agent Dashboard UI

Top cards:

```text
Total Leads       248
Hot Leads          32
Follow-ups         18
Site Visits         9
Conversions         7
```

Main sections:

```text
Today's Priorities
Lead Pipeline
Upcoming Site Visits
Recent Conversations
AI Recommendations
```

---

# 78. AI Sales Copilot UI

```text
┌─────────────────────────────────────┐
│ 🤖 AI Sales Copilot                 │
│                                     │
│ What should I focus on today?       │
│                                     │
│ [Ask AI]                            │
└─────────────────────────────────────┘
```

Example response:

```text
You have 3 high-priority leads.

1. Rahul
   Site visit requested

2. Priya
   Follow-up overdue

3. Amit
   High engagement

Recommended:
Contact Rahul first.
```

---

# 79. Admin Analytics Dashboard

Dashboard sections:

```text
Overview
Lead Funnel
Lead Sources
Property Demand
Agent Performance
Conversion Trends
Customer Preferences
AI Insights
```

---

# 80. AI Analytics Insights

The system should generate natural-language insights.

Example:

> "Lead volume increased by 18% this month, but conversion declined by 3%. The largest drop occurred between qualified leads and site visits."

Another:

> "2BHK properties in the ₹50–75 lakh range generated the highest number of inquiries this month."

---

# 81. AI Content Generation

Supported content:

```text
Property Description
Short Property Description
SEO Description
Social Media Caption
Email Follow-up
WhatsApp Follow-up
Lead Summary
Conversation Summary
```

All AI-generated content should be reviewable before publishing or sending.

---

# 82. Optional WhatsApp Integration

Future integration can connect incoming messages.

Workflow:

```text
WhatsApp
   ↓
Webhook
   ↓
Backend
   ↓
AI Agent
   ↓
Property Search
   ↓
Lead Capture
   ↓
CRM
```

The platform can identify:

* Customer
* Intent
* Budget
* Property requirements

---

# 83. Optional Voice AI

Advanced version can support:

```text
Customer Voice
      ↓
Speech-to-Text
      ↓
AI Agent
      ↓
Property Search / CRM
      ↓
LLM Response
      ↓
Text-to-Speech
      ↓
Customer
```

Possible use cases:

* Property inquiries
* Lead qualification
* Appointment scheduling
* Follow-up calls

---

# 84. Optional Predictive Analytics

Future models can predict:

* Lead conversion probability
* Customer churn/drop-off
* Site visit probability
* Property demand
* Lead response probability

Example:

```text
Lead Conversion Probability

Rahul       87%
Priya       76%
Amit        68%
Neha        34%
```

---

# 85. Optional Investment Intelligence

For advanced versions:

* Price trends
* Rental yield estimates
* Location comparisons
* Historical trends
* Property investment indicators

Important:

The system should present these as **data-driven insights**, not guaranteed investment advice.

---

# 86. Optional Computer Vision

Possible capabilities:

```text
Property Image
      ↓
Computer Vision
      ↓
Room Classification
      ↓
Automatic Tags
```

Example:

```text
Image 1 → Living Room
Image 2 → Kitchen
Image 3 → Bedroom
Image 4 → Exterior
```

---

# 87. Security Requirements

The system must implement:

* Password hashing
* JWT authentication
* Role-based access
* API authorization
* Input validation
* Rate limiting
* Secure file uploads
* File type validation
* Environment variables
* CORS configuration
* Error handling
* Audit logging

Never expose:

```text
API keys
JWT secrets
Database credentials
Cloud credentials
```

in frontend source code.

---

# 88. AI Security

The AI system should protect against:

* Prompt injection
* Unauthorized data retrieval
* Cross-user data leakage
* Hallucinated property information
* Malicious document content
* Excessive API usage

RAG retrieval must respect:

```text
userId
role
propertyId
access permissions
```

---

# 89. Performance Requirements

Target:

```text
Normal API response: <500ms
Property search: <1 second
AI response: ideally <5 seconds
Dashboard load: <2 seconds
```

AI response times can vary depending on the selected model and external services.

---

# 90. Error Handling

Frontend should display user-friendly messages.

Example:

```text
AI temporarily unavailable.

You can continue using normal property search.
```

Backend should return structured errors:

```json
{
  "success": false,
  "message": "Unable to process property search",
  "code": "AI_SEARCH_ERROR"
}
```

---

# 91. Logging

Log:

* API requests
* Errors
* Authentication events
* AI requests
* Document processing
* Lead changes
* Site visit changes
* Admin actions

Do not log sensitive credentials.

---

# 92. Testing Requirements

## Frontend

Test:

* Forms
* Authentication
* Search
* Filters
* Property cards
* Dashboard
* AI UI

## Backend

Test:

* APIs
* Authentication
* Authorization
* Validation
* Database operations
* Lead scoring
* Property matching

## AI

Test:

* Intent detection
* Entity extraction
* RAG retrieval
* RAG accuracy
* Hallucination behavior
* Recommendation quality
* Lead scoring consistency
* Summary quality

---

# 93. AI Evaluation

Create an evaluation dataset containing example questions.

Example:

```text
Question:
"What is the possession date?"

Expected:
December 2028

Retrieved:
Correct document chunk

Result:
PASS
```

Metrics:

```text
Intent Accuracy
Entity Extraction Accuracy
Retrieval Precision
Answer Relevance
Hallucination Rate
Recommendation Accuracy
```

---

# 94. Seed Data

The project should contain realistic **synthetic demo data**.

Example:

```text
100–300 Properties
500–2,000 Customers
1,000–5,000 Leads
20–50 Agents
Multiple Property Documents
Thousands of Messages
Synthetic Analytics Data
```

Do not present synthetic data as actual market data.

---

# 95. Demo Dataset Locations

For demonstration purposes, properties can be distributed across:

```text
Dehradun
Delhi NCR
Bangalore
Hyderabad
Pune
Mumbai
Chandigarh
Noida
Gurgaon
```

---

# 96. Project Folder Structure

Recommended structure:

```text
propintel-ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── context/
│   │   └── routes/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── rag/
│   │   │   ├── recommendation/
│   │   │   ├── lead/
│   │   │   └── analytics/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── app.ts
│   └── package.json
│
├── ai/
│   ├── prompts/
│   ├── evaluation/
│   └── datasets/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── diagrams/
│
├── scripts/
│   ├── seedProperties.ts
│   ├── seedUsers.ts
│   └── seedLeads.ts
│
├── .env.example
├── README.md
└── SPEC.md
```

---

# 97. Environment Variables

Example:

```text
PORT=
MONGODB_URI=
JWT_SECRET=

AI_API_KEY=

VECTOR_DB_URL=
VECTOR_DB_API_KEY=

STORAGE_URL=
STORAGE_API_KEY=

REDIS_URL=
```

Actual variable names should depend on the selected providers.

---

# 98. MVP Definition

The first working version should contain:

### Authentication

* Register
* Login
* Role-based access

### Property

* Property listing
* Property details
* Search
* Filters
* Property management

### AI

* AI property search
* Intent detection
* Entity extraction
* Property recommendation
* AI assistant

### CRM

* Lead creation
* Lead management
* Lead scoring
* Agent assignment

### Customer

* Saved properties
* Property comparison
* Site visit request

### Agent

* Agent dashboard
* Lead pipeline
* Follow-ups
* Conversation history

### Admin

* Admin dashboard
* Property management
* Agent management
* Basic analytics

---

# 99. Phase 2 — Advanced AI

Add:

* RAG
* Property document Q&A
* Conversation memory
* Conversation summaries
* AI follow-up generation
* AI Sales Copilot
* Sentiment analysis
* Duplicate lead detection
* AI content generation

---

# 100. Phase 3 — Advanced Platform

Add:

* WhatsApp integration
* Voice AI
* Predictive lead scoring
* Market intelligence
* Demand prediction
* Computer vision
* Campaign intelligence
* Advanced analytics
* Investment intelligence

---

# 101. Success Metrics

The project should measure:

```text
Property Search Success Rate
AI Recommendation Click Rate
Lead Qualification Rate
Lead Response Time
Site Visit Conversion
Lead Conversion Rate
AI Answer Accuracy
RAG Retrieval Accuracy
Follow-up Completion Rate
Duplicate Detection Accuracy
Agent Productivity
```

---

# 102. Primary Business KPIs

Important KPIs:

```text
Lead Conversion Rate
Site Visit Conversion Rate
Average Response Time
Qualified Lead Percentage
Cost Per Lead
Cost Per Acquisition
Agent Conversion Rate
Property Inquiry Rate
Property Demand
Customer Engagement
```

---

# 103. Main Business Value

PropIntel AI creates value in four major areas.

## Customer

```text
Less searching
      ↓
Better recommendations
      ↓
Faster answers
      ↓
Better property discovery
```

## Agent

```text
Automatic lead qualification
      ↓
Lead prioritization
      ↓
AI assistance
      ↓
Better follow-up
      ↓
Higher productivity
```

## Sales Manager

```text
Centralized CRM
      ↓
Real-time analytics
      ↓
AI insights
      ↓
Better decision making
```

## Business

```text
Better leads
      ↓
Faster response
      ↓
More site visits
      ↓
More conversions
```

---

# 104. Final Product Workflow

```text
CUSTOMER
   │
   ↓
AI PROPERTY SEARCH
   │
   ↓
INTENT + REQUIREMENT EXTRACTION
   │
   ↓
PROPERTY MATCHING
   │
   ↓
AI RECOMMENDATIONS
   │
   ↓
RAG PROPERTY Q&A
   │
   ↓
SAVE / INQUIRE
   │
   ↓
LEAD CREATED
   │
   ↓
AI LEAD SCORING
   │
   ↓
AGENT ASSIGNMENT
   │
   ↓
AI SALES COPILOT
   │
   ├──────────────→ FOLLOW-UP
   │
   ├──────────────→ PROPERTY RECOMMENDATION
   │
   └──────────────→ SITE VISIT
                         │
                         ↓
                    SITE VISIT
                         │
                         ↓
                     NEGOTIATION
                         │
                         ↓
                     CONVERSION
                         │
                         ↓
                  ANALYTICS ENGINE
                         │
                         ↓
                    AI INSIGHTS
```

---

# 105. Final Project Positioning

The project should NOT be presented as:

> "A real estate website with an AI chatbot."

Instead, position it as:

> **PropIntel AI is an AI-native real estate intelligence and sales platform that combines conversational property discovery, RAG-based property knowledge, personalized property recommendations, intelligent lead scoring, CRM automation, AI sales assistance and real-time business analytics to improve the complete real estate customer-to-conversion journey.**

---

# 106. Portfolio / Resume Description

### Short Version

> **PropIntel AI — AI-Powered Real Estate Intelligence Platform**
> Built an AI-driven real estate platform featuring conversational property search, RAG-based document Q&A, personalized property recommendations, intelligent lead scoring, CRM automation, AI Sales Copilot, site-visit management and real-time sales analytics.

### Technical Version

> Developed a full-stack AI real estate platform using React, Node.js, Express, MongoDB, LLM APIs and vector search, implementing RAG-based property document retrieval, natural-language requirement extraction, property recommendation, AI lead scoring, conversation summarization, sentiment analysis and AI-powered sales intelligence.

---

# 107. Project Differentiators

The strongest differentiators are:

```text
✓ Natural-language property search
✓ AI property matching
✓ RAG property knowledge
✓ Explainable recommendations
✓ AI lead scoring
✓ AI intent detection
✓ AI Sales Copilot
✓ Automated follow-up assistance
✓ Conversation summarization
✓ Sentiment analysis
✓ Duplicate lead detection
✓ Property demand intelligence
✓ Marketing intelligence
✓ Complete CRM workflow
```

---

# 108. Final Technology Demonstration

This project demonstrates knowledge of:

```text
Frontend Development
        +
Backend Development
        +
Database Design
        +
REST APIs
        +
Authentication
        +
Generative AI
        +
LLMs
        +
Prompt Engineering
        +
RAG
        +
Vector Databases
        +
Embeddings
        +
Recommendation Systems
        +
AI Agents
        +
NLP
        +
Sentiment Analysis
        +
CRM
        +
Data Analytics
        +
Cloud Deployment
```

---

# 109. Final Goal

The final system should demonstrate that AI is not simply added as a chatbot.

AI should actively participate in the business workflow:

```text
UNDERSTAND
    ↓
RECOMMEND
    ↓
QUALIFY
    ↓
PRIORITIZE
    ↓
ASSIST
    ↓
AUTOMATE
    ↓
ANALYZE
    ↓
IMPROVE
```

**PropIntel AI should function as an intelligent real-estate operating layer connecting customers, properties, agents, leads and business intelligence in a single platform.**
