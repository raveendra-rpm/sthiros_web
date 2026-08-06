$index = Get-Content "index.html" -Encoding UTF8
$header = $index[18..129]
$footer = $index[1185..1236]

$about = Get-Content "aboutus.html" -Encoding UTF8
$bodyIdx = -1
$scriptIdx = -1

for ($i = 0; $i -lt $about.Length; $i++) {
    if ($about[$i] -match "<body>") {
        $bodyIdx = $i
    }
    if ($about[$i] -match "<script>" -and $scriptIdx -eq -1) {
        $scriptIdx = $i
    }
}

if ($bodyIdx -ge 0 -and $scriptIdx -ge 0) {
    $newAbout = @()
    $newAbout += $about[0..$bodyIdx]
    $newAbout += $header
    $newAbout += $about[($bodyIdx+1)..($scriptIdx-1)]
    $newAbout += $footer
    $newAbout += $about[$scriptIdx..($about.Length-1)]
    $newAbout | Set-Content "aboutus.html" -Encoding UTF8
    Write-Host "Success! Header and footer injected."
} else {
    Write-Host "Failed to find <body> or <script>"
    Write-Host "bodyIdx: $bodyIdx, scriptIdx: $scriptIdx"
}
