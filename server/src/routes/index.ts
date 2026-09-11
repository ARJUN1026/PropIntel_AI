import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { listProperties, getProperty, createProperty, updateProperty, deleteProperty } from '../controllers/propertyController.js';
import { propertySearch, recommendProperties, chat, listConversations, getConversation, compareProperties } from '../controllers/aiController.js';
import { listLeads, getLead, createLead, updateLead, deleteLead, scoreLead, leadPriorities } from '../controllers/leadController.js';
import { listSaved, saveProperty, unsaveProperty } from '../controllers/savedController.js';
import { listVisits, requestVisit, updateVisit, deleteVisit } from '../controllers/siteVisitController.js';
import { overview, leadAnalytics, propertyAnalytics, agentAnalytics, campaignAnalytics, demandAnalytics } from '../controllers/analyticsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// ---- Auth (public) ----
router.post('/auth/register', rateLimit(20, 60_000), register);
router.post('/auth/login', rateLimit(30, 60_000), login);
router.get('/auth/me', requireAuth, me);

// ---- Properties (staff = ADMIN) ----
router.get('/properties', requireAuth, listProperties);
router.get('/properties/:id', requireAuth, getProperty);
router.post('/properties', requireAuth, requireRole('ADMIN'), createProperty);
router.put('/properties/:id', requireAuth, requireRole('ADMIN'), updateProperty);
router.delete('/properties/:id', requireAuth, requireRole('ADMIN'), deleteProperty);

// ---- AI (customer-facing; rate limited to control cost) ----
router.post('/ai/property-search', requireAuth, rateLimit(30, 60_000), propertySearch);
router.post('/ai/recommend-properties', requireAuth, recommendProperties);
router.post('/ai/chat', requireAuth, rateLimit(60, 60_000), chat);
router.get('/ai/conversations', requireAuth, listConversations);
router.get('/ai/conversations/:id', requireAuth, getConversation);
router.post('/ai/compare-properties', requireAuth, compareProperties);

// ---- Leads (staff = ADMIN) ----
router.get('/leads', requireAuth, requireRole('ADMIN'), listLeads);
router.get('/leads/priorities', requireAuth, requireRole('ADMIN'), leadPriorities);
router.get('/leads/:id', requireAuth, requireRole('ADMIN'), getLead);
router.post('/leads', requireAuth, requireRole('ADMIN'), createLead);
router.put('/leads/:id', requireAuth, requireRole('ADMIN'), updateLead);
router.delete('/leads/:id', requireAuth, requireRole('ADMIN'), deleteLead);
router.post('/leads/:id/score', requireAuth, requireRole('ADMIN'), scoreLead);

// ---- Saved properties ----
router.get('/saved', requireAuth, listSaved);
router.post('/saved/:propertyId', requireAuth, saveProperty);
router.delete('/saved/:propertyId', requireAuth, unsaveProperty);

// ---- Site visits ----
router.get('/site-visits', requireAuth, listVisits);
router.post('/site-visits', requireAuth, requireRole('CUSTOMER'), requestVisit);
router.put('/site-visits/:id', requireAuth, requireRole('ADMIN'), updateVisit);
router.delete('/site-visits/:id', requireAuth, requireRole('ADMIN'), deleteVisit);

// ---- Analytics (staff = ADMIN) ----
router.get('/analytics/overview', requireAuth, requireRole('ADMIN'), overview);
router.get('/analytics/leads', requireAuth, requireRole('ADMIN'), leadAnalytics);
router.get('/analytics/properties', requireAuth, requireRole('ADMIN'), propertyAnalytics);
router.get('/analytics/agents', requireAuth, requireRole('ADMIN'), agentAnalytics);
router.get('/analytics/campaigns', requireAuth, requireRole('ADMIN'), campaignAnalytics);
router.get('/analytics/demand', requireAuth, requireRole('ADMIN'), demandAnalytics);

export default router;
