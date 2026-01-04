# App Store 公開ガイド

Photo Memory Timeline を App Store に公開するための手順です。

## 前提条件

1. **Apple Developer Program** に登録済み（年間 $99）
   - https://developer.apple.com/programs/

2. **Expo アカウント** を作成済み
   - https://expo.dev/signup

---

## Step 1: Expo にログイン

```bash
cd mobile
eas login
```

メールアドレスとパスワードを入力してログイン。

---

## Step 2: プロジェクトを Expo に登録

```bash
eas init
```

プロジェクト名を確認して Enter。

---

## Step 3: Apple Developer 認証情報を設定

```bash
eas credentials
```

- Platform: iOS を選択
- Profile: production を選択
- "Log in to your Apple Developer account" を選択
- Apple ID とパスワードを入力

これにより、署名証明書とプロビジョニングプロファイルが自動生成されます。

---

## Step 4: バックエンドをデプロイ

### Railway を使う場合

1. https://railway.app にアクセス
2. GitHub でログイン
3. "New Project" → "Deploy from GitHub repo"
4. photo-memory-timeline リポジトリを選択
5. backend ディレクトリをルートに設定
6. 環境変数を設定:
   - `DATABASE_URL`: TiDB Cloud または PlanetScale の接続文字列
   - `JWT_SECRET`: 強力なランダム文字列（`openssl rand -base64 32`）
   - `OPENAI_API_KEY`: OpenAI API キー
   - `NODE_ENV`: production

7. デプロイ後、URL をコピー（例: `https://xxx.up.railway.app`）

### eas.json を更新

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-backend-url.up.railway.app"
  }
}
```

---

## Step 5: iOS ビルドを実行

```bash
cd mobile
eas build --platform ios --profile production
```

ビルドには 15-30 分かかります。完了すると .ipa ファイルがダウンロード可能になります。

---

## Step 6: App Store Connect に提出

### 自動提出（推奨）

```bash
eas submit --platform ios --profile production
```

Apple ID とアプリ固有パスワードを入力。

### 手動提出

1. App Store Connect (https://appstoreconnect.apple.com) にアクセス
2. "My Apps" → "+" → "New App"
3. アプリ情報を入力:
   - Name: Photo Memory Timeline
   - Primary Language: Japanese
   - Bundle ID: com.photomemory.timeline
   - SKU: photo-memory-timeline-001

4. Transporter アプリで .ipa をアップロード
5. App Store Connect でビルドを選択

---

## Step 7: App Store 情報を入力

### 必須項目

| 項目 | 内容 |
|------|------|
| App Name | Photo Memory Timeline |
| Subtitle | AIで写真を自動整理 |
| Category | Photo & Video |
| Description | 写真を自動でイベントごとにグループ化し、タイムラインで表示するアプリです。AIが写真の内容を分析し、イベントのタイトルを自動生成します。 |
| Keywords | 写真,アルバム,タイムライン,思い出,AI,整理,イベント |
| Support URL | https://github.com/nagiando-byte/photo-memory-timeline |
| Privacy Policy URL | （プライバシーポリシーのURL） |

### スクリーンショット

以下のサイズが必要:
- iPhone 6.7" (1290 x 2796)
- iPhone 6.5" (1284 x 2778)
- iPhone 5.5" (1242 x 2208)
- iPad Pro 12.9" (2048 x 2732) - タブレット対応の場合

### App Privacy

以下のデータ収集を宣言:
- Photos: 写真の分析と表示
- Location: 写真の撮影場所表示
- User Content: AI分析結果

---

## Step 8: 審査に提出

1. すべての情報を入力
2. "Add for Review" をクリック
3. 審査完了を待つ（通常 24-48 時間）

---

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュクリア
eas build --platform ios --clear-cache
```

### 証明書エラー

```bash
# 証明書をリセット
eas credentials --platform ios
```

### 審査リジェクト対応

一般的なリジェクト理由:
1. **Guideline 2.1** - アプリがクラッシュ → バグ修正
2. **Guideline 4.0** - デザイン問題 → UI改善
3. **Guideline 5.1.1** - プライバシー → プライバシーポリシー追加

---

## コマンドまとめ

```bash
# Expo ログイン
eas login

# プロジェクト初期化
eas init

# iOS ビルド（本番）
eas build --platform ios --profile production

# App Store に提出
eas submit --platform ios --profile production

# ビルド状況確認
eas build:list

# 証明書管理
eas credentials
```

---

## 参考リンク

- [Expo EAS Build ドキュメント](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
