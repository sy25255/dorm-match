import base64, json, urllib.request, sys

token = os.environ.get('GIT_TOKEN', '')
file_path = r"d:\Trae\Trae CN\88\frontend\src\api\request.ts"
api_url = "https://api.github.com/repos/sy25255/dorm-match/contents/frontend/src/api/request.ts"

# Step 1: Get current file SHA
req_get = urllib.request.Request(
    api_url,
    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"}
)
try:
    with urllib.request.urlopen(req_get, timeout=30) as resp:
        current = json.loads(resp.read().decode())
        sha = current["sha"]
        print(f"Current SHA: {sha[:8]}")
except Exception as e:
    print(f"Get SHA error: {e}")
    sys.exit(1)

# Step 2: Read local file
with open(file_path, "rb") as f:
    content_bytes = f.read()
content_b64 = base64.b64encode(content_bytes).decode("ascii")
print(f"Local file size: {len(content_bytes)} bytes")

# Step 3: Update file
body = json.dumps({
    "message": "fix: invite persistence - parseBody + demo mode interceptor + m refactor",
    "content": content_b64,
    "sha": sha,
    "branch": "master"
}).encode("utf-8")

req_put = urllib.request.Request(
    api_url, data=body,
    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json"},
    method="PUT"
)

try:
    with urllib.request.urlopen(req_put, timeout=30) as resp:
        result = json.loads(resp.read().decode())
        print(f"OK: commit {result['commit']['sha'][:8]}")
except Exception as e:
    print(f"Put error: {e}")