/**
 * Event Mate - Preset Sample Event Data
 * Ready-to-use sample events for fast hackathon judging demos.
 */

const SAMPLE_EVENTS = [
  {
    id: "hackathon-2026",
    name: "HackSphere 2026: National 36-Hour Hackathon",
    dateTime: "2026-11-14T09:00",
    venue: "Main Campus Auditorium & Tech Hub, Block C (Hybrid / Discord)",
    description: "Join 500+ student developers, designers, and innovators to build cutting-edge AI, Web3, and social impact solutions. Features $10,000 in prizes, free food, mentor workshops, recruiter speed-dating, and exclusive swags for all attendees!",
    audience: "Engineering students, collegiate developers, UI/UX designers, and tech enthusiasts",
    registrationLink: "https://hacksphere2026.devpost.com/register",
    tone: "exciting",
    tag: "Hackathon",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-300"
  },
  {
    id: "ai-masterclass",
    name: "GenAI & Prompt Engineering Masterclass",
    dateTime: "2026-10-25T14:30",
    venue: "Seminar Hall 2 & Live Stream via Google Meet (meet.google.com/xyz-hack-demo)",
    description: "An intensive hands-on session exploring Large Language Models, prompt crafting, agentic workflows, and practical Python API integrations. Learn how modern AI tools enhance productivity and software architecture. Certificates provided upon completion.",
    audience: "Computer Science students, researchers, tech club members, and software professionals",
    registrationLink: "https://events.college.edu/workshops/genai-2026",
    tone: "professional",
    tag: "Workshop",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-300"
  },
  {
    id: "cultural-night",
    name: "Campus Beat: Indie Music & Cultural Night",
    dateTime: "2026-11-05T18:00",
    venue: "Open Air Amphitheatre, North Campus",
    description: "Unwind after midterms with an electric evening of indie live bands, acoustic open mics, dance battles, and gourmet food trucks! Bring your college ID, cheer for your favorite student artists, and celebrate campus culture together.",
    audience: "All undergraduate, postgraduate students, college faculty, and alumni",
    registrationLink: "https://tickets.campusevents.org/campus-beat-2026",
    tone: "friendly",
    tag: "Campus Fest",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-300"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_EVENTS };
}
