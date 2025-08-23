#!/bin/bash

# Git initialization script for Sistahology React project
# This script ensures safe initialization without exposing sensitive files

echo "=== Starting git repository initialization ==="
echo ""

# Step 1: Initialize git repository
echo "Step 1: Initializing git repository..."
git init
echo ""

# Step 2: Add all files
echo "Step 2: Adding all files to staging..."
git add -A
echo ""

# Step 3: Safety check - unstage any .env files (except .env.example)
echo "Step 3: Safety check - unstaging any .env files..."
git reset .env 2>/dev/null || true
git reset .env.* 2>/dev/null || true
echo ""

# Step 4: Re-add only .env.example
echo "Step 4: Re-adding .env.example..."
git add .env.example
echo ""

# Step 5: Show git status
echo "Step 5: Current git status (files to be committed):"
echo "=========================================="
git status
echo "=========================================="
echo ""

echo "=== Git initialization complete ==="
echo ""
echo "IMPORTANT: Please review the git status above carefully."
echo "Verify that NO .env files (except .env.example) are staged."
echo ""
echo "If everything looks good, you can commit with:"
echo "  git commit -m \"chore(repo): initialize with safe ignores and examples\""