import json
import os
import re
from datetime import datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

from .auth import create_token, decode_token, hash_password, verify_password
from .database import get_connection, init_db
from .utils import ensure_admin_seed, file_to_base64, generate_membership_id, save_file


def json_response(handler: BaseHTTPRequestHandler, status: int, data: dict):
    payload = json.dumps(data).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(payload)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
    handler.end_headers()
    handler.wfile.write(payload)


def binary_response(handler: BaseHTTPRequestHandler, status: int, data: bytes, content_type: str, filename: str):
    handler.send_response(status)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Disposition", f"attachment; filename=\"{filename}\"")
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
    handler.end_headers()
    handler.wfile.write(data)


def parse_json(handler: BaseHTTPRequestHandler):
    length = int(handler.headers.get("Content-Length", 0))
    if length == 0:
        return {}
    body = handler.rfile.read(length).decode("utf-8")
    if not body:
        return {}
    return json.loads(body)


def load_user_profile(conn, user_id: int):
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return None
    education_rows = conn.execute(
        "SELECT id, degree, institution, completion_year, score FROM education WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    experience_rows = conn.execute(
        """
        SELECT id, company, role, start_date, end_date, responsibilities
        FROM experience WHERE user_id = ?
        """,
        (user_id,),
    ).fetchall()
    share_links = conn.execute(
        "SELECT id, token, expires_at, created_at FROM share_links WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    return {
        "id": user["id"],
        "membershipId": user["membership_id"],
        "status": user["status"],
        "fullName": user["full_name"],
        "email": user["email"],
        "phone": user["phone"],
        "dob": user["dob"],
        "gender": user["gender"],
        "contact": user["contact"],
        "address": user["address"],
        "skills": json.loads(user["skills"]) if user["skills"] else [],
        "languages": json.loads(user["languages"]) if user["languages"] else [],
        "profilePhoto": file_to_base64(user["profile_photo_path"]),
        "profilePhotoPath": user["profile_photo_path"],
        "resumePath": user["resume_path"],
        "education": [dict(row) for row in education_rows],
        "experience": [dict(row) for row in experience_rows],
        "shareLinks": [dict(row) for row in share_links],
    }


