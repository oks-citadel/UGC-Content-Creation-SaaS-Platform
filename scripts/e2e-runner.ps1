# =============================================================================
# E2E Test Runner Script - Windows PowerShell
# =============================================================================
# This script provisions required services, runs E2E tests with Playwright,
# captures results, and tears down resources.
# =============================================================================

param(
    [string]$Environment = "test",
    [string]$ComposeFile = "docker-compose.dev.yml",
    [int]$HealthCheckTimeout = 120,
    [switch]$SkipTeardown,
    [switch]$Verbose
)

# Color functions
function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error-Msg {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Write-Warning-Msg {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

# Cleanup function
function Cleanup {
    param([bool]$Force = $false)

    if ($SkipTeardown -and -not $Force) {
        Write-Warning-Msg "Skipping teardown (--SkipTeardown flag set)"
        return
    }

    Write-Info ""
    Write-Info "Tearing down resources..."

    # Stop containers
    Write-Info "Stopping Docker containers..."
    docker-compose -f $ComposeFile down -v 2>&1 | Out-Null

    # Check for resource leaks
    Write-Info "Checking for resource leaks..."
    $runningContainers = docker ps --filter "name=creatorbridge" --format "{{.Names}}"

    if ($runningContainers) {
        Write-Warning-Msg "WARNING: Detected leaked containers:"
        $runningContainers | ForEach-Object { Write-Warning-Msg "  - $_" }

        Write-Info "Cleaning up leaked containers..."
        $runningContainers | ForEach-Object {
            docker stop $_ 2>&1 | Out-Null
            docker rm $_ 2>&1 | Out-Null
        }
    }

    # Clean up dangling volumes
    $danglingVolumes = docker volume ls -qf "dangling=true"
    if ($danglingVolumes) {
        Write-Info "Removing dangling volumes..."
        $danglingVolumes | ForEach-Object { docker volume rm $_ 2>&1 | Out-Null }
    }

    Write-Success "Cleanup complete."
}

# Error handler
trap {
    Write-Error-Msg ""
    Write-Error-Msg "=================================="
    Write-Error-Msg "FATAL ERROR"
    Write-Error-Msg "=================================="
    Write-Error-Msg $_.Exception.Message
    Write-Error-Msg ""
    Cleanup -Force $true
    exit 1
}

# Main execution
Write-Info "=================================="
Write-Info "E2E Test Runner - Starting"
Write-Info "=================================="
Write-Info "Environment: $Environment"
Write-Info "Compose File: $ComposeFile"
Write-Info "Health Check Timeout: ${HealthCheckTimeout}s"
Write-Info ""

# Step 1: Clean up any existing resources
Write-Info "Step 1: Cleaning up existing resources..."
Cleanup -Force $true
Write-Success "Cleanup complete."
Write-Info ""

# Step 2: Provision services
Write-Info "Step 2: Provisioning services..."
Write-Info "Starting Docker containers..."

$composeOutput = docker-compose -f $ComposeFile up -d 2>&1
$composeExitCode = $LASTEXITCODE

if ($Verbose) {
    Write-Host $composeOutput
}

if ($composeExitCode -ne 0) {
    Write-Error-Msg "Failed to start Docker containers."
    Write-Error-Msg $composeOutput
    exit 1
}

Write-Success "Docker containers started."
Write-Info ""

# Step 3: Wait for services to be healthy
Write-Info "Step 3: Waiting for services to be healthy..."

$services = @(
    @{Name="postgres"; Port=5432; HealthCheck={docker exec creatorbridge-postgres pg_isready -U postgres 2>&1}},
    @{Name="redis"; Port=6379; HealthCheck={docker exec creatorbridge-redis redis-cli ping 2>&1}},
    @{Name="azurite"; Port=10000; HealthCheck={$null}}
)

$startTime = Get-Date
$timeout = $false

foreach ($service in $services) {
    $serviceName = $service.Name
    $healthCheck = $service.HealthCheck
    $healthy = $false

    Write-Info "Checking $serviceName..."

    if ($null -eq $healthCheck) {
        # For services without health check, just wait a bit
        Start-Sleep -Seconds 5
        Write-Success "$serviceName: assumed healthy (no health check)"
        continue
    }

    while (-not $healthy) {
        $elapsed = (Get-Date) - $startTime
        if ($elapsed.TotalSeconds -gt $HealthCheckTimeout) {
            $timeout = $true
            break
        }

        try {
            $result = & $healthCheck
            if ($LASTEXITCODE -eq 0) {
                $healthy = $true
                Write-Success "$serviceName: healthy"
            } else {
                Write-Host "." -NoNewline
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
        }
    }

    if ($timeout) {
        break
    }
}

if ($timeout) {
    Write-Error-Msg ""
    Write-Error-Msg "Services failed to become healthy within ${HealthCheckTimeout}s"
    Write-Error-Msg "Checking container status..."
    docker-compose -f $ComposeFile ps
    Write-Error-Msg ""
    Write-Error-Msg "Checking container logs..."
    docker-compose -f $ComposeFile logs --tail=50
    Cleanup -Force $true
    exit 1
}

Write-Success "All services are healthy."
Write-Info ""

# Step 4: Run database migrations
Write-Info "Step 4: Running database migrations..."
$migrateOutput = pnpm db:migrate 2>&1
$migrateExitCode = $LASTEXITCODE

if ($Verbose) {
    Write-Host $migrateOutput
}

if ($migrateExitCode -ne 0) {
    Write-Warning-Msg "Database migrations failed or not configured."
    Write-Warning-Msg "Continuing with E2E tests..."
} else {
    Write-Success "Database migrations complete."
}
Write-Info ""

# Step 5: Run E2E tests
Write-Info "Step 5: Running E2E tests with Playwright..."
Write-Info ""

$env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/creatorbridge_dev"
$env:REDIS_URL = "redis://localhost:6379"

$testStartTime = Get-Date
$testOutput = pnpm playwright test 2>&1
$testExitCode = $LASTEXITCODE
$testEndTime = Get-Date
$testDuration = ($testEndTime - $testStartTime).TotalSeconds

# Always show test output
Write-Host $testOutput

Write-Info ""
Write-Info "Test execution time: $([math]::Round($testDuration, 2))s"
Write-Info ""

# Step 6: Capture test results
Write-Info "Step 6: Capturing test results..."

$testResultsPath = "test-results/results.json"
$playwrightReportPath = "playwright-report"

if (Test-Path $testResultsPath) {
    Write-Success "Test results saved: $testResultsPath"
} else {
    Write-Warning-Msg "Test results file not found: $testResultsPath"
}

if (Test-Path $playwrightReportPath) {
    Write-Success "Playwright report available: $playwrightReportPath"
    Write-Info "To view report, run: npx playwright show-report"
} else {
    Write-Warning-Msg "Playwright report not generated."
}

# Step 7: Resource leak detection
Write-Info ""
Write-Info "Step 7: Checking for resource leaks..."

$leakedProcesses = Get-Process | Where-Object {
    $_.ProcessName -match "node|chrome|firefox|webkit" -and
    $_.StartTime -gt $testStartTime
}

if ($leakedProcesses) {
    Write-Warning-Msg "WARNING: Detected potentially leaked processes:"
    $leakedProcesses | ForEach-Object {
        Write-Warning-Msg "  - $($_.ProcessName) (PID: $($_.Id))"
    }
    Write-Warning-Msg "Consider investigating these processes."
} else {
    Write-Success "No resource leaks detected."
}

# Step 8: Teardown
Write-Info ""
Write-Info "Step 8: Teardown..."
Cleanup

# Step 9: Generate summary
Write-Info ""
Write-Info "=================================="
Write-Info "E2E Test Summary"
Write-Info "=================================="

if ($testExitCode -eq 0) {
    Write-Success "Status: PASSED"
    Write-Success "All E2E tests passed successfully!"
} else {
    Write-Error-Msg "Status: FAILED"
    Write-Error-Msg "Some E2E tests failed."
    Write-Error-Msg ""
    Write-Error-Msg "Exit code: $testExitCode"
}

Write-Info "Duration: $([math]::Round($testDuration, 2))s"
Write-Info "Test Results: $testResultsPath"
Write-Info "Report: $playwrightReportPath"
Write-Info "=================================="
Write-Info ""

exit $testExitCode
