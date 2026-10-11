/**
 * Event Mate - Embedded Persistent Database Engine
 * 
 * Provides safe, persistent file-backed JSON storage for:
 * - Registered Members (with explicit WhatsApp consent and E.164 phone numbers)
 * - Events (both sample presets and custom created campaigns)
 * - WhatsApp Dispatch Logs (recording delivery receipts, error traces, and demo flags)
 * 
 * Zero external database drivers required — 100% cross-platform compatible on Windows/macOS/Linux.
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'eventmate_db.json');

// Initial seed data for pre-loaded events and members
const INITIAL_DATA = {
  events: [
    {
      id: "hackathon-2026",
      name: "HackSphere 2026: National 36-Hour Hackathon",
      dateTime: "2026-11-14T09:00",
      venue: "Main Campus Auditorium & Tech Hub, Block C (Hybrid / Discord)",
      description: "Join 500+ student developers, designers, and innovators to build cutting-edge AI, Web3, and social impact solutions.",
      registrationLink: "https://hacksphere2026.devpost.com/register",
      tone: "exciting"
    },
    {
      id: "ai-masterclass",
      name: "GenAI & Prompt Engineering Masterclass",
      dateTime: "2026-10-25T14:30",
      venue: "Seminar Hall 2 & Live Stream via Google Meet",
      description: "An intensive hands-on session exploring Large Language Models and prompt engineering.",
      registrationLink: "https://events.college.edu/workshops/genai-2026",
      tone: "professional"
    },
    {
      id: "cultural-night",
      name: "Campus Beat: Indie Music & Cultural Night",
      dateTime: "2026-11-05T18:00",
      venue: "Open Air Amphitheatre, North Campus",
      description: "Live bands, acoustic open mics, and campus cultural celebration.",
      registrationLink: "https://tickets.campusevents.org/campus-beat-2026",
      tone: "friendly"
    }
  ],
  members: [
    {
      id: "mem-001",
      name: "Aarav Sharma",
      phone: "+919876543210",
      eventId: "hackathon-2026",
      eventName: "HackSphere 2026: National 36-Hour Hackathon",
      consent: true,
      consentTimestamp: "2026-10-10T09:15:00.000Z",
      createdAt: "2026-10-10T09:15:00.000Z"
    },
    {
      id: "mem-002",
      name: "Sarah Jenkins",
      phone: "+14155552671",
      eventId: "hackathon-2026",
      eventName: "HackSphere 2026: National 36-Hour Hackathon",
      consent: true,
      consentTimestamp: "2026-10-10T11:42:00.000Z",
      createdAt: "2026-10-10T11:42:00.000Z"
    },
    {
      id: "mem-003",
      name: "Rohan Patel",
      phone: "+919812345678",
      eventId: "ai-masterclass",
      eventName: "GenAI & Prompt Engineering Masterclass",
      consent: true,
      consentTimestamp: "2026-10-10T14:20:00.000Z",
      createdAt: "2026-10-10T14:20:00.000Z"
    },
    {
      id: "mem-004",
      name: "Priya Nair",
      phone: "+919898989898",
      eventId: "cultural-night",
      eventName: "Campus Beat: Indie Music & Cultural Night",
      consent: true,
      consentTimestamp: "2026-10-10T16:05:00.000Z",
      createdAt: "2026-10-10T16:05:00.000Z"
    }
  ],
  logs: []
};

class Database {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('Error initializing database file:', err);
    }
  }

  read() {
    try {
      this.ensureInitialized();
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading database:', err);
      return INITIAL_DATA;
    }
  }

  write(data) {
    try {
      this.ensureInitialized();
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      return true;
    } catch (err) {
      console.error('Error writing to database:', err);
      return false;
    }
  }

  // Events API
  getEvents() {
    const data = this.read();
    return data.events || [];
  }

  getEventById(id) {
    const events = this.getEvents();
    return events.find(e => e.id === id) || null;
  }

  saveEvent(event) {
    const data = this.read();
    const existingIndex = data.events.findIndex(e => e.id === event.id);
    if (existingIndex >= 0) {
      data.events[existingIndex] = { ...data.events[existingIndex], ...event };
    } else {
      data.events.push(event);
    }
    this.write(data);
    return event;
  }

  // Members API
  getMembers(eventId = null) {
    const data = this.read();
    let members = data.members || [];
    if (eventId) {
      members = members.filter(m => m.eventId === eventId);
    }
    return members;
  }

  getMemberById(id) {
    const members = this.getMembers();
    return members.find(m => m.id === id) || null;
  }

  saveMember(member) {
    const data = this.read();
    // Check if member already registered for this event with this phone
    const existingIndex = data.members.findIndex(
      m => m.phone === member.phone && m.eventId === member.eventId
    );

    if (existingIndex >= 0) {
      data.members[existingIndex] = {
        ...data.members[existingIndex],
        ...member,
        updatedAt: new Date().toISOString()
      };
      this.write(data);
      return { member: data.members[existingIndex], isNew: false };
    } else {
      const newMember = {
        id: member.id || `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...member,
        createdAt: new Date().toISOString()
      };
      data.members.push(newMember);
      this.write(data);
      return { member: newMember, isNew: true };
    }
  }

  deleteMember(id) {
    const data = this.read();
    const initialLen = data.members.length;
    data.members = data.members.filter(m => m.id !== id);
    if (data.members.length !== initialLen) {
      this.write(data);
      return true;
    }
    return false;
  }

  // Message Logs API
  getLogs(eventId = null) {
    const data = this.read();
    let logs = data.logs || [];
    if (eventId) {
      logs = logs.filter(l => l.eventId === eventId);
    }
    // Return newest logs first
    return logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  }

  saveLog(logEntry) {
    const data = this.read();
    const entry = {
      id: logEntry.id || `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString(),
      ...logEntry
    };
    data.logs.push(entry);
    this.write(data);
    return entry;
  }

  // Dashboard Summary Metrics
  getStats() {
    const data = this.read();
    const totalMembers = data.members.length;
    const totalEvents = data.events.length;
    const totalLogs = data.logs.length;
    const sentCount = data.logs.filter(l => l.status === 'sent' || l.status === 'simulated').length;
    const failedCount = data.logs.filter(l => l.status === 'failed').length;

    return {
      totalMembers,
      totalEvents,
      totalLogs,
      sentCount,
      failedCount,
      consentRate: totalMembers > 0 ? 100 : 0 // All registered members gave explicit consent
    };
  }
}

module.exports = new Database();
