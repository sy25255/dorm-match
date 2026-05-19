$S = "https://dhzxxqilzvpxdsamukdv.supabase.co"
$SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoenh4cWlsenZweGRzYW11a2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAxMzM2OSwiZXhwIjoyMDk0NTg5MzY5fQ.pGgEN8nZwL7bJreKYiFfWVoeKpPDvRdUvF6VxzbpHtY"
$tmp = "d:\Trae\Trae CN\88\tmp.json"
$utf8e = [System.Text.Encoding]::UTF8

Write-Host "Debug: List users"
curl.exe -s --connect-timeout 15 "$S/auth/v1/admin/users?page=1&per_page=30" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
$raw = [System.IO.File]::ReadAllText($tmp, $utf8e)
Write-Host "Length: $($raw.Length)"
Write-Host "First 400 chars:"
Write-Host $raw.Substring(0, [Math]::Min(400, $raw.Length))
Write-Host "---"

try {
  $users = $raw | ConvertFrom-Json
  if ($users.users) { 
    Write-Host "Has 'users' key, count: $($users.users.Count)"
    $users.users | Select-Object -First 3 | ForEach-Object { Write-Host "  email=$($_.email) id=$($_.id)" }
  }
  elseif ($users -is [array]) { 
    Write-Host "Is array, count: $($users.Count)"
    $users | Select-Object -First 3 | ForEach-Object { Write-Host "  email=$($_.email) id=$($_.id)" }
  }
  else { 
    Write-Host "Other type: $($users.GetType())"
  }
} catch {
  Write-Host "Parse error: $($_.Exception.Message)"
}

# Also check via REST API (auth.users table if accessible)
Write-Host "`nDebug: Try auth.users via REST"
curl.exe -s --connect-timeout 15 "$S/rest/v1/auth.users?select=email,id&limit=5" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
$raw2 = [System.IO.File]::ReadAllText($tmp, $utf8e)
Write-Host "REST response:"
Write-Host $raw2.Substring(0, [Math]::Min(300, $raw2.Length))