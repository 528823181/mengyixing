param(
  [int]$Port = 8123,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefixRoot = $root.TrimEnd('\') + '\'

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
try {
  $listener.Start()
} catch {
  Write-Host "端口 $Port 被占用，请关掉占用它的程序，或用 8124 端口重试。" -ForegroundColor Yellow
  exit 1
}

$url = "http://127.0.0.1:$Port/index.html#panorama"
Write-Host ""
Write-Host "  蒙益行 · 本地预览" -ForegroundColor Green
Write-Host "  $url"
Write-Host "  关闭这个窗口即停止预览。" -ForegroundColor DarkGray
Write-Host ""

if (-not $NoBrowser) { Start-Process $url }

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.webp' = 'image/webp'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2' = 'font/woff2'
  '.ttf'  = 'font/ttf'
  '.mp4'  = 'video/mp4'
  '.webm' = 'video/webm'
  '.glb'  = 'model/gltf-binary'
  '.gltf' = 'model/gltf+json'
  '.txt'  = 'text/plain; charset=utf-8'
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
    while ($true) {
      $h = $reader.ReadLine()
      if ($null -eq $h -or $h -eq '') { break }
    }

    $tokens = $requestLine.Split(' ')
    $path = '/'
    if ($tokens.Length -ge 2) { $path = $tokens[1].Split('?')[0] }
    $path = [System.Uri]::UnescapeDataString($path)
    if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }

    $relative = $path.TrimStart('/').Replace('/', '\')
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $relative))

    if ($file.StartsWith($prefixRoot, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
      $ctype = $types[$ext]
      if (-not $ctype) { $ctype = 'application/octet-stream' }
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hb, 0, $hb.Length)
      $stream.Write($bytes, 0, $bytes.Length)
      $stream.Flush()
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hb, 0, $hb.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    }
  } catch {
    # 单个请求出错不影响后续
  } finally {
    $client.Close()
  }
}
