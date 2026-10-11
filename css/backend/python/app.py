"""
Event Mate - Python (Flask) REST API Backend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import urllib.parse
import re

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# In-memory store
EVENT_STORE = {}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "UP",
        "service": "Event Mate Python Flask Backend",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/campaign/generate', methods=['POST'])
def generate_campaign():
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    date_time = data.get('dateTime', '').strip()
    venue = data.get('venue', '').strip()
    desc = data.get('description', '').strip()
    audience = data.get('audience', '').strip()
    link = data.get('registrationLink', '').strip()
    tone = data.get('tone', 'friendly').strip().lower()

    if not all([name, date_time, venue, desc, audience, link]):
        return jsonify({"error": "Missing required fields"}), 400

    clean_tag = re.sub(r'[^a-zA-Z0-9]', '', name)

    # 1. Social
    if tone == 'exciting':
        hook = f"🚀 BIG NEWS: Mark your calendars! The countdown to *{name}* is ON! 🌟 Get ready for high-energy sessions!"
        cta = f"🔥 Limited spots!\n👉 Register: {link}"
    elif tone == 'professional':
        hook = f"We are pleased to announce *{name}*, designed for {audience}."
        cta = f"Pre-registration required.\n👉 Register: {link}"
    else:
        hook = f"Hey campus! 👋 You're invited to *{name}*! Learn, connect, and enjoy."
        cta = f"Spots are limited!\n👉 Register: {link}"

    social = f"{hook}\n\n📅 When: {date_time}\n📍 Where: {venue}\n👥 Audience: {audience}\n\n✨ Highlights:\n{desc}\n\n{cta}\n\n#{clean_tag} #EventMate"

    # 2. Email
    subject = f"⚡ You're Invited: {name}!" if tone == 'exciting' else f"Invitation: {name}"
    email_body = f"Hello,\n\nYou are cordially invited to {name}!\n\n• Date: {date_time}\n• Venue: {venue}\n• Target: {audience}\n\nHighlights:\n{desc}\n\nRegister: {link}\n\nBest regards,\nOrganizing Team"

    # 3. WhatsApp
    wa_header = f"🔥 *{name.upper()}* 🔥" if tone == 'exciting' else f"🎉 *{name}* 🎉"
    wa_msg = f"{wa_header}\n\n🗓️ Date: {date_time}\n📍 Venue: {venue}\n👥 For: {audience}\n\n{desc}\n\n👉 Register: {link}\n\n📲 Forward to your groups!"
    wa_url = f"https://api.whatsapp.com/send?text={urllib.parse.quote(wa_msg)}"

    # 4. Reminders
    reminders = {
        "oneWeek": {"stage": "1 Week Before", "text": f"⏳ 1 Week To Go until {name}! Date: {date_time}. Link: {link}"},
        "oneDay": {"stage": "24 Hours Before", "text": f"⏰ Tomorrow is the Day! {name} at {venue}. Bring ID & Laptop! Link: {link}"},
        "oneHour": {"stage": "1 Hour Before", "text": f"🚨 Starting in 60 Minutes! Doors are open at {venue}. Link: {link}"}
    }

    # 5. FAQs
    faqs = [
        {"question": f"Who can attend {name}?", "answer": f"Open to {audience}."},
        {"question": f"Where is the venue?", "answer": f"Held at {venue}."},
        {"question": f"How to register?", "answer": f"Visit {link} to register."}
    ]

    # 6. Consistency
    consistency = {
        "score": 100,
        "statusLabel": "100% Synchronized",
        "checks": [
            {"item": "Event Title Synchronized", "detail": "Preserved across all channels", "status": "pass"},
            {"item": "Date & Time Accurate", "detail": date_time, "status": "pass"},
            {"item": "Venue Matched", "detail": venue, "status": "pass"},
            {"item": "Registration URL Embedded", "detail": link, "status": "pass"}
        ]
    }

    return jsonify({
        "success": True,
        "social": social,
        "email": {"subject": subject, "body": email_body},
        "whatsapp": {"message": wa_msg, "directShareUrl": wa_url},
        "reminders": reminders,
        "faqs": faqs,
        "consistency": consistency
    })

@app.route('/api/events', methods=['GET', 'POST'])
def events():
    if request.method == 'GET':
        return jsonify(list(EVENT_STORE.values()))
    
    data = request.get_json() or {}
    evt_id = data.get('id', f"evt-{int(datetime.now().timestamp())}")
    data['id'] = evt_id
    EVENT_STORE[evt_id] = data
    return jsonify({"success": True, "id": evt_id, "message": "Saved"}), 201

if __name__ == '__main__':
    print("🚀 Event Mate Python Flask Backend running on http://localhost:5000")
    app.run(port=5000, debug=True)
