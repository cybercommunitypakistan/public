#!/bin/bash
# =============================================================================
# Cleanup script to remove Prisma-related generated files and directories
# =============================================================================

echo "🧹 Cleaning up Prisma-related files..."

# Remove generated Prisma client
if [ -d "lib/generated/prisma" ]; then
  rm -rf lib/generated/prisma
  echo "✓ Removed lib/generated/prisma"
fi

# Remove generated directory if empty
if [ -d "lib/generated" ] && [ -z "$(ls -A lib/generated)" ]; then
  rm -rf lib/generated
  echo "✓ Removed empty lib/generated directory"
fi

# Remove Prisma migrations if they exist
if [ -d "prisma/migrations" ]; then
  rm -rf prisma/migrations
  echo "✓ Removed prisma/migrations"
fi

# Remove node_modules to clean install
if [ -d "node_modules" ]; then
  echo "🗑️  Removing node_modules for clean install..."
  rm -rf node_modules
  echo "✓ Removed node_modules"
fi

# Remove lock files
if [ -f "pnpm-lock.yaml" ]; then
  rm pnpm-lock.yaml
  echo "✓ Removed pnpm-lock.yaml"
fi

if [ -f "package-lock.json" ]; then
  rm package-lock.json
  echo "✓ Removed package-lock.json"
fi

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm install"
echo "2. Update your .env with MONGODB_URI"
echo "3. Run: pnpm db:seed"
echo "4. Run: pnpm dev"
