import base64, json, urllib.request, sys

token = os.environ.get('GIT_TOKEN', '')

files_to_push = [
    ("frontend/src/store/user.ts", r"d:\Trae\Trae CN\88\frontend\src\store\user.ts"),
    ("frontend/src/api/request.ts", r"d:\Trae\Trae CN\88\frontend\src\api\request.ts"),
]

for repo_path, local_path in files_to_push:
    api_url = f"https://api.github.com/repos/sy25255/dorm-match/contents/{repo_path}"
    
    # Get current SHA
    req = urllib.request.Request(api_url, headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        sha = json.loads(resp.read().decode())["sha"]
    
    # Read local file
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode("ascii")
    
    # Push
    body = json.dumps({
        "message": f"fix: logout no longer clears all localStorage (preserve invite/pairing data)",
        "content": content,
        "sha": sha,
        "branch": "master"
    }).encode("utf-8")
    
    req2 = urllib.request.Request(api_url, data=body, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }, method="PUT")
    
    with urllib.request.urlopen(req2, timeout=15) as resp:
        result = json.loads(resp.read().decode())
        print(f"OK: {repo_path} -> commit {result['commit']['sha'][:8]}")

print("All files pushed!")