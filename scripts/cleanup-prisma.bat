@echo off
REM =============================================================================
REM Cleanup script to remove Prisma-related generated files and directories
REM =============================================================================

echo 🧹 Cleaning up Prisma-related files...

REM Remove generated Prisma client
if exist "lib\generated\prisma" (
  rmdir /s /q "lib\generated\prisma"
  echo ✓ Removed lib\generated\prisma
)

REM Remove generated directory if empty
if exist "lib\generated" (
  rmdir "lib\generated" 2>nul
  if not exist "lib\generated" echo ✓ Removed empty lib\generated directory
)

REM Remove Prisma migrations if they exist
if exist "prisma\migrations" (
  rmdir /s /q "prisma\migrations"
  echo ✓ Removed prisma\migrations
)

REM Remove node_modules to clean install
if exist "node_modules" (
  echo 🗑️  Removing node_modules for clean install...
  rmdir /s /q "node_modules"
  echo ✓ Removed node_modules
)

REM Remove lock files
if exist "pnpm-lock.yaml" (
  del /q "pnpm-lock.yaml"
  echo ✓ Removed pnpm-lock.yaml
)

if exist "package-lock.json" (
  del /q "package-lock.json"
  echo ✓ Removed package-lock.json
)

echo.
echo ✨ Cleanup complete!
echo.
echo Next steps:
echo 1. Run: pnpm install
echo 2. Update your .env with MONGODB_URI
echo 3. Run: pnpm db:seed
echo 4. Run: pnpm dev