def ensure_membership_id(conn, user_id: int):
    user = conn.execute("SELECT membership_id FROM users WHERE id = ?", (user_id,)).fetchone()
    if user and user["membership_id"]:
        return user["membership_id"]
    membership_id = generate_membership_id(user_id)
    conn.execute(
        "UPDATE users SET membership_id = ?, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (membership_id, user_id),
    )
    return membership_id


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "SOCRPServer/1.0"

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/register":
            return self.handle_register()
        if parsed.path == "/api/login":
            return self.handle_login()
        if parsed.path == "/api/admin/login":
            return self.handle_admin_login()
        if parsed.path == "/api/me/share-links":
            return self.handle_share_link_create()
        admin_block = re.match(r"^/api/admin/users/(\d+)/(block|unblock)$", parsed.path)
        if admin_block:
            return self.handle_admin_block(int(admin_block.group(1)), admin_block.group(2))
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/me":
            return self.handle_profile_update()
        admin_edit = re.match(r"^/api/admin/users/(\d+)$", parsed.path)
        if admin_edit and self.headers.get("Authorization"):
            return self.handle_admin_edit(int(admin_edit.group(1)))
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/me":
            return self.handle_profile_get()
        if parsed.path == "/api/me/share-links":
            return self.handle_share_links_list()
        if parsed.path == "/api/admin/stats":
            return self.handle_admin_stats()
        if parsed.path == "/api/admin/users":
            return self.handle_admin_users()
        admin_detail = re.match(r"^/api/admin/users/(\d+)$", parsed.path)
        if admin_detail:
            return self.handle_admin_detail(int(admin_detail.group(1)))
        verify = parsed.path == "/api/verify"
        if verify:
            return self.handle_verify(parsed)
        share_profile = re.match(r"^/share/([A-Za-z0-9\-]+)$", parsed.path)
        if share_profile:
            return self.handle_share_profile(share_profile.group(1), parsed)
        resume_download = re.match(r"^/share/([A-Za-z0-9\-]+)/resume$", parsed.path)
        if resume_download:
            return self.handle_share_resume(resume_download.group(1))
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def handle_register(self):
        data = parse_json(self)
        required = ["fullName", "email", "phone", "password"]
        if any(not data.get(field) for field in required):
            return json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Missing required fields"})
        with get_connection() as conn:
            existing = conn.execute("SELECT id FROM users WHERE email = ?", (data["email"],)).fetchone()
            if existing:
                return json_response(self, HTTPStatus.CONFLICT, {"error": "Email already registered"})
            creds = hash_password(data["password"])
            profile_photo_path = save_file(data.get("profilePhoto"), "photo")
            resume_path = save_file(data.get("resume"), "resume")
            cur = conn.execute(
                """
                INSERT INTO users (full_name, email, phone, password_hash, password_salt, profile_photo_path, resume_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data["fullName"],
                    data["email"],
                    data["phone"],
                    creds["hash"],
                    creds["salt"],
                    profile_photo_path,
                    resume_path,
                ),
            )
            user_id = cur.lastrowid
            token = os.urandom(16).hex()
            expires_at = (datetime.utcnow() + timedelta(days=1)).isoformat()
            conn.execute(
                "INSERT INTO verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
                (user_id, token, expires_at),
            )
        verification_link = f"/api/verify?token={token}"
        json_response(
            self,
            HTTPStatus.CREATED,
            {
                "message": "Registration successful. Please verify your email.",
                "verificationLink": verification_link,
            },
        )

    def handle_verify(self, parsed):
        params = parse_qs(parsed.query)
        token = params.get("token", [None])[0]
        if not token:
            return json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Token missing"})
        with get_connection() as conn:
            row = conn.execute(
                "SELECT user_id, expires_at FROM verification_tokens WHERE token = ?",
                (token,),
            ).fetchone()
            if not row:
                return json_response(self, HTTPStatus.NOT_FOUND, {"error": "Invalid token"})
            if datetime.fromisoformat(row["expires_at"]) < datetime.utcnow():
                return json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Token expired"})
            membership_id = ensure_membership_id(conn, row["user_id"])
            conn.execute("DELETE FROM verification_tokens WHERE token = ?", (token,))
        json_response(
            self,
            HTTPStatus.OK,
            {"message": "Account verified", "membershipId": membership_id},
        )

    def handle_login(self):
        data = parse_json(self)
        with get_connection() as conn:
            user = conn.execute(
                "SELECT * FROM users WHERE email = ?",
                (data.get("email"),),
            ).fetchone()
            if not user:
                return json_response(self, HTTPStatus.UNAUTHORIZED, {"error": "Invalid credentials"})
            if user["status"] != "active":
                return json_response(self, HTTPStatus.FORBIDDEN, {"error": f"Account status: {user['status']}"})
            if not verify_password(data.get("password", ""), user["password_salt"], user["password_hash"]):
                return json_response(self, HTTPStatus.UNAUTHORIZED, {"error": "Invalid credentials"})
            token = create_token({"sub": user["id"], "role": "user"}, expires_in=8 * 3600)
        json_response(self, HTTPStatus.OK, {"token": token})

    def handle_profile_get(self):
        payload = self.require_auth(role="user")
        if not payload:
            return
        with get_connection() as conn:
            profile = load_user_profile(conn, payload["sub"])
        if not profile:
            return json_response(self, HTTPStatus.NOT_FOUND, {"error": "User not found"})
        json_response(self, HTTPStatus.OK, {"profile": profile})

    def handle_profile_update(self):
        payload = self.require_auth(role="user")
        if not payload:
            return
        data = parse_json(self)
        with get_connection() as conn:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (payload["sub"],)).fetchone()
            if not user:
                return json_response(self, HTTPStatus.NOT_FOUND, {"error": "User not found"})
            profile_photo_path = user["profile_photo_path"]
            resume_path = user["resume_path"]
            if data.get("profilePhoto"):
                profile_photo_path = save_file(data.get("profilePhoto"), "photo") or profile_photo_path
            if data.get("resume"):
                resume_path = save_file(data.get("resume"), "resume") or resume_path
            conn.execute(
                """
                UPDATE users SET full_name=?, phone=?, dob=?, gender=?, contact=?, address=?, skills=?, languages=?, profile_photo_path=?, resume_path=?, updated_at=CURRENT_TIMESTAMP
                WHERE id=?
                """,
                (
                    data.get("fullName", user["full_name"]),
                    data.get("phone", user["phone"]),
                    data.get("dob"),
                    data.get("gender"),
                    data.get("contact"),
                    data.get("address"),
                    json.dumps(data.get("skills", [])),
                    json.dumps(data.get("languages", [])),
                    profile_photo_path,
                    resume_path,
                    payload["sub"],
                ),
            )
            conn.execute("DELETE FROM education WHERE user_id = ?", (payload["sub"],))
            conn.execute("DELETE FROM experience WHERE user_id = ?", (payload["sub"],))
            for edu in data.get("education", []):
                conn.execute(
                    "INSERT INTO education (user_id, degree, institution, completion_year, score) VALUES (?, ?, ?, ?, ?)",
                    (
                        payload["sub"],
                        edu.get("degree"),
                        edu.get("institution"),
                        edu.get("completionYear"),
                        edu.get("score"),
                    ),
                )
            for exp in data.get("experience", []):
                conn.execute(
                    "INSERT INTO experience (user_id, company, role, start_date, end_date, responsibilities) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        payload["sub"],
                        exp.get("company"),
                        exp.get("designation"),
                        exp.get("from"),
                        exp.get("to"),
                        exp.get("responsibilities"),
                    ),
                )
        json_response(self, HTTPStatus.OK, {"message": "Profile updated"})

    def handle_share_link_create(self):
        payload = self.require_auth(role="user")
        if not payload:
            return
        data = parse_json(self)
        duration_map = {1: 1, 2: 2, 7: 7}
        duration = duration_map.get(data.get("expiresIn", 1), 1)
        token = os.urandom(12).hex()
        expires_at = (datetime.utcnow() + timedelta(days=duration)).isoformat()
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO share_links (user_id, token, expires_at) VALUES (?, ?, ?)",
                (payload["sub"], token, expires_at),
            )
        json_response(
            self,
            HTTPStatus.CREATED,
            {"token": token, "shareUrl": f"/share/{token}", "expiresAt": expires_at},
        )

    def handle_share_links_list(self):
        payload = self.require_auth(role="user")
        if not payload:
            return
        with get_connection() as conn:
            links = conn.execute(
                "SELECT id, token, expires_at, created_at FROM share_links WHERE user_id = ? ORDER BY created_at DESC",
                (payload["sub"],),
            ).fetchall()
            results = []
            for row in links:
                log = conn.execute(
                    "SELECT COUNT(*) as cnt FROM share_logs WHERE share_link_id = ?",
                    (row["id"],),
                ).fetchone()
                results.append(
                    {
                        "token": row["token"],
                        "expiresAt": row["expires_at"],
                        "createdAt": row["created_at"],
                        "views": log["cnt"],
                        "shareUrl": f"/share/{row['token']}",
                    }
                )
        json_response(self, HTTPStatus.OK, {"links": results})

    def handle_share_profile(self, token: str, parsed):
        viewer = parse_qs(parsed.query).get("viewer", [None])[0]
        with get_connection() as conn:
            link = conn.execute(
                "SELECT id, user_id, expires_at FROM share_links WHERE token = ?",
                (token,),
            ).fetchone()
            if not link:
                return json_response(self, HTTPStatus.NOT_FOUND, {"error": "Link not found"})
            if datetime.fromisoformat(link["expires_at"]) < datetime.utcnow():
                return json_response(self, HTTPStatus.GONE, {"error": "Link expired"})
            profile = load_user_profile(conn, link["user_id"])
            conn.execute(
                "INSERT INTO share_logs (share_link_id, viewer_info) VALUES (?, ?)",
                (link["id"], viewer),
            )
        if profile:
            profile.pop("shareLinks", None)
            profile.pop("resumePath", None)
        json_response(self, HTTPStatus.OK, {"profile": profile})

    def handle_share_resume(self, token: str):
        with get_connection() as conn:
            link = conn.execute(
                "SELECT id, user_id, expires_at FROM share_links WHERE token = ?",
                (token,),
            ).fetchone()
            if not link:
                return json_response(self, HTTPStatus.NOT_FOUND, {"error": "Link not found"})
            if datetime.fromisoformat(link["expires_at"]) < datetime.utcnow():
                return json_response(self, HTTPStatus.GONE, {"error": "Link expired"})
            user = conn.execute(
                "SELECT resume_path FROM users WHERE id = ?",
                (link["user_id"],),
            ).fetchone()
        if not user or not user["resume_path"]:
            return json_response(self, HTTPStatus.NOT_FOUND, {"error": "Resume not found"})
        path = user["resume_path"]
        try:
            with open(path, "rb") as f:
                data = f.read()
        except FileNotFoundError:
            return json_response(self, HTTPStatus.NOT_FOUND, {"error": "File missing"})
        filename = os.path.basename(path)
        binary_response(self, HTTPStatus.OK, data, "application/octet-stream", filename)

    def handle_share_links_logs(self, share_id: int):
        with get_connection() as conn:
            logs = conn.execute(
                "SELECT viewer_info, viewed_at FROM share_logs WHERE share_link_id = ? ORDER BY viewed_at DESC",
                (share_id,),
            ).fetchall()
        return [{"viewer": row["viewer_info"], "viewedAt": row["viewed_at"]} for row in logs]

    def handle_admin_login(self):
        data = parse_json(self)
        with get_connection() as conn:
            admin = conn.execute(
                "SELECT * FROM admin_users WHERE email = ?",
                (data.get("email"),),
            ).fetchone()
            if not admin:
                return json_response(self, HTTPStatus.UNAUTHORIZED, {"error": "Invalid credentials"})
            if not verify_password(data.get("password", ""), admin["password_salt"], admin["password_hash"]):
                return json_response(self, HTTPStatus.UNAUTHORIZED, {"error": "Invalid credentials"})
            token = create_token({"sub": admin["id"], "role": "admin"}, expires_in=8 * 3600)
        json_response(self, HTTPStatus.OK, {"token": token})

    def handle_admin_stats(self):
        payload = self.require_auth(role="admin")
        if not payload:
            return
        with get_connection() as conn:
            total = conn.execute("SELECT COUNT(*) as cnt FROM users").fetchone()["cnt"]
            active = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE status='active'").fetchone()["cnt"]
            pending = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE status='pending'").fetchone()["cnt"]
            blocked = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE status='blocked'").fetchone()["cnt"]
        json_response(
            self,
            HTTPStatus.OK,
            {"total": total, "active": active, "pending": pending, "blocked": blocked},
        )

    def handle_admin_users(self):
        payload = self.require_auth(role="admin")
        if not payload:
            return
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT id, membership_id, full_name, email, status FROM users ORDER BY created_at DESC"
            ).fetchall()
            users = [dict(row) for row in rows]
        json_response(self, HTTPStatus.OK, {"users": users})

    def handle_admin_detail(self, user_id: int):
        payload = self.require_auth(role="admin")
        if not payload:
            return
        with get_connection() as conn:
            profile = load_user_profile(conn, user_id)
        if not profile:
            return json_response(self, HTTPStatus.NOT_FOUND, {"error": "User not found"})
        json_response(self, HTTPStatus.OK, {"profile": profile})

    def handle_admin_edit(self, user_id: int):
        payload = self.require_auth(role="admin")
        if not payload:
            return
        data = parse_json(self)
        with get_connection() as conn:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                return json_response(self, HTTPStatus.NOT_FOUND, {"error": "User not found"})
            profile_photo_path = user["profile_photo_path"]
            resume_path = user["resume_path"]
            if data.get("profilePhoto"):
                profile_photo_path = save_file(data.get("profilePhoto"), "photo") or profile_photo_path
            if data.get("resume"):
                resume_path = save_file(data.get("resume"), "resume") or resume_path
            conn.execute(
                """
                UPDATE users SET full_name=?, phone=?, dob=?, gender=?, contact=?, address=?, skills=?, languages=?, status=?, membership_id=?, profile_photo_path=?, resume_path=?, updated_at=CURRENT_TIMESTAMP
                WHERE id=?
                """,
                (
                    data.get("fullName", user["full_name"]),
                    data.get("phone", user["phone"]),
                    data.get("dob"),
                    data.get("gender"),
                    data.get("contact"),
                    data.get("address"),
                    json.dumps(data.get("skills", [])),
                    json.dumps(data.get("languages", [])),
                    data.get("status", user["status"]),
                    data.get("membershipId", user["membership_id"]),
                    profile_photo_path,
                    resume_path,
                    user_id,
                ),
            )
            conn.execute("DELETE FROM education WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM experience WHERE user_id = ?", (user_id,))
            for edu in data.get("education", []):
                conn.execute(
                    "INSERT INTO education (user_id, degree, institution, completion_year, score) VALUES (?, ?, ?, ?, ?)",
                    (
                        user_id,
                        edu.get("degree"),
                        edu.get("institution"),
                        edu.get("completionYear"),
                        edu.get("score"),
                    ),
                )
            for exp in data.get("experience", []):
                conn.execute(
                    "INSERT INTO experience (user_id, company, role, start_date, end_date, responsibilities) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        user_id,
                        exp.get("company"),
                        exp.get("designation"),
                        exp.get("from"),
                        exp.get("to"),
                        exp.get("responsibilities"),
                    ),
                )
        json_response(self, HTTPStatus.OK, {"message": "Profile updated"})

    def handle_admin_block(self, user_id: int, action: str):
        payload = self.require_auth(role="admin")
        if not payload:
            return
        new_status = "blocked" if action == "block" else "active"
        with get_connection() as conn:
            conn.execute(
                "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (new_status, user_id),
            )
        json_response(self, HTTPStatus.OK, {"message": f"User {action}ed"})

    def handle_login_required(self):
        json_response(self, HTTPStatus.UNAUTHORIZED, {"error": "Authentication required"})

    def require_auth(self, role: str):
        auth_header = self.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            self.handle_login_required()
            return None
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if not payload or payload.get("role") != role:
            self.handle_login_required()
            return None
        return payload

    def log_message(self, format, *args):
        # Suppress default logging to keep output tidy
        return


def run_server(host: str = "0.0.0.0", port: int = 8000):
    init_db()
    with get_connection() as conn:
        ensure_admin_seed(conn)
    server = HTTPServer((host, port), RequestHandler)
    print(f"SOCRP backend listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
