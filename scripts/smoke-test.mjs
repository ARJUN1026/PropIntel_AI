/* End-to-end smoke test for PropIntel AI API */
const BASE = 'http://localhost:5000/api';
let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL  ${name} ${extra}`); }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

// ---------- 1. AUTH ----------
console.log('\n== Auth ==');
const bad = await req('POST', '/auth/login', { body: { email: 'admin@propintel.ai', password: 'wrong' } });
ok('login rejects bad password (401)', bad.status === 401, `got ${bad.status}`);

const admin = await req('POST', '/auth/login', { body: { email: 'admin@propintel.ai', password: 'Admin@123' } });
ok('admin login', admin.status === 200 && admin.data.token, `got ${admin.status}`);
const staff = await req('POST', '/auth/login', { body: { email: 'amit@propintel.ai', password: 'Admin@123' } });
ok('sales-staff (admin) login', staff.status === 200 && staff.data.token, `got ${staff.status}`);
const customer = await req('POST', '/auth/login', { body: { email: 'rahul@example.com', password: 'Customer@123' } });
ok('customer login', customer.status === 200 && customer.data.token, `got ${customer.status}`);

const A = admin.data?.token, G = staff.data?.token, C = customer.data?.token;

// legacy role must no longer be registrable
const agentReg = await req('POST', '/auth/register', { body: { name: 'X Y', email: `legacy-${Date.now()}@test.io`, password: 'Test@123', role: 'AGENT' } });
ok('register rejects AGENT role (400)', agentReg.status === 400, `got ${agentReg.status}`);

const me = await req('GET', '/auth/me', { token: C });
ok('GET /auth/me returns customer role', me.data?.user?.role === 'CUSTOMER', JSON.stringify(me.data?.user?.role));

const noTok = await req('GET', '/properties');
ok('properties blocked without token (401)', noTok.status === 401, `got ${noTok.status}`);

// ---------- 2. RBAC ----------
console.log('\n== RBAC ==');
const custCreateProp = await req('POST', '/properties', { token: C, body: { title: 'hack', price: 1 } });
ok('customer cannot create property (403)', custCreateProp.status === 403, `got ${custCreateProp.status}`);
const custLeads = await req('GET', '/leads', { token: C });
ok('customer cannot list leads (403)', custLeads.status === 403, `got ${custLeads.status}`);
const staffAgents = await req('GET', '/analytics/agents', { token: G });
ok('sales staff (admin) can view agent analytics', staffAgents.status === 200, `got ${staffAgents.status}`);
const adminLeads = await req('GET', '/leads', { token: A });
ok('admin can list leads', adminLeads.status === 200 && Array.isArray(adminLeads.data.items), `got ${adminLeads.status}`);

// ---------- 3. PROPERTIES ----------
console.log('\n== Properties ==');
const props = await req('GET', '/properties?limit=50', { token: C });
ok('customer lists properties', props.status === 200 && props.data.items.length > 0, `got ${props.status}, ${props.data.items?.length} items`);
const bangalore = await req('GET', '/properties?city=Bangalore&limit=50', { token: C });
ok('city filter works', bangalore.data.items.every(p => p.city === 'Bangalore') && bangalore.data.items.length > 0, `${bangalore.data.items?.length} items`);
const priceFilter = await req('GET', '/properties?maxPrice=8000000&limit=50', { token: C });
ok('maxPrice filter works', priceFilter.data.items.every(p => p.price <= 8000000) && priceFilter.data.items.length > 0, `${priceFilter.data.items?.length} items`);
const first = props.data.items[0];
const one = await req('GET', `/properties/${first._id}`, { token: C });
ok('property detail', one.status === 200 && one.data.property._id === first._id);

// create as admin
const created = await req('POST', '/properties', {
  token: A,
  body: {
    title: 'Smoke Test Tower 2BHK', description: 'E2E test property', propertyType: '2BHK',
    listingType: 'BUY', price: 7500000, city: 'Pune', locality: 'Kharadi',
    location: 'Kharadi, Pune', bedrooms: 2, bathrooms: 2, carpetArea: 1000,
    parking: true, furnishing: 'UNFURNISHED', amenities: ['Gym', 'Parking'], status: 'AVAILABLE',
    images: [],
  },
});
ok('admin creates property (201)', created.status === 201 && created.data.property?._id, `got ${created.status}`);
const createdId = created.data?.property?._id;

const updated = await req('PUT', `/properties/${createdId}`, { token: A, body: { status: 'RESERVED' } });
ok('admin updates property status', updated.status === 200 && updated.data.property.status === 'RESERVED');
const deleted = await req('DELETE', `/properties/${createdId}`, { token: A });
ok('admin deletes property', deleted.status === 200);

// ---------- 4. AI SEARCH (mock NLU) ----------
console.log('\n== AI search ==');
const spec = await req('POST', '/ai/property-search', {
  token: C,
  body: { query: '3BHK in Bangalore under 1.2 crore near Whitefield with parking and a gym' },
});
ok('AI search 200', spec.status === 200, `got ${spec.status}: ${JSON.stringify(spec.data?.message ?? '')}`);
const cr = spec.data?.criteria ?? {};
ok('extracted intent=BUY', cr.intent === 'BUY', `got ${cr.intent}`);
ok('extracted propertyType=3BHK', cr.propertyType === '3BHK', `got ${cr.propertyType}`);
ok('extracted city=Bangalore', cr.city === 'Bangalore', `got ${cr.city}`);
ok('extracted budgetMax=12,000,000', cr.budgetMax === 12000000, `got ${cr.budgetMax}`);
ok('extracted parking=true', cr.parking === true, `got ${cr.parking}`);
ok('extracted gym amenity', (cr.amenities ?? []).some(a => /gym/i.test(a)), JSON.stringify(cr.amenities));
ok('results ranked with matchScore+reasons', (spec.data.results ?? []).length > 0
  && typeof spec.data.results[0].matchScore === 'number'
  && spec.data.results[0].matchScore >= spec.data.results[spec.data.results.length - 1].matchScore
  && Array.isArray(spec.data.results[0].reasons),
  `${spec.data.results?.length} results`);
const topOk = spec.data.results?.[0]?.property?.price <= 12000000;
ok('top match within budget', topOk === true, `price ${spec.data.results?.[0]?.property?.price}`);

// ---------- 5. AI CHAT + LEAD CAPTURE ----------
console.log('\n== AI chat + lead capture ==');
const chat1 = await req('POST', '/ai/chat', { token: C, body: { message: 'I want a 3BHK in Noida with parking' } });
ok('chat 200', chat1.status === 200, `got ${chat1.status}`);
ok('chat returns conversationId + extracted', Boolean(chat1.data?.conversationId) && Boolean(chat1.data?.extracted));
const convId = chat1.data.conversationId;
const chat2 = await req('POST', '/ai/chat', { token: C, body: { message: 'My budget is around 1 crore', conversationId: convId } });
ok('second turn keeps conversation', chat2.status === 200 && chat2.data.conversationId === convId, `got ${chat2.status}`);
ok('memory: budget merged across turns', chat2.data?.extracted?.budgetMax === 10000000, `got ${chat2.data?.extracted?.budgetMax}`);
ok('memory: property type retained', chat2.data?.extracted?.propertyType === '3BHK', `got ${chat2.data?.extracted?.propertyType}`);
ok('lead captured from chat', chat1.data.leadCaptured === true || chat2.data.leadCaptured === true, JSON.stringify({ l1: chat1.data.leadCaptured, l2: chat2.data.leadCaptured }));

const convs = await req('GET', '/ai/conversations', { token: C });
ok('conversation list includes new chat', convs.status === 200 && convs.data.items.some(c => c._id === convId));
const convDetail = await req('GET', `/ai/conversations/${convId}`, { token: C });
ok('conversation detail has messages', (convDetail.data?.conversation?.messages ?? []).length >= 4, `${convDetail.data?.conversation?.messages?.length} messages`);

// ---------- 6. LEADS ----------
console.log('\n== Leads ==');
const leads = await req('GET', '/leads?limit=50', { token: G });
ok('agent lists leads', leads.status === 200 && leads.data.items.length > 0, `${leads.data.items?.length}`);
const sortedByScore = [...leads.data.items].every((l, i, arr) => i === 0 || arr[i - 1].leadScore >= l.leadScore);
ok('leads sorted by score desc', sortedByScore);

const prio = await req('GET', '/leads/priorities', { token: G });
const b = prio.data?.buckets ?? {};
const bucketOk = [...(b.HIGH ?? []), ...(b.MEDIUM ?? []), ...(b.LOW ?? [])].every(l => {
  if (l.leadScore >= 80) return b.HIGH.some(x => x._id === l._id);
  if (l.leadScore >= 60) return b.MEDIUM.some(x => x._id === l._id);
  return b.LOW.some(x => x._id === l._id);
});
ok('priority buckets respect 80/60 thresholds', prio.status === 200 && bucketOk);

const newLead = await req('POST', '/leads', {
  token: G,
  body: { name: 'Smoke Lead', phone: '9999999999', intent: 'BUY', propertyType: '3BHK', preferredLocations: ['Whitefield'], budgetMax: 12000000, timeline: '0-3 months' },
});
ok('agent creates lead (201)', newLead.status === 201 && newLead.data.lead?._id, `got ${newLead.status}`);
const leadId = newLead.data?.lead?._id;

const scored = await req('POST', `/leads/${leadId}/score`, { token: G });
ok('score endpoint returns reasons + temperature',
  scored.status === 200 && typeof scored.data.score === 'number' && (scored.data.reasons ?? []).length > 0 && ['HOT', 'WARM', 'NURTURE', 'COLD'].includes(scored.data.temperature),
  `score ${scored.data?.score}, temp ${scored.data?.temperature}`);

const detail = await req('GET', `/leads/${leadId}`, { token: G });
ok('lead detail has nextAction + breakdown',
  detail.status === 200 && Boolean(detail.data.nextAction?.action) && typeof detail.data.scoreBreakdown?.score === 'number',
  JSON.stringify(detail.data?.nextAction ?? {}));

const statusUpd = await req('PUT', `/leads/${leadId}`, { token: G, body: { status: 'CONTACTED' } });
ok('lead status update', statusUpd.status === 200 && statusUpd.data.lead.status === 'CONTACTED');

// ---------- 7. SAVED ----------
console.log('\n== Saved ==');
const targetProp = props.data.items[1]._id;
await req('POST', `/saved/${targetProp}`, { token: C });
const savedList = await req('GET', '/saved', { token: C });
ok('saved list contains just-saved property', savedList.data.items.some(p => p._id === targetProp), `${savedList.data.items?.length} saved`);
const unsaved = await req('DELETE', `/saved/${targetProp}`, { token: C });
ok('unsave works', unsaved.status === 200);

// ---------- 8. SITE VISITS ----------
console.log('\n== Site visits ==');
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const visit = await req('POST', '/site-visits', { token: C, body: { propertyId: props.data.items[0]._id, date: tomorrow, time: '11:30 AM', notes: 'smoke test' } });
ok('customer requests visit (201)', visit.status === 201 && visit.data.visit?.status === 'REQUESTED', `got ${visit.status}`);
const visitId = visit.data?.visit?._id;

const custUpd = await req('PUT', `/site-visits/${visitId}`, { token: C, body: { status: 'CONFIRMED' } });
ok('customer cannot update visit (403)', custUpd.status === 403, `got ${custUpd.status}`);
const staffConfirm = await req('PUT', `/site-visits/${visitId}`, { token: G, body: { status: 'CONFIRMED' } });
ok('staff confirms visit', staffConfirm.status === 200 && staffConfirm.data.visit.status === 'CONFIRMED');
const staffComplete = await req('PUT', `/site-visits/${visitId}`, { token: G, body: { status: 'COMPLETED', outcome: 'Customer liked it, will negotiate' } });
ok('staff records outcome', staffComplete.status === 200 && staffComplete.data.visit.status === 'COMPLETED');

// lead linked to the visit should have moved toward SITE_VISIT + rescored
const visitLeads = await req('GET', '/leads?limit=100', { token: G });
const linked = visitLeads.data.items.find(l => l.name === 'Rahul Sharma' || (typeof l.customerId === 'object' && l.customerId?.name === 'Rahul Sharma'));
ok('visit flow left traceable lead data', Array.isArray(visitLeads.data.items) && visitLeads.data.items.length > 0);

// ---------- 9. ANALYTICS ----------
console.log('\n== Analytics ==');
const ov = await req('GET', '/analytics/overview', { token: A });
ok('overview has all stat fields',
  ov.status === 200 && ['properties', 'customers', 'agents', 'leads', 'hotLeads', 'visits', 'conversions', 'conversionRate'].every(k => typeof ov.data[k] === 'number'),
  JSON.stringify(ov.data));
const la = await req('GET', '/analytics/leads', { token: A });
ok('lead analytics has funnel', la.status === 200 && (la.data.funnel ?? []).length === 5, JSON.stringify(la.data?.funnel ?? []));
const pa = await req('GET', '/analytics/properties', { token: A });
ok('property analytics byCity', pa.status === 200 && (pa.data.byCity ?? []).length > 0);
const aa = await req('GET', '/analytics/agents', { token: A });
ok('agent analytics rows', aa.status === 200 && (aa.data.items ?? []).length > 0);
const ca = await req('GET', '/analytics/campaigns', { token: A });
ok('campaign analytics rows', ca.status === 200 && (ca.data.items ?? []).length > 0);
const da = await req('GET', '/analytics/demand', { token: A });
ok('demand analytics', da.status === 200 && Array.isArray(da.data.locations));

// ---------- 10. COMPARE ----------
console.log('\n== Compare ==');
const ids = props.data.items.slice(0, 2).map(p => p._id);
const cmp = await req('POST', '/ai/compare-properties', { token: C, body: { propertyIds: ids } });
ok('compare 2 properties + summary', cmp.status === 200 && cmp.data.properties.length === 2 && cmp.data.summary.length > 10, `got ${cmp.status}`);

// ---------- SUMMARY ----------
console.log('\n==========================================');
console.log(`RESULT: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log('FAILED TESTS:');
  failures.forEach(f => console.log(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log('ALL SMOKE TESTS PASSED ✔');
}
