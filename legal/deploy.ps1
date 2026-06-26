# Deploy legal pages to triviadashlegal.netlify.app
# One-time setup: npx netlify-cli login
# Then link this folder to your site: npx netlify-cli link --name triviadashlegal

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Deploying legal/ to Netlify (production)..." -ForegroundColor Cyan
npx netlify-cli deploy --prod --dir .
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "If not logged in, run:  npx netlify-cli login" -ForegroundColor Yellow
    Write-Host "If not linked, run:    npx netlify-cli link --name triviadashlegal" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or upload manually: app.netlify.com -> triviadashlegal -> Deploys -> Deploy manually" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Live URLs:" -ForegroundColor Green
Write-Host "  https://triviadashlegal.netlify.app/privacy-policy"
Write-Host "  https://triviadashlegal.netlify.app/terms"
Write-Host "  https://triviadashlegal.netlify.app/delete-account"
