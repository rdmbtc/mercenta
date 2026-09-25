import os
import re
import sys
import json
import shutil
import hashlib
import sqlite3
import subprocess
from pathlib import Path
from dotenv import load_dotenv
import httpx
import imageio_ffmpeg
import higgsfield_client
from higgsfield_client import SyncClient

SCRIPT_DIR = Path(__file__).parent.resolve()
load_dotenv(SCRIPT_DIR / ".env.local")
if not os.getenv("HF_KEY") and not os.getenv("HF_CREDENTIALS"):
    load_dotenv(SCRIPT_DIR / ".env")

if not os.getenv("HF_KEY") and not os.getenv("HF_CREDENTIALS") and not (os.getenv("HF_API_KEY") and os.getenv("HF_API_SECRET")):
    print("Error: Higgsfield credentials not configured in environment (.env.local)", file=sys.stderr)
    sys.exit(1)

MODEL = "bytedance/seedance-2.5/text-to-video"
PROMPT = (
    "A slow, hypnotic, perfectly smooth forward dolly tracking shot moving through an ultra-futuristic "
    "dark obsidian server corridor, polished reflective black glass floor, glowing electric cyan and deep "
    "blue fiber-optic data rails pulsing with light, minimalist server monoliths, subtle atmospheric "
    "volumetric mist, elegant cinematic anamorphic lens lighting, clean enterprise tech infrastructure, "
    "photorealistic 8k, continuous steady forward camera movement, no coins, no bitcoin, no gold, no "
    "physical currency, no tokens, no text, no logos, no watermark."
)

ARGUMENTS = {
    "prompt": PROMPT,
    "duration": 5,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "output_format": "mp4",
    "generate_audio": False,
}

STATE_DIR = SCRIPT_DIR / "work" / "higgsfield"
DB_PATH = STATE_DIR / "jobs.sqlite3"
FRAMES_DIR = STATE_DIR / "frames"
OUTPUTS_DIR = SCRIPT_DIR / "outputs"
ORIGINAL_VIDEO = OUTPUTS_DIR / "mercenta-vault-original.mp4"
OPTIMIZED_VIDEO = OUTPUTS_DIR / "mercenta-vault-optimized.mp4"
DEST_VIDEO = SCRIPT_DIR / "web" / "public" / "videos" / "mercenta-vault.mp4"
DEST_POSTER = SCRIPT_DIR / "web" / "public" / "videos" / "mercenta-vault-poster.jpg"

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
EXPECTED_DURATION = ARGUMENTS["duration"]
TERMINAL_STATUSES = ("completed", "failed", "rejected", "nsfw", "canceled")
PENDING_MARKER = "__pending_submit__"

def init_db():
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE,
                model TEXT,
                prompt TEXT,
                arguments_json TEXT,
                status TEXT,
                video_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    return conn

