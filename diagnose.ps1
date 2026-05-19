$S = "https://dhzxxqilzvpxdsamukdv.supabase.co"
$SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoenh4cWlsenZweGRzYW11a2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAxMzM2OSwiZXhwIjoyMDk0NTg5MzY5fQ.pGgEN8nZwL7bJreKYiFfWVoeKpPDvRdUvF6VxzbpHtY"
$tmp = "d:\Trae\Trae CN\88\tmp.json"
$utf8e = [System.Text.Encoding]::UTF8

Write-Host "=== Diagnose ==="

Write-Host "`n[Questions total]"
curl.exe -s --connect-timeout 10 "$S/rest/v1/survey_questions?select=count" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
Write-Host ([System.IO.File]::ReadAllText($tmp, $utf8e))

Write-Host "`n[Questions active (status=1)]"
curl.exe -s --connect-timeout 10 "$S/rest/v1/survey_questions?status=eq.1&select=count" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
Write-Host ([System.IO.File]::ReadAllText($tmp, $utf8e))

Write-Host "`n[Total answers]"
curl.exe -s --connect-timeout 10 "$S/rest/v1/survey_answers?select=count" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
Write-Host ([System.IO.File]::ReadAllText($tmp, $utf8e))

Write-Host "`n[Total profiles]"
curl.exe -s --connect-timeout 10 "$S/rest/v1/profiles?select=count" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
Write-Host ([System.IO.File]::ReadAllText($tmp, $utf8e))

Write-Host "`n[survey_answers first 20]"
curl.exe -s --connect-timeout 10 "$S/rest/v1/survey_answers?select=user_id,question_id,answer_value&limit=20" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
Write-Host ([System.IO.File]::ReadAllText($tmp, $utf8e))

Write-Host "`n[survey_questions all]"
curl.exe -s --connect-timeout 10 "$S/rest/v1/survey_questions?select=id,question_text,status,dimension&order=sort_order" -H "apikey: $SK" -H "Authorization: Bearer $SK" -o $tmp
Write-Host ([System.IO.File]::ReadAllText($tmp, $utf8e))