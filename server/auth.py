import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Optional

SECRET_KEY = os.getenv("SOCRP_SECRET", "super-secret-key")
ITERATIONS = 120_000


def hash_password(password: str) -> Dict[str, str]:
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return {
        "salt": base64.b64encode(salt).decode(),
        "hash": base64.b64encode(pwd_hash).decode(),
    }


def verify_password(password: str, salt: str, pwd_hash: str) -> bool:
    salt_bytes = base64.b64decode(salt.encode())
    expected = base64.b64decode(pwd_hash.encode())
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt_bytes, ITERATIONS)
    return hmac.compare_digest(expected, check)


def _sign(data: bytes) -> str:
    signature = hmac.new(SECRET_KEY.encode(), data, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(signature).decode().rstrip("=")


def create_token(payload: Dict[str, Any], expires_in: int = 3600) -> str:
    payload = dict(payload)
    payload["exp"] = int(time.time()) + expires_in
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    token_body = base64.urlsafe_b64encode(payload_bytes).decode().rstrip("=")
    signature = _sign(token_body.encode())
    return f"{token_body}.{signature}"


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        token_body, signature = token.split(".")
    except ValueError:
        return None
    expected_sig = _sign(token_body.encode())
    if not hmac.compare_digest(signature, expected_sig):
        return None
    padded_body = token_body + "=" * (-len(token_body) % 4)
    payload_bytes = base64.urlsafe_b64decode(padded_body.encode())
    payload = json.loads(payload_bytes.decode())
    if payload.get("exp", 0) < time.time():
        return None
    return payload
