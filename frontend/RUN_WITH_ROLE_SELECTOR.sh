#!/bin/bash

# Quick Test Script for AI Proposal Generator
# Run this script to start the dev server with role selector

echo "🚀 Starting FreelanceReach with AI Proposal Generator..."
echo ""
echo "📝 Instructions:"
echo "1. Dev tools will appear at bottom-left (purple button)"
echo "2. Click 'Set Freelancer' or 'Set Company' to test"
echo "3. You'll be redirected to /ai-proposal-generator"
echo ""
echo "🌐 Open: http://localhost:3000"
echo ""
echo "💡 To manually test without dev tools:"
echo "   - Open DevTools Console (F12)"
echo "   - Run: localStorage.setItem('userRole', 'freelancer')"
echo "   - Navigate to: http://localhost:3000/ai-proposal-generator"
echo ""

npm run dev
