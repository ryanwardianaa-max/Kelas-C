#!/usr/bin/env python3
"""
Multi-Agent Debate / Team Runner (5 AI Raksasa)
1. cbai/kimi-k2.6 (Moonshot AI) - Analis logika & detail
2. cbai/glm-5.2 (Zhipu AI) - Kritikus metodologi
3. cbai/minimax-m3 (MiniMax) - Penulis & struktur bahasa
4. neko/qwen3.8-flash (Alibaba) - Komparasi & data luas
5. ag/gemini-3.8-flash-high (Google) - Sintesis final
"""

import os
import sys
import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:20128/v1/chat/completions"
API_KEY = os.environ.get("HERMES_CUSTOM_LOCALHOST_20128_API_KEY", "")

TEAM_MODELS = [
    {
        "id": "cl/deepseek/deepseek-v4.1-flash",
        "alias": "DeepSeek V4.1 Flash",
        "vendor": "Cline OAuth",
        "role": "Lead Logic & Komparasi",
        "system": "Anda adalah DeepSeek V4.1 Flash, Lead Logic tim AI. Analisis alur matematis, rumus, dan konsistensi lelaran."
    },
    {
        "id": "cbai/kimi-k2.6",
        "alias": "Kimi K2.6",
        "vendor": "Moonshot AI asli",
        "role": "Analis logika & detail",
        "system": "Anda adalah Kimi K2.6, analis logika dan detail. Buat analisis komprehensif, terstruktur, berbasis data riil tanpa asumsi."
    },
    {
        "id": "cbai/glm-5.2",
        "alias": "GLM 5.2",
        "vendor": "Zhipu AI asli",
        "role": "Kritikus metodologi",
        "system": "Anda adalah GLM 5.2, kritikus metodologi. Uji kelemahan, celah logika, asumsi yang rapuh, dan edge cases."
    },
    {
        "id": "cbai/minimax-m3",
        "alias": "MiniMax M3",
        "vendor": "MiniMax asli",
        "role": "Penulis & struktur visual",
        "system": "Anda adalah MiniMax M3, spesialis narasi visual dan alur pedagogis matematika Manim."
    },
    {
        "id": "ag/gemini-3.8-flash-high",
        "alias": "Gemini 3.8 Flash High",
        "vendor": "Google OAuth",
        "role": "Sintesis final",
        "system": "Anda adalah Gemini 3.8 Flash High, synthesizer final. Rekonsiliasi seluruh masukan tim menjadi solusi akhir siap pakai."
    }
]

def query_model(model_info, prompt, timeout=40):
    t0 = time.time()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {
        "model": model_info["id"],
        "messages": [
            {"role": "system", "content": model_info["system"]},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "stream": False
    }
    req = urllib.request.Request(BASE_URL, data=json.dumps(payload).encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            dur = time.time() - t0
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            return {
                "model": model_info["id"],
                "alias": model_info["alias"],
                "role": model_info["role"],
                "status": 200,
                "duration": round(dur, 2),
                "content": content
            }
    except Exception as e:
        dur = time.time() - t0
        return {
            "model": model_info["id"],
            "alias": model_info["alias"],
            "role": model_info["role"],
            "status": "ERR",
            "duration": round(dur, 2),
            "error": str(e)
        }

def test_team():
    print("Memulai live probe 5 model tim baru...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(query_model, m, "Katakan OK jika siap.", 25) for m in TEAM_MODELS]
        results = [f.result() for f in futures]
    
    print("\n--- HASIL LIVE PROBE 5 MODEL ---")
    all_ok = True
    for r in results:
        status_str = f"HTTP {r['status']}" if r['status'] == 200 else f"ERR: {r.get('error')}"
        print(f"• {r['model']:<26} | {r['role']:<24} | {status_str} ({r['duration']}s)")
        if r['status'] != 200:
            all_ok = False
    
    if all_ok:
        print("\n5/5 MODEL AKTIF & MERESPON CEPAT!")
    else:
        print("\nAda model yang bermasalah, periksa kembali.")
    return all_ok

if __name__ == "__main__":
    test_team()
