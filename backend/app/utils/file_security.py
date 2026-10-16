import os
import re
import hashlib
import uuid
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'pdf', 'docx'}
MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024  # 16 MB

def is_allowed_file(filename: str) -> bool:
    """Check if file has an allowed extension (.pdf, .docx)."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS

def generate_safe_filename(original_filename: str) -> str:
    """
    Sanitizes filename, prevents path traversal, and attaches a unique prefix
    to avoid collisions and security exploits.
    """
    # Clean filename
    clean_name = secure_filename(original_filename)
    if not clean_name:
        clean_name = "resume_document"
    
    # Strip any accidental path characters
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    ext = clean_name.rsplit('.', 1)[-1].lower() if '.' in clean_name else 'pdf'
    base = clean_name.rsplit('.', 1)[0][:50]
    
    unique_id = uuid.uuid4().hex[:10]
    return f"{unique_id}_{base}.{ext}"

def calculate_file_hash(file_bytes: bytes) -> str:
    """Calculates SHA-256 hash of file content to detect duplicates."""
    return hashlib.sha256(file_bytes).hexdigest()

def validate_file_content(file_bytes: bytes, filename: str) -> tuple[bool, str]:
    """Validates size and header magic bytes for PDF and DOCX files."""
    if len(file_bytes) == 0:
        return False, "File is empty (0 bytes)."
    
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return False, f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
    
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    # PDF magic bytes: %PDF-
    if ext == 'pdf':
        if not file_bytes.startswith(b'%PDF-'):
            return False, "Invalid PDF format or corrupted file header."
            
    # DOCX magic bytes: PK\x03\x04 (zip archive)
    elif ext == 'docx':
        if not file_bytes.startswith(b'PK\x03\x04'):
            return False, "Invalid DOCX format or corrupted file header."
            
    return True, "Valid"
