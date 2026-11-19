import httpx
import time
import json

headers = {"Authorization": "Bearer sk-datai2i-a100-qwen35-27b-8x3f9z"}
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
res = httpx.post("http://115.244.46.68:8000/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
print("Status:", res.status_code, "Duration:", round(time.time() - t0, 2), "s")
print("Response:", res.json()["choices"][0]["message"]["content"])
