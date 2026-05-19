$S = "https://dhzxxqilzvpxdsamukdv.supabase.co"
$SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoenh4cWlsenZweGRzYW11a2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAxMzM2OSwiZXhwIjoyMDk0NTg5MzY5fQ.pGgEN8nZwL7bJreKYiFfWVoeKpPDvRdUvF6VxzbpHtY"
$utf8 = New-Object System.Text.UTF8Encoding($false)
$utf8e = [System.Text.Encoding]::UTF8
$tmp = "d:\Trae\Trae CN\88\tmp.json"

Write-Host "===== FINAL Simulation ====="

# Step 1: List users & find our 10
Write-Host "`n-- List users --"
$allU = @(); $pg = 1
do {
    curl.exe -s --connect-timeout 15 "$S/auth/v1/admin/users?page=$pg&per_page=50" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
    $po = [System.IO.File]::ReadAllText($tmp, $utf8e) | ConvertFrom-Json
    if ($po.users) { $allU += $po.users; $pg++; if ($po.users.Count -lt 50) { break } } else { break }
} while ($true)
Write-Host "Total users: $($allU.Count)"

$users = @()
for ($i = 1; $i -le 10; $i++) {
    $em = "final_${i}@test.school"
    $found = $null
    foreach ($u in $allU) { if ($u.email -eq $em) { $found = $u; break } }
    if ($found) {
        $users += @{id=$found.id; name="Final$i"}
        Write-Host "  Final$i = $($found.id)"
    } else {
        Write-Host "  Final$i NOT FOUND (creating...)"
        $body = "{`"email`":`"$em`",`"password`":`"Test123456`",`"email_confirm`":true,`"user_metadata`":{`"name`":`"Final$i`",`"school_code`":`"DEMO-UNI`"}}"
        [System.IO.File]::WriteAllText($tmp, $body, $utf8)
        $code = curl.exe -s --connect-timeout 15 -X POST "$S/auth/v1/admin/users" -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" --data-binary "@$tmp" -o $tmp -w "%{http_code}"
        if ($code -eq "200" -or $code -eq "201") {
            $obj = ([System.IO.File]::ReadAllText($tmp, $utf8e)) | ConvertFrom-Json
            $users += @{id=$obj.id; name="Final$i"}
            Write-Host "    Created: $($obj.id)"
        } else { Write-Host "    FAIL: $code" }
    }
    Start-Sleep -Milliseconds 300
}
Write-Host "Users found: $($users.Count)"

# Step 2: Get question IDs
Write-Host "`n-- Get questions --"
$qsUrl = "$S/rest/v1/survey_questions?status=eq.1&order=sort_order"
curl.exe -s --connect-timeout 15 $qsUrl -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
$qsRaw = [System.IO.File]::ReadAllText($tmp, $utf8e)
Write-Host "Raw QS length: $($qsRaw.Length)"

# Debug: show first 300 chars
Write-Host "First 300: $($qsRaw.Substring(0, [Math]::Min(300, $qsRaw.Length)))"

$qObjs = $qsRaw | ConvertFrom-Json
Write-Host "Type: $($qObjs.GetType().Name)"

if ($qObjs -is [array]) {
    $qs = $qObjs
} else {
    $qs = @($qObjs)
}
Write-Host "Question count: $($qs.Count)"

$qIds = @()
foreach ($q in $qs) { $qIds += $q.id }
Write-Host "IDs: $($qIds -join ',')"

# Step 3: Profiles + answers
$now = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "`n-- Profiles --"
foreach ($u in $users) {
    $pf = "{`"id`":`"$($u.id)`",`"school_code`":`"DEMO-UNI`",`"name`":`"$($u.name)`",`"role`":`"STUDENT`",`"gender`":1}"
    [System.IO.File]::WriteAllText($tmp, $pf, $utf8)
    curl.exe -s --connect-timeout 15 -X POST "$S/rest/v1/profiles" -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" --data-binary "@$tmp" -o NUL
    Write-Host "  $($u.name)"
}

Write-Host "`n-- Delete old answers --"
foreach ($u in $users) {
    curl.exe -s --connect-timeout 15 -X DELETE "$S/rest/v1/survey_answers?user_id=eq.$($u.id)" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o NUL
}
Write-Host "  Done"

Write-Host "`n-- Insert answers --"
foreach ($u in $users) {
    $ans = "["
    for ($j = 0; $j -lt $qIds.Count; $j++) {
        if ($j -gt 0) { $ans += "," }
        $ans += "{`"user_id`":`"$($u.id)`",`"question_id`":$($qIds[$j]),`"answer_value`":`"2`",`"updated_at`":`"$now`"}"
    }
    $ans += "]"
    [System.IO.File]::WriteAllText($tmp, $ans, $utf8)
    curl.exe -s --connect-timeout 30 -X POST "$S/rest/v1/survey_answers" -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" --data-binary "@$tmp" -o NUL
    Write-Host "  $($u.name): $($qIds.Count) answers"
    Start-Sleep -Milliseconds 150
}

# Step 4: Mark COMPLETED
Write-Host "`n-- COMPLETED --"
foreach ($u in $users) {
    $patch = "{`"survey_status`":`"COMPLETED`"}"
    [System.IO.File]::WriteAllText($tmp, $patch, $utf8)
    curl.exe -s --connect-timeout 15 -X PATCH "$S/rest/v1/profiles?id=eq.$($u.id)" -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" -H "Prefer: return=minimal" --data-binary "@$tmp" -o NUL
    Write-Host "  $($u.name)"
}

# Step 5: Verify
Write-Host "`n-- Verify --"
$allOk = $true
foreach ($u in $users) {
    $vUrl = "$S/rest/v1/survey_answers?user_id=eq.$($u.id)&select=question_id"
    curl.exe -s --connect-timeout 15 $vUrl -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
    $vt = [System.IO.File]::ReadAllText($tmp, $utf8e)

    if ($vt.Length -gt 10) {
        $va = $vt | ConvertFrom-Json
        if ($va -is [array]) { $vc = $va.Count } else { $vc = 1 }
        if ($vc -eq $qIds.Count) {
            Write-Host "  $($u.name): PASS $vc/$($qIds.Count)"
        } else {
            Write-Host "  $($u.name): MISMATCH $vc/$($qIds.Count)"
            $allOk = $false
        }
    } else {
        Write-Host "  $($u.name): EMPTY (raw='$vt')"
        $allOk = $false
    }
    Start-Sleep -Milliseconds 100
}

# Step 6: Cross-check
Write-Host "`n-- Cross-check --"
if ($users.Count -ge 2) {
    $u1Url = "$S/rest/v1/survey_answers?user_id=eq.$($users[0].id)&order=question_id"
    curl.exe -s --connect-timeout 15 $u1Url -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
    $u1Raw = [System.IO.File]::ReadAllText($tmp, $utf8e)
    $u1Arr = $u1Raw | ConvertFrom-Json

    $u2Url = "$S/rest/v1/survey_answers?user_id=eq.$($users[1].id)&order=question_id"
    curl.exe -s --connect-timeout 15 $u2Url -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
    $u2Raw = [System.IO.File]::ReadAllText($tmp, $utf8e)
    $u2Arr = $u2Raw | ConvertFrom-Json

    if (($u1Arr -is [array]) -and ($u2Arr -is [array])) {
        $map = @{}
        foreach ($a in $u1Arr) { $map[$a.question_id] = $a.answer_value }
        $same = 0; $diff = 0
        foreach ($a in $u2Arr) {
            if ($a.question_id -and $map.ContainsKey($a.question_id)) {
                if ($map[$a.question_id] -eq $a.answer_value) { $same++ } else { $diff++ }
            }
        }
        Write-Host "  $($users[0].name) vs $($users[1].name): same=$same diff=$diff"
        if ($same -gt 0 -and $diff -eq 0) { Write-Host "  *** 100% IDENTICAL! ***" }
        else { Write-Host "  *** MISMATCH ***" }
    } else { Write-Host "  Not enough data" }
}

# Summary
Write-Host "`n=========================================="
Write-Host "  FINAL SUMMARY"
Write-Host "  Users      : $($users.Count)"
Write-Host "  Questions  : $($qIds.Count)"
Write-Host "  All answers: '2' (identical)"
Write-Host "=========================================="
Write-Host "`nCredentials:"
for ($i = 1; $i -le 10; $i++) { Write-Host "  final_${i}@test.school / Test123456" }
Write-Host "`nAdmin -> Allocation -> Execute = same room!"

Remove-Item $tmp -Force -ErrorAction SilentlyContinue