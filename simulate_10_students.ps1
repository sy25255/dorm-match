$supabaseUrl = "https://dhzxxqilzvpxdsamukdv.supabase.co"
$anonKey = "sb_publishable_nosPNDGVHy8UaGBJeki9Vg_70k628SJ"
$PAT = "sbp_c6be429d293bf59ea9a8c177ae42d6f4f2fdcf965"
$amp = [char]38

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 10 students simulation - Management API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Sign up 10 users via Auth API
$users = @()
Write-Host ""
Write-Host "[Step 1] Registering 10 students..." -ForegroundColor Yellow

for ($i = 1; $i -le 10; $i++) {
    $email = "sim_student_$i@test.demo"
    $password = "Test123456"
    $name = "SimStudent$i"

    $body = @{
        email = $email
        password = $password
        data = @{
            name = $name
            school_code = "DEMO-UNI"
            student_no = "SIM2024" + $i.ToString("D3")
            role = "STUDENT"
        }
    } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/signup" `
            -Method Post `
            -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } `
            -Body $body

        if ($response.user) {
            $uid = $response.user.id
            $users += @{
                id = $uid
                name = $name
                email = $email
            }
            $shortId = $uid.Substring(0, 12)
            Write-Host ("  OK: " + $name + " -> " + $shortId + "...") -ForegroundColor Green
        }

        # Also create profile via REST API (Management API bypasses RLS)
        $profileBody = @{
            id = $response.user.id
            school_code = "DEMO-UNI"
            student_no = "SIM2024" + $i.ToString("D3")
            name = $name
            role = "STUDENT"
            gender = 1
        } | ConvertTo-Json -Compress

        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/profiles" `
            -Method Post `
            -Headers @{
                "apikey" = $anonKey
                "Authorization" = "Bearer " + $response.session.access_token
                "Content-Type" = "application/json"
                "Prefer" = "resolution=merge-duplicates"
            } `
            -Body $profileBody | Out-Null

    } catch {
        $msg = $_.Exception.Message
        Write-Host ("  FAIL: " + $email + " - " + $msg.Substring(0, [Math]::Min(120, $msg.Length))) -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

Write-Host ("`n  Registered " + $users.Count + " students") -ForegroundColor Green

if ($users.Count -lt 2) {
    Write-Host "  ERROR: Not enough users." -ForegroundColor Red
    exit 1
}

# Step 2: Get survey questions via Management API
Write-Host ""
Write-Host "[Step 2] Getting survey questions via Management API..." -ForegroundColor Yellow

$projectRef = "dhzxxqilzvpxdsamukdv"
$mgmtUrl = "https://api.supabase.com/v1/projects/$projectRef/database/query"

$qsBody = @{ query = "SELECT id, question_type, sort_order FROM survey_questions WHERE status = 1 ORDER BY sort_order" } | ConvertTo-Json -Compress
try {
    $qsResp = Invoke-RestMethod -Uri $mgmtUrl `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer " + $PAT; "Content-Type" = "application/json" } `
        -Body $qsBody
    $questions = @($qsResp)
    Write-Host ("  Got " + $questions.Count + " questions") -ForegroundColor Green
} catch {
    Write-Host ("  Management API failed: " + $_.Exception.Message.Substring(0, [Math]::Min(200, $_.Exception.Message.Length))) -ForegroundColor Red
    Write-Host "  Falling back to REST API..." -ForegroundColor Yellow
    try {
        $qsResp2 = Invoke-RestMethod -Uri ($supabaseUrl + "/rest/v1/survey_questions?status=eq.1" + $amp + "order=sort_order") `
            -Method Get `
            -Headers @{ "apikey" = $anonKey }
        $questions = @($qsResp2)
        Write-Host ("  Got " + $questions.Count + " questions via REST") -ForegroundColor Green
    } catch {
        Write-Host "  Both methods failed. Using default question count." -ForegroundColor Red
        $questions = @()
        for ($qi = 1; $qi -le 50; $qi++) {
            $questions += @{ id = $qi; question_type = "SINGLE" }
        }
        Write-Host ("  Created " + $questions.Count + " default questions") -ForegroundColor Yellow
    }
}

# Step 3: Insert identical answers via Management API
Write-Host ""
Write-Host "[Step 3] Inserting identical answers..." -ForegroundColor Yellow

$insertedCount = 0
foreach ($user in $users) {
    $values = @()
    foreach ($q in $questions) {
        $qid = $q.id
        $values += "('$($user.id)', $qid, '2', NOW())"
    }

    $batchSize = 20
    for ($i = 0; $i -lt $values.Count; $i += $batchSize) {
        $batch = $values[$i..([Math]::Min($i + $batchSize - 1, $values.Count - 1))]
        $valsStr = $batch -join ", "
        $sql = "INSERT INTO survey_answers (user_id, question_id, answer_value, updated_at) VALUES $valsStr ON CONFLICT (user_id, question_id) DO UPDATE SET answer_value = '2', updated_at = NOW()"
        $insertBody = @{ query = $sql } | ConvertTo-Json -Compress
        try {
            Invoke-RestMethod -Uri $mgmtUrl `
                -Method Post `
                -Headers @{ "Authorization" = "Bearer " + $PAT; "Content-Type" = "application/json" } `
                -Body $insertBody | Out-Null
            $insertedCount++
        } catch {
            $errShort = $_.Exception.Message.Substring(0, [Math]::Min(80, $_.Exception.Message.Length))
            Write-Host ("  WARN: batch insert failed: " + $errShort) -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds 200
    }

    # Update profile to COMPLETED
    $updateSql = "UPDATE profiles SET survey_status = 'COMPLETED' WHERE id = '$($user.id)'"
    $updateBody = @{ query = $updateSql } | ConvertTo-Json -Compress
    try {
        Invoke-RestMethod -Uri $mgmtUrl `
            -Method Post `
            -Headers @{ "Authorization" = "Bearer " + $PAT; "Content-Type" = "application/json" } `
            -Body $updateBody | Out-Null
    } catch {
        Write-Host ("  WARN: " + $user.name + " profile update failed") -ForegroundColor Yellow
    }

    Write-Host ("  OK: " + $user.name + " - COMPLETED") -ForegroundColor Green
    Start-Sleep -Milliseconds 300
}

# Step 4: Verify
Write-Host ""
Write-Host "[Step 4] Verifying..." -ForegroundColor Yellow

$verifySql = "SELECT name, id, survey_status FROM profiles WHERE school_code = 'DEMO-UNI' AND survey_status = 'COMPLETED'"
$verifyBody = @{ query = $verifySql } | ConvertTo-Json -Compress
try {
    $verifyResp = Invoke-RestMethod -Uri $mgmtUrl `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer " + $PAT; "Content-Type" = "application/json" } `
        -Body $verifyBody
    $verifyList = @($verifyResp)
    Write-Host ("  DEMO-UNI completed survey students: " + $verifyList.Count) -ForegroundColor Cyan
    foreach ($p in $verifyList) {
        $pidStr = $p.id.ToString()
        $shortId = $pidStr.Substring(0, [Math]::Min(8, $pidStr.Length))
        Write-Host ("    - " + $p.name + " (" + $shortId + ")") -ForegroundColor Gray
    }
} catch {
    Write-Host ("  Verify failed: " + $_.Exception.Message.Substring(0, [Math]::Min(120, $_.Exception.Message.Length))) -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ("  10 students registered, all with IDENTICAL survey answers.") -ForegroundColor Green
Write-Host "  Admin: log in, go to 'Dormitory' - 'Execute Allocation'" -ForegroundColor Green
Write-Host "  They should be grouped into same rooms!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan