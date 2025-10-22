#!/bin/bash

# Minah Backend Quick Start Script

echo "🚀 Minah Backend Setup"
echo "====================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and add your credentials:"
    echo "   - MongoDB Atlas connection string"
    echo "   - Stellar contract ID"
    echo "   - Stellar owner secret key"
    echo ""
    read -p "Press enter after you've configured .env..."
else
    echo "✅ .env file found"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Ensure your .env is configured correctly"
echo "   2. Start the dev server: npm run dev"
echo "   3. Access API docs: http://localhost:8080/api-docs"
echo "   4. Test the endpoint using Swagger UI or cURL"
echo ""
echo "📖 Documentation:"
echo "   - README.md - Full documentation"
echo "   - API_TESTING.md - Testing guide"
echo "   - IMPLEMENTATION_SUMMARY.md - Implementation details"
echo ""
