<#
.SYNOPSIS
    Takes a screenshot of each page at each standard device size, with headless Chrome or Edge.

.DESCRIPTION
    Writes the screenshots to screenshots\<page>\<device>.png. Look through them for horizontal
    scroll, overlaps and cut-off text. The device list matches docs\DeviceSupport.md.

    Headless screenshots match the CSS width and height only. They do not copy touch, the
    pixel ratio, the browser bars or Safari. Check those in DevTools device mode or on a real device.
    The browser runs with reduced motion on, so each shot shows the page after its animations.

.PARAMETER Pages
    The HTML files to capture, relative to the project folder, separated by spaces or commas.
    Default: index.html.

.PARAMETER FullPage
    Captures a tall image (8000px) as well as the first screen, to show the whole page.

.EXAMPLE
    tools\Capture-Devices.ps1
    tools\Capture-Devices.ps1 index.html projects\sunken-bastion.html
    tools\Capture-Devices.ps1 -FullPage index.html
#>
param(
    [switch] $FullPage,
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]] $Pages = @('index.html')
)

$ErrorActionPreference = 'Stop'

# Through the .bat file (powershell -File), pages can arrive as one comma list or as separate words.
$Pages = $Pages | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputRoot = Join-Path $projectRoot 'screenshots'

# Name, width, height. Keep in step with the table in docs\DeviceSupport.md.
$devices = @(
    @('phone-small', 320, 568),
    @('phone', 375, 667),
    @('phone-large', 430, 932),
    @('phone-landscape', 844, 390),
    @('tablet', 768, 1024),
    @('tablet-landscape', 1180, 820),
    @('laptop', 1366, 768),
    @('desktop', 1920, 1080),
    @('desktop-wide', 2560, 1440)
)

function Find-Browser {
    $candidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }
    throw 'Chrome or Edge not found. Install one of them, or add its path to Find-Browser.'
}

# Headless Chrome will not make a window narrower than 500px, and its viewport is shorter than
# the window. Each page loads in an iframe of the exact device size, in a larger window, and the
# image is then cropped to the iframe.
$minimumWindowWidth = 500
$windowExtraHeight = 200

Add-Type -AssemblyName System.Drawing

function Save-Screenshot([string] $browser, [string] $pageUrl, [string] $outputFile, [int] $width, [int] $height) {
    # A separate profile stops the headless run from attaching to the browser that is open.
    $profileDir = Join-Path $env:TEMP 'portfolio-capture-profile'
    $windowWidth = [Math]::Max($width, $minimumWindowWidth)
    $windowHeight = $height + $windowExtraHeight

    $frameFile = Join-Path $env:TEMP "portfolio-capture-frame.html"
    $frameHtml = '<!doctype html><body style="margin:0;background:#fff">' +
        "<iframe src=""$pageUrl"" style=""display:block;border:0;width:${width}px;height:${height}px""></iframe>"
    Set-Content -Path $frameFile -Value $frameHtml -Encoding UTF8
    $frameUrl = 'file:///' + ($frameFile -replace '\\', '/')

    $arguments = @(
        '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
        "--user-data-dir=$profileDir",
        "--window-size=$windowWidth,$windowHeight",
        '--virtual-time-budget=4000',
        # Headless time does not run entrance animations to the end, so the shots use the reduced-motion styles.
        '--force-prefers-reduced-motion',
        "--screenshot=$outputFile",
        $frameUrl
    )
    Start-Process -FilePath $browser -ArgumentList $arguments -Wait -NoNewWindow -RedirectStandardError (Join-Path $env:TEMP 'portfolio-capture.log')

    Crop-Image $outputFile $width $height
}

function Crop-Image([string] $file, [int] $width, [int] $height) {
    $source = [System.Drawing.Image]::FromFile($file)
    $cropped = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($cropped)
    $area = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    $graphics.DrawImage($source, $area, $area, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    $source.Dispose()
    $cropped.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
}

$browser = Find-Browser
Write-Host "Browser: $browser"

foreach ($page in $Pages) {
    $pagePath = Join-Path $projectRoot $page
    if (-not (Test-Path $pagePath)) {
        Write-Warning "Page not found: $page"
        continue
    }

    $pageUrl = 'file:///' + ((Resolve-Path $pagePath).Path -replace '\\', '/')
    $pageName = [IO.Path]::GetFileNameWithoutExtension($page)
    $pageFolder = Join-Path $outputRoot $pageName
    New-Item -ItemType Directory -Force -Path $pageFolder | Out-Null

    foreach ($device in $devices) {
        $name, $width, $height = $device
        Save-Screenshot $browser $pageUrl (Join-Path $pageFolder "$name.png") $width $height
        if ($FullPage) {
            Save-Screenshot $browser $pageUrl (Join-Path $pageFolder "$name-full.png") $width 8000
        }
        Write-Host ("  {0,-18} {1,4} x {2,-4}  {3}" -f $name, $width, $height, $page)
    }
}

Write-Host "Screenshots: $outputRoot"
