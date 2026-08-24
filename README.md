# 🚀 CarpenterBullet WhatsApp CRM

A modern, high-performance WhatsApp CRM web application designed for fast, personalized bulk messaging directly from your linked WhatsApp number — **without requiring Meta Cloud API approvals or credit cards**.

---

## ✨ Key Features

1. **📱 Built-in WhatsApp QR Code Linking (No Meta API Needed)**
   - Link your existing WhatsApp account by scanning the on-screen QR Code (**WhatsApp > Linked Devices > Link a Device**).
   - Securely maintains an encrypted multi-device session.
   - Built-in Sandbox / Simulation Mode for instant UI and workflow testing.

2. **📊 CSV & Excel Auto-Dispatcher (The Star Feature)**
   - **Step 1**: Drag & drop any CSV or Excel file (`sample_contacts.csv` included).
   - **Step 2**: Auto-detects columns (`Name`, `Phone`, `City`, `Product`, `Discount`, custom fields).
   - **Step 3**: Compose messages with dynamic variable pills (e.g. `{{Name}}`, `{{City}}`, `{{Product}}`, `{{Discount}}`).
   - **Step 4**: **Interactive WhatsApp Chat Mockup** displays real-time previews of the message layout.
   - **Step 5**: **Personalized Preview Grid** lets you inspect every recipient's customized message before sending.
   - **Step 6**: **1-Click Launch** with humanized anti-ban delays (e.g., 3s–6s) and live real-time progress bar with pause/resume/stop controls.

3. **👥 Contacts & Tag Directory**
   - Manage customer lists, tags (`VIP Customer`, `Wholesale`, `Retail`, `Lead`), custom attributes, and opt-in records.
   - Deduplicated CSV importing with automatic field mapping.

4. **📝 Message Template Library**
   - Create reusable templates with dynamic variable placeholders and media attachments (Images, PDFs).

5. **📈 Dashboard & Live Delivery Logs**
   - KPI metrics: Total Messages Sent, Today's Sent, Success Delivery Rate, Total Contacts, Active Campaigns.
   - Live audit logs showing exact dispatched text, timestamps, and delivery statuses.

6. **🛡️ Anti-Ban Safety Throttle**
   - Configurable randomized delay intervals between messages to prevent account restrictions.
   - Default country code prefixing (e.g., `+91`).

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios
- **Backend Core**: Python 3, FastAPI, SQLAlchemy ORM, SQLite / PostgreSQL, Pydantic v2
- **WhatsApp Gateway**: Node.js, `@whiskeysockets/baileys` multi-device engine, Express, QR Code generator

---

## 🚀 Quick Start (Single Command)

To run all services simultaneously (WhatsApp Gateway, FastAPI Backend, and Vite Frontend):

```bash
./start.sh
```

### Access URLs:
- **Web App Frontend**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **WhatsApp Gateway Status**: [http://localhost:3001/status](http://localhost:3001/status)

---

## 💻 Manual Step-by-Step Launch

If you prefer starting each service in separate terminal tabs:

### 1. Start WhatsApp Gateway Service:
```bash
cd whatsapp-service
npm install
npm start
# Runs on port 3001
```

### 2. Start FastAPI Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Runs on port 8000
```

### 3. Start Frontend:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 📋 Sample CSV Format

You can upload any CSV or Excel file. Example format (`sample_contacts.csv`):

| Name | Phone | City | Product | Discount | Price | OrderId |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Rajesh Kumar | 919876543210 | Mumbai | Solid Teak Dining Table | 20% | ₹32,999 | CB-1001 |
| Priya Sharma | 919823456789 | Delhi | Luxury Velvet Sofa | 15% | ₹45,000 | CB-1002 |
| Amit Patel | 919812345678 | Ahmedabad | Modular Kitchen Island | 25% | ₹58,500 | CB-1003 |

Placeholders like `{{Name}}`, `{{City}}`, `{{Product}}`, `{{Discount}}`, and `{{Price}}` in your message template are automatically replaced with each contact's data.

---

## 📱 Linking Your Phone via QR Code

1. Open [http://localhost:5173](http://localhost:5173).
2. Click **"Link WhatsApp Device (QR)"** in the top navigation bar.
3. Open **WhatsApp** on your mobile phone.
4. Go to **Settings / Menu (⋮)** > **Linked Devices** > **Link a Device**.
5. Point your camera at the QR code on the screen.
6. The status pill will instantly turn **🟢 Connected** with your phone number displayed!

*(Optional: Click "Enable Instant Sandbox / Simulation Mode" in the modal to test the complete UI and sending flow without a physical phone!)*
