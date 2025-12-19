# =============================================================================
# Autofix Loop Script - Windows PowerShell
# =============================================================================
# This script automatically runs tests, identifies failures, and attempts to
# fix them iteratively. Maximum 5 iterations before stopping.
# =============================================================================

param(
    [int]$MaxIterations = 5,
    [string]$TestCommand = "pnpm test",
    [switch]$Verbose
)

# Color functions for better output
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

# Initialize counters
$iteration = 0
$testsPassed = $false
$failedModules = @()

Write-Info "=================================="
Write-Info "Autofix Loop Script - Starting"
Write-Info "=================================="
Write-Info "Max Iterations: $MaxIterations"
Write-Info "Test Command: $TestCommand"
Write-Info ""

# Main autofix loop
while ($iteration -lt $MaxIterations -and -not $testsPassed) {
    $iteration++

    Write-Info "=================================="
    Write-Info "Iteration $iteration of $MaxIterations"
    Write-Info "=================================="

    # Run tests and capture output
    Write-Info "Running tests..."
    $testOutput = & cmd /c "$TestCommand 2>&1"
    $testExitCode = $LASTEXITCODE

    if ($Verbose) {
        Write-Host $testOutput
    }

    # Check if tests passed
    if ($testExitCode -eq 0) {
        Write-Success ""
        Write-Success "=================================="
        Write-Success "All tests passed!"
        Write-Success "=================================="
        Write-Success "Total iterations: $iteration"
        $testsPassed = $true
        exit 0
    }

    # Parse test output to identify failures
    Write-Warning-Msg "Tests failed. Analyzing failures..."
    $currentFailedModules = @()
    $failurePatterns = @(
        'FAIL\s+(.+?)(?:\s|$)',
        'Error:\s+(.+?)(?:\n|$)',
        '(.*\.test\.(ts|tsx|js|jsx))'
    )

    foreach ($pattern in $failurePatterns) {
        $matches = [regex]::Matches($testOutput, $pattern)
        foreach ($match in $matches) {
            if ($match.Groups.Count -gt 1) {
                $module = $match.Groups[1].Value.Trim()
                if ($module -and $module -ne "" -and $currentFailedModules -notcontains $module) {
                    $currentFailedModules += $module
                }
            }
        }
    }

    if ($currentFailedModules.Count -eq 0) {
        Write-Error-Msg ""
        Write-Error-Msg "=================================="
        Write-Error-Msg "FATAL ERROR"
        Write-Error-Msg "=================================="
        Write-Error-Msg "Unable to parse test failures."
        Write-Error-Msg "Test output does not match expected patterns."
        Write-Error-Msg ""
        Write-Error-Msg "Test exit code: $testExitCode"
        Write-Error-Msg ""
        Write-Host "Test output (last 50 lines):" -ForegroundColor Yellow
        $testOutput -split "`n" | Select-Object -Last 50 | ForEach-Object { Write-Host $_ }
        exit 1
    }

    # Display failed modules
    Write-Warning-Msg ""
    Write-Warning-Msg "Failed modules/tests ($($currentFailedModules.Count)):"
    $currentFailedModules | ForEach-Object { Write-Warning-Msg "  - $_" }
    Write-Warning-Msg ""

    # Check if we're making progress
    if ($failedModules.Count -gt 0) {
        $commonFailures = $currentFailedModules | Where-Object { $failedModules -contains $_ }
        if ($commonFailures.Count -eq $currentFailedModules.Count) {
            Write-Warning-Msg "No progress detected. Same failures as previous iteration."

            if ($iteration -ge 3) {
                Write-Error-Msg ""
                Write-Error-Msg "=================================="
                Write-Error-Msg "STOPPING: No Progress"
                Write-Error-Msg "=================================="
                Write-Error-Msg "The same failures persist after $iteration iterations."
                Write-Error-Msg "Manual intervention required."
                exit 1
            }
        }
    }

    $failedModules = $currentFailedModules

    # Suggest fixes
    Write-Info ""
    Write-Info "Suggested fixes for iteration $($iteration + 1):"
    Write-Info "=================================="

    $hasTypeErrors = $testOutput -match "Type\s+error|TS\d+"
    $hasImportErrors = $testOutput -match "Cannot find module|Module not found"
    $hasUndefinedErrors = $testOutput -match "undefined|is not defined"
    $hasAsyncErrors = $testOutput -match "timeout|Promise"

    if ($hasTypeErrors) {
        Write-Info "1. TypeScript errors detected:"
        Write-Info "   Run: pnpm type-check"
        Write-Info "   Fix type definitions and imports"
    }

    if ($hasImportErrors) {
        Write-Info "2. Import errors detected:"
        Write-Info "   Check module paths and dependencies"
        Write-Info "   Run: pnpm install"
    }

    if ($hasUndefinedErrors) {
        Write-Info "3. Undefined references detected:"
        Write-Info "   Check for missing variables, functions, or imports"
        Write-Info "   Verify mock implementations in tests"
    }

    if ($hasAsyncErrors) {
        Write-Info "4. Async/timeout errors detected:"
        Write-Info "   Increase test timeouts"
        Write-Info "   Check for unhandled promises"
        Write-Info "   Add proper async/await handling"
    }

    # Try automatic fixes
    Write-Info ""
    Write-Info "Attempting automatic fixes..."

    # Run lint fix
    Write-Info "Running lint:fix..."
    & pnpm lint:fix 2>&1 | Out-Null

    # Run format
    Write-Info "Running format..."
    & pnpm format 2>&1 | Out-Null

    Write-Info ""
    Write-Info "Automatic fixes applied. Re-running tests in next iteration..."
    Write-Info ""

    # Pause briefly between iterations
    Start-Sleep -Seconds 2
}

# If we've exhausted all iterations
if (-not $testsPassed) {
    Write-Error-Msg ""
    Write-Error-Msg "=================================="
    Write-Error-Msg "MAXIMUM ITERATIONS REACHED"
    Write-Error-Msg "=================================="
    Write-Error-Msg "Tests still failing after $MaxIterations iterations."
    Write-Error-Msg "Manual intervention required."
    Write-Error-Msg ""
    Write-Error-Msg "Persistent failures:"
    $failedModules | ForEach-Object { Write-Error-Msg "  - $_" }
    Write-Error-Msg ""
    exit 1
}
