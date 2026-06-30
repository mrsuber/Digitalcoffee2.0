#!/bin/bash

# Digital Coffee - Video Calling Build & Test Script
# This script helps you quickly build and test the video calling feature

echo "🎥 Digital Coffee - Video Calling Build Helper"
echo "=============================================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found!"
    echo "📦 Installing EAS CLI globally..."
    npm install -g eas-cli
    echo "✅ EAS CLI installed!"
    echo ""
fi

# Check if logged in to Expo
echo "🔐 Checking Expo account..."
if ! eas whoami &> /dev/null; then
    echo "Please log in to your Expo account:"
    eas login
fi

echo ""
echo "Select build type:"
echo "1) iOS Development Build (for testing on iOS Simulator or device)"
echo "2) Android Development Build (APK for testing on Android device)"
echo "3) iOS + Android Development Builds (both platforms)"
echo "4) iOS Production Build (for App Store)"
echo "5) Android Production Build (for Google Play)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "🍎 Building iOS development client..."
        eas build --profile development --platform ios
        ;;
    2)
        echo "🤖 Building Android development APK..."
        eas build --profile development --platform android
        ;;
    3)
        echo "📱 Building for both iOS and Android..."
        eas build --profile development --platform all
        ;;
    4)
        echo "🍎 Building iOS production build..."
        eas build --profile production --platform ios
        ;;
    5)
        echo "🤖 Building Android production build..."
        eas build --profile production --platform android
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "⏳ Build started! This will take 10-20 minutes."
echo "📱 You can check build progress at: https://expo.dev/accounts/[your-account]/projects/digital-coffee/builds"
echo ""
echo "After build completes:"
echo "  1. Download the build from EAS dashboard"
echo "  2. Install on your device/simulator"
echo "  3. Start dev server: npx expo start --dev-client"
echo "  4. Test video calling! 🎉"
echo ""
