import base64
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

UPLOAD_DIR = Path("server/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def generate_membership_id(seq: int) -> str:
    year = datetime.utcnow().strftime("%Y")
    return f"SOCRP-{year}-{seq:05d}"


def save_file(upload: Optional[dict], prefix: str) -> Optional[str]:
    """Save a base64 encoded upload to disk and return the relative path."""
    if not upload:
        return None
    filename = upload.get("filename")
    content = upload.get("content")
    if not filename or not content:
        return None
    try:
        data = base64.b64decode(content.encode())
    except Exception:
        return None
    ext = Path(filename).suffix
    safe_name = f"{prefix}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}{ext}"
    file_path = UPLOAD_DIR / safe_name
    with open(file_path, "wb") as f:
        f.write(data)
    return str(file_path)


def file_to_base64(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    file_path = Path(path)
    if not file_path.exists():
        return None
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def ensure_admin_seed(conn):
    from .auth import hash_password

    cur = conn.execute("SELECT COUNT(*) as cnt FROM admin_users")
    if cur.fetchone()[0] == 0:
        creds = hash_password(os.getenv("SOCRP_ADMIN_PASSWORD", "admin123"))
        conn.execute(
            "INSERT INTO admin_users (email, password_hash, password_salt) VALUES (?, ?, ?)",
            (
                os.getenv("SOCRP_ADMIN_EMAIL", "admin@socrp.local"),
                creds["hash"],
                creds["salt"],
            ),
        )
