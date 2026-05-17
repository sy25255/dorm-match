import base64
import json
import urllib.request
import urllib.error
import os, sys

TOKEN = os.environ.get('GIT_TOKEN', '')
REPO = 'sy25255/dorm-match'
BASE_URL = f'https://api.github.com/repos/{REPO}/contents'
HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python-deploy',
}

def api_request(url, method='GET', data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP {e.code}: {err_body[:300]}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

def push_file(filepath):
    with open(filepath, 'rb') as f:
        content = f.read()
    
    encoded = base64.b64encode(content).decode()
    api_path = f'{BASE_URL}/{filepath.replace(chr(92), "/")}'
    
    existing = api_request(api_path)
    sha = existing.get('sha') if existing else None
    
    data = {
        'message': f'Update {os.path.basename(filepath)}',
        'content': encoded,
        'branch': 'master',
    }
    if sha:
        data['sha'] = sha
    
    print(f"Pushing: {filepath} ({len(content)} bytes)...", end=' ', flush=True)
    result = api_request(api_path, 'PUT', data)
    if result and 'content' in result:
        print("OK")
        return True
    else:
        print("FAILED")
        return False

files = [
    'frontend/src/api/request.ts',
    'frontend/src/mock/data.ts',
    'frontend/src/router/index.ts',
    'frontend/src/store/user.ts',
    'frontend/src/views/Allocation.vue',
    'frontend/src/views/admin/AdminLayout.vue',
    'frontend/src/views/admin/FeedbackManage.vue',
]

success = 0
for f in files:
    if push_file(f):
        success += 1

print(f"\nDone: {success}/{len(files)} files pushed")

# Trigger Pages build
print("\nDispatching workflow...")
url = f'https://api.github.com/repos/{REPO}/actions/workflows/deploy.yml/dispatches'
req = urllib.request.Request(url, data=json.dumps({'ref': 'master'}).encode(), headers=HEADERS, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print("Pages build dispatched: OK")
except Exception as e:
    print(f"Dispatch failed: {e}")