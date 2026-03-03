@echo off
REM PuraEstate Test Suite Runner for Windows
REM Runs all tests with coverage reporting

setlocal enabledelayedexpansion

set "TEST_TYPE=%1"
if "%TEST_TYPE%"=="" set "TEST_TYPE=all"

set "WATCH_MODE=%2"
if "%WATCH_MODE%"=="" set "WATCH_MODE=false"

echo.
echo ═══════════════════════════════════════════════════════
echo   PuraEstate Test Suite Runner
echo ═══════════════════════════════════════════════════════
echo.

if "%TEST_TYPE%"=="unit" (
    echo Running unit tests...
    call npm run test -- --testPathPattern="(config|logger)" --coverage
) else if "%TEST_TYPE%"=="integration" (
    echo Running integration tests...
    call npm run test -- --testPathPattern="integration" --coverage
) else if "%TEST_TYPE%"=="e2e" (
    echo Running E2E tests...
    call npm run test -- --testPathPattern="e2e" --coverage
) else if "%TEST_TYPE%"=="security" (
    echo Running security tests...
    call npm run test -- --testPathPattern="security" --coverage
) else if "%TEST_TYPE%"=="performance" (
    echo Running performance tests...
    call npm run test -- --testPathPattern="performance" --coverage
) else if "%TEST_TYPE%"=="watch" (
    echo Running tests in watch mode...
    call npm run test:watch
) else if "%TEST_TYPE%"=="all" (
    echo Running all tests...
    call npm run test -- --coverage --testTimeout=10000
) else (
    echo Unknown test type: %TEST_TYPE%
    echo Usage: %0 [unit^|integration^|e2e^|security^|performance^|watch^|all]
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════
echo   Test Results
echo ═══════════════════════════════════════════════════════
echo.

if exist "coverage\coverage-summary.json" (
    echo Coverage report generated
    echo Location: coverage\coverage-summary.json
    echo HTML report: coverage\lcov-report\index.html
) else (
    echo No coverage report found
)

echo.
echo Test execution completed
echo.

endlocal
