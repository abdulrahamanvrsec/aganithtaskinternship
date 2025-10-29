# SOCRP Certification & Membership System

A full-stack prototype that powers the SOCRP (Society of Certified Recruitment Professionals) membership experience. Candidates
can register, verify their account via email tokens, maintain rich professional profiles, generate shareable profile links, and
admins can manage the entire lifecycle from a dedicated control center.

## ✨ Highlights
- **Self-service registration** with secure password hashing, profile photo, and resume uploads.
- **Automated membership IDs** once an email verification link is confirmed (`SOCRP-YYYY-XXXXX` format).
- **Dynamic profile editor** supporting unlimited education and work experience entries, plus skills, languages, and resume
  re-uploads.
- **Profile sharing** through expiring links (1/2/7 days) with real-time access logs and downloadable resumes.
- **Admin dashboard** featuring stats (total/active/pending/blocked), full profile overrides, and the ability to block/unblock members.
- **Read-only employer view** that renders the shared profile with resume downloads without exposing edit actions.

## 🗂️ Project Structure
```
.
├── book-finder/           # React single-page application (member + admin portals, employer share view)
├── server/                # Python standard-library backend (HTTP + SQLite)
└── README.md              # Project overview and instructions
```

## ⚙️ Backend (Python, SQLite, Stdlib HTTP)
The backend is implemented with Python's standard library so that no external packages are required.

### Prerequisites
- Python 3.10+

### Run the API server
```bash
python -m venv venv
source venv/bin/activate
python server/main.py
```
The server listens on `http://0.0.0.0:8000` by default. Data is stored under `server/data/socrp.db`.

### Environment variables
| Variable | Description | Default |
| --- | --- | --- |
| `SOCRP_SECRET` | HMAC secret for auth tokens | `super-secret-key` |
| `SOCRP_DB_PATH` | Custom SQLite file path | `server/data/socrp.db` |
| `SOCRP_ADMIN_EMAIL` | Seed admin email | `admin@socrp.local` |
| `SOCRP_ADMIN_PASSWORD` | Seed admin password | `admin123` |

### Key Endpoints
| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Register a new member (JSON payload, base64 file uploads) |
| `GET` | `/api/verify?token=` | Confirm email verification and activate account |
| `POST` | `/api/login` | Member login -> Bearer token |
| `GET/PUT` | `/api/me` | Retrieve/update authenticated member profile |
| `POST` | `/api/me/share-links` | Create a timed share link (1/2/7 day options) |
| `GET` | `/api/me/share-links` | List share links with view counts |
| `GET` | `/share/{token}` | Employer read-only profile view + logging |
| `GET` | `/share/{token}/resume` | Download resume tied to share link |
| `POST` | `/api/admin/login` | Admin authentication |
| `GET` | `/api/admin/stats` | Dashboard metrics |
| `GET` | `/api/admin/users` | Membership table |
| `GET/PUT` | `/api/admin/users/{id}` | Full profile view & override |
| `POST` | `/api/admin/users/{id}/block` | Block a member |
| `POST` | `/api/admin/users/{id}/unblock` | Reactivate a member |

Passwords are hashed using PBKDF2 (`hashlib.pbkdf2_hmac`) with HMAC-signed tokens, so no external crypto dependencies are required.

## 💻 Frontend (React + Tailwind)
The existing Vite project has been transformed into a full-featured SPA covering all three day requirements.

### Run the web app
```bash
cd book-finder
npm install
npm run dev
```
The dev server runs at `http://localhost:5173`. Configure `VITE_API_URL` in `.env` if the backend is hosted elsewhere (defaults to
`http://localhost:8000`).

### Major Views
- **Landing Page** – overview, feature matrix, quick access to registration/login/admin panels.
- **Registration** – collects all required fields and surfaces the verification link returned by the API.
- **Verification** – paste a token to activate an account (useful for demo/testing flows).
- **Member Workspace** – authenticated profile editor with education, experience, skills, languages, resume/photo uploads, and
  share link management.
- **Admin Control Center** – dashboard metrics, searchable user list, full profile editor with block/unblock controls.
- **Share View** – automatically renders when visiting `/share/{token}`; employers can download resumes without editing rights.

## 📬 Demo Workflow
1. **Register** a new member, upload photo/resume, copy the verification link returned.
2. **Verify** the account using the Verify Email card (or hit the `/api/verify` endpoint directly).
3. **Login** as the member, enrich the profile with education/experience data, and generate share links.
4. Visit the share URL (e.g., `http://localhost:8000/share/{token}`) to see the read-only employer experience.
5. **Admin Login** using the seeded credentials to review stats, edit member data, or block/unblock accounts.

## 🧪 Notes
- File uploads are accepted as base64 strings from the frontend. Files are persisted under `server/uploads/`.
- Share link view logs persist viewer info (if supplied) and timestamps in the `share_logs` table.
- The backend suppresses console noise for clarity but prints the server URL at startup.

Enjoy building with SOCRP! 🚀
