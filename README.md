# 🚧 PothoSense — Smart Pothole Detection & Management System


PothoSense combines **smartphone sensor intelligence** with **anonymous citizen reporting** and a **powerful staff dashboard** — all for free.

---

## ✨ Unique Features

### Citizen Side
| Feature | Description |
|---|---|
| **Auto-Sensor Detection** | Uses accelerometer/gyroscope via DeviceMotion API — phone shake/bump auto-triggers a report |
| **Offline Queue** | Reports saved locally (IndexedDB) when offline, auto-synced when connected |
| **Photo + GPS Auto-Attach** | Camera snap + GPS coordinates auto-filled on report |
| **Severity Scoring** | Sensor data calculates pothole severity (Minor/Moderate/Severe) automatically |
| **Anonymous Reporting** | Zero PII sent to staff — only location + severity + photo |
| **Duplicate Prevention** | If same GPS ±20m already reported, citizen sees "Already Reported" |
| **Report Tracking** | Citizens get a unique token to track their report status without logging in |
| **Dark/Light Mode** | Full toggle on every page |
| **6-Language Support** | Tamil, Hindi, Telugu, Malayalam, Kannada, English |

### Staff Side (Primary Client — Our Priority)
| Feature | Description |
|---|---|
| **Heatmap Dashboard** | Leaflet.js heatmap showing pothole density by zone |
| **Smart Work Allocation** | Reports auto-assigned to nearest available staff by GPS zone |
| **Priority Queue** | Sorted by severity + days open + traffic density |
| **Photo Evidence View** | Before/after photo comparison |
| **One-Tap Status Update** | "In Progress" / "Resolved" with a single tap |
| **Route Optimization** | Staff sees optimized route for their day's work orders |
| **Analytics Panel** | Monthly resolution rate, average time-to-fix, zone-wise stats |
| **Export Reports** | CSV export for municipal records |
| **Offline Field Mode** | Works without internet, syncs when back in range |

---

## 📊 Pros & Cons (Technical)

### ✅ Pros
- **Zero cost** — React, Node.js, MySQL, Leaflet, all MIT licensed
- **Sensor-driven accuracy** — Accelerometer gives automatic pothole detection, not just manual entry
- **Anonymous by design** — Staff never sees citizen identity
- **Offline-first** — IndexedDB queue ensures no report is lost
- **Scalable** — MySQL can handle 100k+ records; Node cluster for scaling
- **PWA-ready** — Installable on Android/iOS home screen, no app store needed
- **Battery optimized** — Sensor polling only when app is in foreground + adaptive sampling rate

### ❌ Cons (And How We Mitigate)
| Con | Mitigation |
|---|---|
| Battery drain from GPS | Poll GPS only on manual report trigger; use low-accuracy mode for background |
| Accelerometer false positives | Kalman filter + threshold tuning + user confirmation step |
| Photo storage cost | Compress images client-side to <200KB before upload; store on local disk |
| GPS inaccuracy indoors | Show "Low accuracy" warning; require ≥10m accuracy to submit |
| MySQL single point of failure | Daily automated backup script included |
| Cross-browser sensor API | Graceful fallback to manual entry if DeviceMotion not available |

---

## 🗺 Roadmap

```
Week 1: Backend Setup
  ├── MySQL schema design
  ├── Express API (auth, reports, staff)
  └── JWT auth + bcrypt passwords

Week 2: Citizen Frontend  
  ├── Login/Register pages
  ├── Report submission (sensor + manual)
  ├── Track report by token
  └── Dark mode + i18n

Week 3: Staff Frontend
  ├── Staff login + dashboard
  ├── Heatmap (Leaflet)
  ├── Work queue + status updates
  └── Analytics panel

Week 4: Integration & PWA
  ├── Service worker (offline)
  ├── IndexedDB sync queue
  ├── PWA manifest
  └── Testing + deployment (localhost)
```

---

## 🛠 Tech Stack (All Free)
- **Frontend:** React 18, React Router, Leaflet.js, Chart.js
- **Backend:** Node.js, Express, MySQL2, JWT, Multer (file uploads)
- **Database:** MySQL 8
- **PWA:** Workbox (service worker)
- **i18n:** react-i18next
- **Sensors:** Web DeviceMotion API (no library needed)

---

