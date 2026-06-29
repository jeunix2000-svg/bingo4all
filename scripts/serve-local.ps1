# 从项目根目录启动本地 HTTP 服务（Docusaurus baseUrl=/wiki/ 必须从根目录访问）
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$nodeDir = Join-Path $env:LOCALAPPDATA "nodejs"
if (Test-Path (Join-Path $nodeDir "npx.cmd")) {
  $env:Path = "$nodeDir;$env:Path"
}

Write-Host ""
Write-Host "==> 本地预览服务器"
Write-Host "    根目录: $Root"
Write-Host "    门户:   http://localhost:8080/index.html"
Write-Host "    WIKI:   http://localhost:8080/wiki/"
Write-Host ""
Write-Host "按 Ctrl+C 停止"
Write-Host ""

npx --yes serve -l 8080 .
