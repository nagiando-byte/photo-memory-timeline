#!/bin/bash

# Photo Memory Timeline - App Store デプロイスクリプト
# このスクリプトを実行するだけでApp Storeに公開できます

set -e

echo "🚀 Photo Memory Timeline - App Store デプロイ"
echo "=============================================="
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ステップ表示関数
step() {
    echo -e "${BLUE}[$1/5]${NC} $2"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Expo ログイン確認
step 1 "Expo アカウント確認..."
if eas whoami 2>/dev/null; then
    success "Expo にログイン済み"
else
    warn "Expo にログインが必要です"
    echo ""
    echo "Expo アカウントをお持ちですか？"
    echo "  持っている → メールアドレスとパスワードでログイン"
    echo "  持っていない → https://expo.dev/signup で無料作成"
    echo ""
    eas login
    success "Expo ログイン完了"
fi

echo ""

# 2. プロジェクト初期化
step 2 "EAS プロジェクト初期化..."
cd "$(dirname "$0")/mobile"

if [ -f ".expo/state.json" ] && grep -q "projectId" .expo/state.json 2>/dev/null; then
    success "プロジェクト初期化済み"
else
    eas init --non-interactive 2>/dev/null || eas init
    success "プロジェクト初期化完了"
fi

echo ""

# 3. バックエンドAPI URL設定
step 3 "バックエンド設定..."
echo ""
echo "バックエンドAPIのURLを入力してください"
echo "(Render/Railway等にデプロイ済みの場合はそのURL)"
echo "(まだの場合は Enter でスキップ - 後で設定可能)"
echo ""
read -p "API URL (例: https://your-app.onrender.com): " API_URL

if [ -n "$API_URL" ]; then
    # eas.json を更新
    sed -i '' "s|https://api.photo-memory-timeline.com|$API_URL|g" eas.json
    success "API URL を設定: $API_URL"
else
    warn "API URLはスキップ - 後で eas.json を編集してください"
fi

echo ""

# 4. iOS ビルド
step 4 "iOS アプリをビルド中..."
echo ""
echo "これには 15-30 分かかります。"
echo "Apple Developer アカウントの認証が求められます。"
echo ""

eas build --platform ios --profile production

success "iOS ビルド完了！"

echo ""

# 5. App Store 提出
step 5 "App Store に提出..."
echo ""
echo "App Store Connect に提出しますか？ (y/n)"
read -p "> " SUBMIT

if [ "$SUBMIT" = "y" ] || [ "$SUBMIT" = "Y" ]; then
    eas submit --platform ios --profile production
    success "App Store 提出完了！"
    echo ""
    echo "🎉 おめでとうございます！"
    echo "App Store Connect で審査状況を確認してください。"
    echo "https://appstoreconnect.apple.com"
else
    echo ""
    echo "後で提出する場合は以下を実行:"
    echo "  cd mobile && eas submit --platform ios"
fi

echo ""
echo "=============================================="
echo "完了！"
echo ""
