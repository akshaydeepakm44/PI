import os
import httpx
import time
import json

api_key = os.getenv("AI_API_KEY", "")
base_url = os.getenv("AI_BASE_URL", "http://127.0.0.1:8000/v1")

headers = {"Authorization": f"Bearer {api_key}"}
payload = {
    "model": "current-model",
    "messages": [
        {"role": "system", "content": "You are a JSON assistant. Output only JSON."},
        {"role": "user", "content": "Return a JSON object with key 'status': 'ok' and key 'insights': ['tip 1', 'tip 2']."}
    ],
    "max_tokens": 150,
    "temperature": 0.2
}

t0 = time.time()
res = httpx.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=30.0)
print("Status:", res.status_code, "Duration:", round(time.time() - t0, 2), "s")
print("Response:", res.json()["choices"][0]["message"]["content"])