def get_existing_request_id(conn):
    """Only reuse a job generated for the *current* prompt; a rejected prompt is never reused."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT request_id, status, video_url FROM jobs WHERE prompt = ? AND model = ? ORDER BY id DESC LIMIT 1",
        (PROMPT, MODEL),
    )
    row = cursor.fetchone()
    if row:
        return row[0], row[1], row[2]
    return None, None, None

def get_pending_submission(conn):
    row = conn.execute("SELECT prompt FROM jobs WHERE request_id = ?", (PENDING_MARKER,)).fetchone()
    return row[0] if row else None

def mark_submission_pending(conn):
    with conn:
        conn.execute("""
            INSERT INTO jobs (request_id, model, prompt, arguments_json, status)
            VALUES (?, ?, ?, ?, 'submitting')
            ON CONFLICT(request_id) DO UPDATE SET
                model = excluded.model,
                prompt = excluded.prompt,
                arguments_json = excluded.arguments_json,
                status = 'submitting',
                updated_at = CURRENT_TIMESTAMP
        """, (PENDING_MARKER, MODEL, PROMPT, json.dumps(ARGUMENTS)))

def clear_pending_submission(conn):
    with conn:
        conn.execute("DELETE FROM jobs WHERE request_id = ?", (PENDING_MARKER,))

def persist_request_id(conn, request_id: str, status: str = "queued"):
    with conn:
        conn.execute("""
            INSERT INTO jobs (request_id, model, prompt, arguments_json, status)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(request_id) DO UPDATE SET
                status = excluded.status,
                updated_at = CURRENT_TIMESTAMP
        """, (request_id, MODEL, PROMPT, json.dumps(ARGUMENTS), status))

def update_job_status(conn, request_id: str, status: str, video_url: str = None):
    with conn:
        conn.execute("""
            UPDATE jobs
            SET status = ?, video_url = COALESCE(?, video_url), updated_at = CURRENT_TIMESTAMP
            WHERE request_id = ?
        """, (status, video_url, request_id))

def fetch_account_estimate(client: SyncClient):
    try:
        resp = client._client.post(f"/estimate/{MODEL}", json=ARGUMENTS)
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"HTTP {resp.status_code}", "detail": resp.text}
    except Exception as exc:
        return {"error": str(exc)}

def extract_video_url(data: dict):
    if not isinstance(data, dict):
        return None
    if isinstance(data.get("video"), dict) and "url" in data["video"]:
        return data["video"]["url"]
    if isinstance(data.get("output"), dict) and "url" in data["output"]:
        return data["output"]["url"]
    if isinstance(data.get("url"), str):
        return data["url"]
    if isinstance(data.get("video_url"), str):
        return data["video_url"]
    for _, value in data.items():
        if isinstance(value, dict) and "url" in value:
            return value["url"]
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict) and "url" in item:
                    return item["url"]
                if isinstance(item, str) and (item.startswith("http://") or item.startswith("https://")) and any(item.endswith(ext) for ext in [".mp4", ".mov"]):
                    return item
    return None

def download_file(url: str, dest_path: Path):
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = dest_path.with_suffix(dest_path.suffix + ".part")
    total = 0
    with httpx.stream("GET", url, timeout=120.0, follow_redirects=True) as response:
        response.raise_for_status()
        with open(temp_path, "wb") as f:
            for chunk in response.iter_bytes(chunk_size=1024 * 1024):
                f.write(chunk)
                total += len(chunk)
    if total < 50_000:
        temp_path.unlink(missing_ok=True)
        raise RuntimeError(f"Downloaded media looks truncated ({total} bytes) from {url}")
    temp_path.replace(dest_path)
    print(f"[Media] Downloaded {dest_path.name} ({total} bytes) -> {dest_path}", flush=True)

def _decode_log(video_path: Path):
    proc = subprocess.run(
        [FFMPEG, "-hide_banner", "-nostdin", "-i", str(video_path), "-map", "0:v:0", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg could not decode {video_path.name}: {proc.stderr.strip()[-400:]}")
    return proc.stderr

def inspect_video(video_path: Path, label: str):
    """Fully decode a clip to prove integrity, then report real dimensions, duration and frame count."""
    log = _decode_log(video_path)
    dim = re.search(r"Video:.*?,\s*(\d{2,5})x(\d{2,5})", log)
    dur = re.search(r"Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)", log)
    frames = re.findall(r"frame=\s*(\d+)", log)
    if not dim or not dur or not frames:
        raise RuntimeError(f"{label}: missing stream metadata while decoding {video_path.name}")
    seconds = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))
    info = {
        "path": str(video_path),
        "bytes": video_path.stat().st_size,
        "width": int(dim.group(1)),
        "height": int(dim.group(2)),
        "duration_s": round(seconds, 2),
        "frames": int(frames[-1]),
    }
    print(
        f"[Media] {label} fully decoded: {info['width']}x{info['height']} | {info['duration_s']}s | "
        f"{info['frames']} frames | {info['bytes']} bytes",
        flush=True,
    )
    return info

def extract_frame(video_path: Path, seconds: float, dest: Path, quality: int = 2):
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [FFMPEG, "-hide_banner", "-nostdin", "-y", "-ss", f"{seconds:.3f}", "-i", str(video_path),
         "-frames:v", "1", "-q:v", str(quality), str(dest)],
        check=True, capture_output=True, text=True,
    )
    return dest

def inspect_frames(video_path: Path, duration_s: float):
    """Sample frames across the clip; identical samples mean frozen/black output."""
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    stamps = [0.4, duration_s / 2, max(0.8, duration_s - 0.4)]
    digests = []
    for index, seconds in enumerate(stamps, start=1):
        frame = extract_frame(video_path, seconds, FRAMES_DIR / f"frame-{index}-{seconds:.1f}s.jpg")
        digest = hashlib.md5(frame.read_bytes()).hexdigest()
        digests.append(digest)
        print(f"[Media] Frame @{seconds:.1f}s -> {frame.name} ({frame.stat().st_size} bytes, md5 {digest[:10]})", flush=True)
    if len(set(digests)) != len(digests):
        raise RuntimeError("Sampled frames are identical; the clip is static, refusing to publish.")
    print(f"[Media] Frame inspection OK: {len(digests)} distinct frames sampled across {duration_s}s", flush=True)
    return digests

def encode_scrub_friendly(source: Path, dest: Path):
    """Silent H.264 with a short GOP and faststart so scroll scrubbing stays frame-accurate."""
    subprocess.run(
        [FFMPEG, "-hide_banner", "-nostdin", "-y", "-i", str(source),
         "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
         "-profile:v", "high", "-level", "4.0",
         "-g", "12", "-keyint_min", "12", "-sc_threshold", "0",
         "-movflags", "+faststart", str(dest)],
        check=True, capture_output=True, text=True,
    )
    print(f"[Media] Re-encoded for scrubbing (GOP 12, no audio, faststart) -> {dest} ({dest.stat().st_size} bytes)", flush=True)
    return dest

def handle_completion(video_url: str, conn, request_id: str):
    print("-" * 40, flush=True)
    print(f"Video URL: {video_url}", flush=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[Media] Archiving provider original to {ORIGINAL_VIDEO}", flush=True)
    download_file(video_url, ORIGINAL_VIDEO)
    source = inspect_video(ORIGINAL_VIDEO, "Original")
    if abs(source["duration_s"] - EXPECTED_DURATION) > 1.0:
        print(f"[Media] Warning: provider duration {source['duration_s']}s differs from requested {EXPECTED_DURATION}s", flush=True)
    inspect_frames(ORIGINAL_VIDEO, source["duration_s"])

    encode_scrub_friendly(ORIGINAL_VIDEO, OPTIMIZED_VIDEO)
    optimized = inspect_video(OPTIMIZED_VIDEO, "Optimized")
    if (optimized["width"], optimized["height"]) != (source["width"], source["height"]):
        raise RuntimeError("Optimized clip changed dimensions; refusing to replace public media.")
    if abs(optimized["frames"] - source["frames"]) > 1:
        raise RuntimeError("Optimized clip lost frames; refusing to replace public media.")

    video_tmp = DEST_VIDEO.with_name(DEST_VIDEO.name + ".tmp")
    poster_tmp = DEST_POSTER.with_name(DEST_POSTER.name + ".tmp.jpg")
    video_tmp.parent.mkdir(parents=True, exist_ok=True)
    extract_frame(OPTIMIZED_VIDEO, max(0.4, optimized["duration_s"] / 2), poster_tmp)
    if poster_tmp.stat().st_size < 4096:
        raise RuntimeError("Poster frame is empty; refusing to replace public media.")
    print(f"[Media] Poster derived from decoded frame: {poster_tmp} ({poster_tmp.stat().st_size} bytes)", flush=True)

    shutil.copyfile(OPTIMIZED_VIDEO, video_tmp)
    os.replace(video_tmp, DEST_VIDEO)
    os.replace(poster_tmp, DEST_POSTER)
    print(f"[Media] Public media replaced: {DEST_VIDEO} ({DEST_VIDEO.stat().st_size} bytes) | "
          f"{DEST_POSTER} ({DEST_POSTER.stat().st_size} bytes)", flush=True)
    print("-" * 40, flush=True)

def publish(video_url: str, conn, request_id: str):
    try:
        handle_completion(video_url, conn, request_id)
    except Exception as exc:
        print(f"\n[Media Error] {exc}", file=sys.stderr, flush=True)
        sys.exit(1)

def main():
    print("=" * 40, flush=True)
    print("Higgsfield B2B Commerce OS Video Generation", flush=True)
    print(f"Model: {MODEL}", flush=True)
    print(f"Duration: {ARGUMENTS['duration']}s | Resolution: {ARGUMENTS['resolution']} | 16:9 | Silent MP4", flush=True)
    print(f"Prompt: {PROMPT}", flush=True)
    print("=" * 40, flush=True)

    conn = init_db()

    # 0. Never resubmit after an uncertain submission (a timeout can still mean the provider accepted it)
    pending_prompt = get_pending_submission(conn)
    if pending_prompt == PROMPT:
        print("\n[Uncertain Submission] A previous run submitted this prompt without confirming enqueue.", file=sys.stderr, flush=True)
        print("[Uncertain Submission] Not submitting again. Check the Higgsfield console for the matching request, then recover it explicitly.", file=sys.stderr, flush=True)
        sys.exit(1)
    if pending_prompt:
        print("[Warning] Stale uncertain-submission marker for a different prompt; starting a fresh job.", flush=True)

    existing_rid, existing_status, existing_url = get_existing_request_id(conn)

    client = SyncClient()

    # 1. Validate Live Model Docs / Schema & Account Estimate
    print("\n[Step 1] Fetching live account estimate...", flush=True)
    estimate_info = fetch_account_estimate(client)
    print(f"Account Estimate: {json.dumps(estimate_info, indent=2)}", flush=True)

    # 2. Check existing / in-flight request to avoid duplicate charges
    if existing_rid:
        print(f"\n[Deduplication] Found existing persisted request ID for this prompt: {existing_rid} (status: {existing_status})", flush=True)
        if existing_status not in TERMINAL_STATUSES:
            print(f"[Recovery] Polling existing request {existing_rid} rather than submitting duplicate...", flush=True)
            try:
                res = client.result(existing_rid)
                v_url = extract_video_url(res)
                if v_url:
                    update_job_status(conn, existing_rid, "completed", v_url)
                    publish(v_url, conn, existing_rid)
                    return
                print(f"[Recovery] Request {existing_rid} is still in flight; no duplicate submission made.", flush=True)
                return
            except Exception as e:
                print(f"[Recovery Error] Could not recover request {existing_rid}: {e}", flush=True)
                print("[Recovery] Not resubmitting; resolve the existing request first.", flush=True)
                return

        if existing_status == "completed" and existing_url:
            print(f"[Status] Existing generation already completed: {existing_url}", flush=True)
            if not (DEST_VIDEO.exists() and DEST_POSTER.exists()):
                publish(existing_url, conn, existing_rid)
            return

    # 3. Call higgsfield_client.subscribe as requested
    print("\n[Step 2] Submitting generation request via higgsfield_client.subscribe...", flush=True)

    def on_enqueue(request_id: str) -> None:
        print(f"[Higgsfield] Enqueued. Persisting Request ID immediately: {request_id}", flush=True)
        persist_request_id(conn, request_id, "queued")
        clear_pending_submission(conn)

    def on_queue_update(status) -> None:
        status_name = type(status).__name__
        print(f"[Higgsfield] Status update: {status_name}", flush=True)

    mark_submission_pending(conn)
    try:
        result = higgsfield_client.subscribe(
            MODEL,
            arguments=ARGUMENTS,
            on_enqueue=on_enqueue,
            on_queue_update=on_queue_update,
        )
    except higgsfield_client.InsufficientCreditsError as err:
        clear_pending_submission(conn)
        print(f"\n[Higgsfield Error] Insufficient credits: {err}", file=sys.stderr, flush=True)
        sys.exit(1)
    except higgsfield_client.CredentialsMissedError as err:
        clear_pending_submission(conn)
        print(f"\n[Higgsfield Error] Credentials missing: {err}", file=sys.stderr, flush=True)
        sys.exit(1)
    except Exception as err:
        print(f"\n[Higgsfield Client Error] {err}", file=sys.stderr, flush=True)
        print("[Uncertain Submission] Enqueue was not confirmed, so this prompt is marked uncertain and will not be resubmitted automatically.", file=sys.stderr, flush=True)
        sys.exit(1)

    status_str = result.get("status", "").lower() if isinstance(result, dict) else ""
    request_id = result.get("request_id") if isinstance(result, dict) else None
    if request_id:
        persist_request_id(conn, request_id, status_str or "queued")
        clear_pending_submission(conn)
    print(f"\n[Higgsfield] Job finished. Request ID: {request_id} | Status: {status_str or 'unknown'}", flush=True)

    if status_str == "completed":
        video_url = extract_video_url(result)
        if request_id:
            update_job_status(conn, request_id, "completed", video_url)
        if video_url:
            publish(video_url, conn, request_id)
        else:
            print(f"[Warning] Completed but no video URL found in payload: {result}", file=sys.stderr, flush=True)
            sys.exit(1)
    else:
        if request_id:
            update_job_status(conn, request_id, status_str)
        print(f"[Higgsfield] Finished with non-completed status: {status_str}, payload: {result}", file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
