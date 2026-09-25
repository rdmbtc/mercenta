import os
import sys
import json
from dotenv import load_dotenv
import higgsfield_client

# Load credentials from .env.local first, fallback to .env
load_dotenv(".env.local")
if not os.getenv("HF_KEY"):
    load_dotenv(".env")

# Verify credentials are set without exposing or printing secrets
if not os.getenv("HF_KEY") and not (os.getenv("HF_API_KEY") and os.getenv("HF_API_SECRET")):
    print("Error: Higgsfield credentials not configured. Please ensure HF_KEY is set in .env.local", file=sys.stderr)
    sys.exit(1)

MODEL = "bytedance/seedance-2.5/text-to-video"
ARGUMENTS = {
    "prompt": "A cinematic scene at sunset",
    "duration": 5,
    "resolution": "720p",
    "aspect_ratio": "16:9",
}

def on_enqueue(request_id: str) -> None:
    print(f"[Higgsfield] Request enqueued successfully. Request ID: {request_id}", flush=True)

def on_queue_update(status) -> None:
    status_name = type(status).__name__
    print(f"[Higgsfield] Polling update: Status = {status_name}", flush=True)

def extract_video_url(data: dict):
    if not isinstance(data, dict):
        return None
        
    # Common response structures
    if isinstance(data.get("video"), dict) and "url" in data["video"]:
        return data["video"]["url"]
    if isinstance(data.get("output"), dict) and "url" in data["output"]:
        return data["output"]["url"]
    if isinstance(data.get("url"), str):
        return data["url"]
    if isinstance(data.get("video_url"), str):
        return data["video_url"]
    
    # Recursive search for video URL
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

def main():
    print("========================================", flush=True)
    print("Higgsfield Seedance 2.5 Video Generation", flush=True)
    print(f"Model: {MODEL}", flush=True)
    print(f"Prompt: {ARGUMENTS['prompt']}", flush=True)
    print(f"Duration: {ARGUMENTS['duration']}s | Resolution: {ARGUMENTS['resolution']} | Aspect Ratio: {ARGUMENTS['aspect_ratio']}", flush=True)
    print("========================================", flush=True)

    try:
        result = higgsfield_client.subscribe(
            MODEL,
            arguments=ARGUMENTS,
            on_enqueue=on_enqueue,
            on_queue_update=on_queue_update,
        )
    except higgsfield_client.InsufficientCreditsError as err:
        print(f"\n[Higgsfield Error] Insufficient credits: {err}", file=sys.stderr, flush=True)
        sys.exit(1)
    except higgsfield_client.CredentialsMissedError as err:
        print(f"\n[Higgsfield Error] Credentials missing: {err}", file=sys.stderr, flush=True)
        sys.exit(1)
    except higgsfield_client.HiggsfieldClientError as err:
        print(f"\n[Higgsfield Client Error] {err}", file=sys.stderr, flush=True)
        sys.exit(1)
    except Exception as err:
        print(f"\n[Error] Unexpected exception: {err}", file=sys.stderr, flush=True)
        sys.exit(1)

    status_str = result.get("status", "").lower() if isinstance(result, dict) else ""
    print(f"\n[Higgsfield] Job finished. Status: {status_str or 'unknown'}", flush=True)

    if status_str == "completed":
        video_url = extract_video_url(result)
        if video_url:
            print("\n----------------------------------------", flush=True)
            print("GENERATION SUCCESSFUL!", flush=True)
            print(f"Generated Video URL: {video_url}", flush=True)
            print("----------------------------------------", flush=True)
            return
        else:
            print("\n[Warning] Job marked completed, searching payload for video output...", flush=True)
            print("Raw response:", json.dumps(result, indent=2), flush=True)
            sys.exit(1)
    elif status_str in ("failed", "rejected"):
        error_msg = result.get("error") or result.get("detail") or result.get("message") or "Unknown error"
        print(f"\n[Higgsfield Error] Video generation failed: {error_msg}", file=sys.stderr, flush=True)
        sys.exit(1)
    elif status_str == "nsfw":
        print(f"\n[Higgsfield Moderation] Video generation rejected by content filter (NSFW).", file=sys.stderr, flush=True)
        sys.exit(1)
    elif status_str in ("cancelled", "canceled"):
        print(f"\n[Higgsfield Cancelled] Video generation was cancelled.", file=sys.stderr, flush=True)
        sys.exit(1)
    else:
        print(f"\n[Higgsfield] Result: {json.dumps(result, indent=2)}", flush=True)
        video_url = extract_video_url(result)
        if video_url:
            print(f"Generated Video URL: {video_url}", flush=True)
        else:
            sys.exit(1)

if __name__ == "__main__":
    main()
