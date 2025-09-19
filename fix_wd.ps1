$p = 'src\pages\WritersDashboard.jsx'
$txt = Get-Content -Raw $p
$txt = [regex]::Replace($txt, 'toast\("Timer complete.*?\);', 'toast("Timer complete - log your session");')
$txt = $txt -replace 'Writer.?Ts Dashboard', "Writer's Dashboard"
$txt = $txt -replace 'Today.?Ts Words', "Today's Words"
Set-Content -Path $p -Value $txt
