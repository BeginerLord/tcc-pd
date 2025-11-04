@echo off
echo Starting all services...

REM Start scraping-service
start "Scraping Service" cmd /k "cd scraping-service && npm run dev"

REM Start main-api
start "Main API" cmd /k "cd main-api && npm run dev"

REM Start api-gateway
start "API Gateway" cmd /k "cd api-gateway && npm run dev"

REM Start frontend (Next.js)
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services are starting in separate windows...
pause
