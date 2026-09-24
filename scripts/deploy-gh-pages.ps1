<#
    一键发布到 GitHub Pages（gh-pages 分支）

    用法（在项目根目录执行）：
        powershell -ExecutionPolicy Bypass -File scripts\deploy-gh-pages.ps1

    可选参数：
        -RemoteUrl  https://github.com/<用户名>/<仓库>.git
        -Branch     gh-pages

    流程：读取 .env / 环境变量 → npm run build → 把 dist/ 强推到 gh-pages 分支。
    首次发布后需在仓库 Settings → Pages 把 Source 设为 gh-pages 分支（仅一次）。
#>
param(
    [string]$RemoteUrl = 'https://github.com/zih71147-cpu/dengmi.git',
    [string]$Branch = 'gh-pages'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1) 定位 git / npm（PATH 中缺失时回退到常见安装位置）
$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { $git = 'C:\Program Files\Git\cmd\git.exe' }
if (-not (Test-Path $git)) { throw '未找到 git，请先安装 Git for Windows' }

$npm = (Get-Command npm -ErrorAction SilentlyContinue).Source
if (-not $npm) {
    $fallback = Join-Path $env:LOCALAPPDATA 'PortableNode\npm.cmd'
    if (Test-Path $fallback) { $npm = $fallback }
}
if (-not $npm) { $npm = 'npm.cmd' }

Write-Host '[1/4] 构建静态产物（npm run build）...' -ForegroundColor Cyan
& $npm run build
if ($LASTEXITCODE -ne 0) { throw 'npm run build 失败' }

$dist = Join-Path $root 'dist'
if (-not (Test-Path $dist)) { throw '未找到 dist 目录，请确认构建成功' }

Write-Host '[2/4] 准备发布目录...' -ForegroundColor Cyan
$tmp = Join-Path $env:TEMP ('dengmi-ghpages-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item (Join-Path $dist '*') $tmp -Recurse -Force
# GitHub Pages 默认按 Jekyll 处理，禁用后可保留所有文件
New-Item -ItemType File -Path (Join-Path $tmp '.nojekyll') | Out-Null

Write-Host "[3/4] 提交到 $Branch 分支..." -ForegroundColor Cyan
Set-Location $tmp
& $git init -b $Branch --quiet
& $git add -A
& $git -c user.name='deploy-bot' -c user.email='deploy-bot@users.noreply.github.com' commit -m 'deploy: publish dist to gh-pages' --quiet

Write-Host "[4/4] 推送 dist 到 $RemoteUrl ..." -ForegroundColor Cyan
& $git push -f $RemoteUrl ("{0}:{1}" -f $Branch, $Branch)
$code = $LASTEXITCODE

Set-Location $root
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

if ($code -eq 0) {
    Write-Host '发布成功！' -ForegroundColor Green
    Write-Host '若尚未开启 Pages：仓库 Settings → Pages → Source 选择 gh-pages 分支（只需设置一次）。' -ForegroundColor Green
    Write-Host '站点地址通常为 https://<用户名>.github.io/<仓库名>/' -ForegroundColor Green
} else {
    Write-Host "推送失败（exit=$code），请检查远程地址与凭据（首次推送会弹出浏览器登录）。" -ForegroundColor Red
    exit $code
}
