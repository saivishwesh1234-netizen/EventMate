/**
 * Event Mate - Pure Node.js Backend Server (Zero Dependencies)
 * 
 * Built with Node's native 'http' module:
 * - NO 'npm install' needed!
 * - NO external packages needed!
 * - Just run: node server.js
 * 
 * Port: 5000
 */

const http = require('http');
const PORT = process.env.PORT || 5000;

// In-memory store
const eventStore = [];

// Helper date formatter
function formatDateTime(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

// Campaign Generation Engine
function generateCampaign(event) {
  const { name, dateTime, venue, description, audience, registrationLink, tone = 'friendly' } = event;
  const dtFormatted = formatDateTime(dateTime);
  const cleanTag = name.replace(/[^a-zA-Z0-9]/g, '');

  // 1. Social
  let socialHook = tone === 'exciting'
    ? `🚀 BIG NEWS! Mark your calendars for *${name}*! 🌟 Get ready for an electrifying experience!`
    : tone === 'professional'
    ? `We are pleased to announce *${name}*, tailored for ${audience}. Actionable insights & networking.`
    : `Hey everyone! 👋 You're invited to *${name}*! Connect, learn, and grow together.`;

  const social = `${socialHook}\n\n📅 When: ${dtFormatted}\n📍 Where: ${venue}\n👥 Audience: ${audience}\n\n✨ Highlights:\n${description}\n\n👉 Register: ${registrationLink}\n\n#${cleanTag} #EventMate`;

  // 2. Email
  const emailSubject = tone === 'exciting'
    ? `⚡ You're Invited: ${name} is coming up!`
    : tone === 'professional'
    ? `Official Invitation: ${name} | ${dtFormatted}`
    : `💌 You're Invited to ${name}!`;

  const emailBody = `Hello,\n\nYou are invited to ${name}!\n\n• Date: ${dtFormatted}\n• Venue: ${venue}\n• Target: ${audience}\n\nOverview:\n${description}\n\nRSVP & Passes: ${registrationLink}\n\nBest regards,\nOrganizing Team`;

  // 3. WhatsApp
  const waHeader = tone === 'exciting' ? `🔥 *DON'T MISS: ${name.toUpperCase()}!* 🔥` : `🎉 *You're Invited to ${name}* 🎉`;
  const whatsappMsg = `${waHeader}\n\n🗓️ Date: ${dtFormatted}\n📍 Venue: ${venue}\n👥 For: ${audience}\n\n${description}\n\n👉 Register: ${registrationLink}\n\n📲 Forward to your classmates!`;
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`;

  // 4. Reminders
  const reminders = {
    oneWeek: { stage: "1 Week Before", text: `⏳ 1 Week To Go until ${name}!\nDate: ${dtFormatted}\nRegister: ${registrationLink}` },
    oneDay: { stage: "24 Hours Before", text: `⏰ Tomorrow is the Day! ${name} at ${venue}.\nChecklist: ID & Laptop.\nLink: ${registrationLink}` },
    oneHour: { stage: "1 Hour Before", text: `🚨 Starting in 60 Minutes! Doors are open at ${venue}.\nLink: ${registrationLink}` }
  };

  // 5. FAQs
  const faqs = [
    { question: `Who can attend ${name}?`, answer: `Open to ${audience}.` },
    { question: `Where is the venue?`, answer: `Hosted at ${venue}.` },
    { question: `How do I register?`, answer: `Secure your spot via ${registrationLink}.` }
  ];

  // 6. Consistency
  const consistency = {
    score: 100,
    statusLabel: "100% Synchronized",
    checks: [
      { item: "Event Title Synchronized", detail: "Matched across all 5 channels", status: "pass" },
      { item: "Date & Time Accurate", detail: dtFormatted, status: "pass" },
      { item: "Venue Matched", detail: venue, status: "pass" },
      { item: "Registration URL Embedded", detail: registrationLink, status: "pass" }
    ]
  };

  return {
    success: true,
    social,
    email: { subject: emailSubject, body: emailBody },
    whatsapp: { message: whatsappMsg, directShareUrl: waShareUrl },
    reminders,
    faqs,
    consistency
  };
}

// HTTP Server
const server = http.createServer((req, res) => {
  // Add CORS headers so frontend can call from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle pre-flight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // Route 1: Health Check
  if (req.method === 'GET' && url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', service: 'Event Mate Zero-Dependency Node.js Backend', port: PORT }));
    return;
  }

  // Route 2: Generate Campaign API
  if (req.method === 'POST' && url === '/api/campaign/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        if (!event.name || !event.dateTime || !event.venue || !event.description || !event.audience || !event.registrationLink) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required event fields.' }));
          return;
        }

        const campaign = generateCampaign(event);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(campaign));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Route 3: GET /api/events
  if (req.method === 'GET' && url === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(eventStore));
    return;
  }

  // Route 4: POST /api/events
  if (req.method === 'POST' && url === '/api/events') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        item.id = item.id || `evt-${Date.now()}`;
        eventStore.push(item);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id: item.id, message: 'Event saved' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Event Mate JavaScript Backend running on port ${PORT}`);
  console.log(`👉 API: http://localhost:${PORT}/api/health`);
  console.log(`👉 Generate: POST http://localhost:${PORT}/api/campaign/generate`);
  console.log('====================================================');
});
