#!/bin/bash

echo "🚀 SocialDrive AI - Setup Script"
echo "================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v)
echo "   Node.js: $node_version"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo ""
    echo "⚠️  .env.local not found!"
    echo "   Copying from .env.local.example..."
    cp .env.local.example .env.local
    echo "   ✅ Created .env.local"
    echo ""
    echo "   📝 Please edit .env.local and add your API keys:"
    echo "      - Supabase URL + keys"
    echo "      - Claude API key"
    echo "      - Google OAuth credentials"
    echo ""
else
    echo "   ✅ .env.local found"
fi

# Install dependencies (if node_modules doesn't exist)
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo "   ✅ Dependencies installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Create a Supabase project and run the database schema"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "📚 Documentation:"
echo "   - Build Spec: ../SocialDrive_AI/SocialDrive_AI_BuildSpec_v1.2.md"
echo "   - Database Schema: ../SocialDrive_AI/database-schema.sql"
echo ""
