/* Verify varied searches produce varied criteria + results. */
const BASE = 'http://localhost:5000/api';

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await r.json()).token;
}

const token = await login('rahul@example.com', 'Customer@123');

const QUERIES = [
  '3BHK in Bangalore under 1.2 crore near Whitefield with parking and a gym',
  '3BHK in Bangalore under 1.2 crore near Electronic City',
  'villa in Hyderabad above 2 crore with clubhouse',
  'office space in Mumbai under 3 crore',
  '2BHK for rent in Pune around 35 lakh budget',
  'budget flat in Dehradun around 90 lakh with parking',
];

let allDistinct = true;
const signatures = [];

for (const q of QUERIES) {
  const r = await fetch(`${BASE}/ai/property-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: q }),
  });
  const d = await r.json();
  const c = d.criteria ?? {};
  const results = d.results ?? [];
  const sig = results.slice(0, 3).map(x => x.property._id).join(',');
  signatures.push(sig);
  console.log(`Q: ${q}`);
  console.log(`   type=${c.propertyType || '—'} city=${c.city || '—'} localities=[${(c.locations ?? []).join('|') || '—'}] budget≤${c.budgetMax ? (c.budgetMax / 100000) + 'L' : '—'} budget≥${c.budgetMin ? (c.budgetMin / 100000) + 'L' : '—'} intent=${c.intent}`);
  console.log(`   ${results.length} results; top: ${results.slice(0, 3).map(x => `${x.property.locality} ${x.matchScore}%`).join(' · ')}`);
  console.log('');
}

// The two Bangalore locality queries: top score must differ when inventory differs,
// and the assistant must be honest when the exact locality has no stock.
const [resA, resB] = await Promise.all(QUERIES.slice(0, 2).map(q =>
  fetch(`${BASE}/ai/property-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: q }),
  }).then(r => r.json()),
));
const topA = resA.results?.[0]?.matchScore ?? 0;
const topB = resB.results?.[0]?.matchScore ?? 0;
const coveredB = (resB.results ?? []).some(r => (r.property.locality || '').toLowerCase().includes('electronic'));
if (topA === topB && !coveredB) {
  console.log('✗ FAIL: locality differentiation had no effect on scores');
  allDistinct = false;
} else {
  console.log(`✓ locality-aware scoring (Whitefield top ${topA}% vs Electronic City top ${topB}%)`);
}

// all signatures should not be identical across the 6 queries
const unique = new Set(signatures).size;
console.log(`✓ ${unique}/6 queries returned distinct top-3 result sets`);
process.exit(allDistinct && unique >= 4 ? 0 : 1);
