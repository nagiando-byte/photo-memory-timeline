# Photo Memory Timeline - 詳細要件定義・技術仕様書

## エグゼクティブサマリー

本ドキュメントは、iPhone写真フォルダから自動的に思い出を整理・振り返りできるモバイルアプリ「Photo Memory Timeline」の詳細な要件定義と技術仕様を記載したものである。本アプリは、大量に蓄積された写真から「いつ・誰と・何をしたか」を自動的に抽出し、月次・イベント単位でタイムライン表示することで、ユーザーの思い出の振り返りを支援する。

---

## 1. プロジェクト概要

### 1.1 プロジェクト名
**Photo Memory Timeline**

### 1.2 開発目的
iPhoneの写真フォルダに蓄積された大量の写真を自動的に整理し、時系列での振り返りを容易にするモバイルアプリケーションを開発する。AI技術を活用して写真から人物、イベント、場所を自動検出し、ユーザーの手間を最小限に抑えながら豊かな思い出体験を提供する。

### 1.3 ターゲットユーザー
写真を頻繁に撮影するが整理する時間がないユーザー、過去の思い出を簡単に振り返りたいユーザー、家族や友人との思い出を大切にしたいユーザー。

### 1.4 主要な価値提案
写真を同期するだけで、AIが自動的に「いつ・誰と・何をしたか」を整理し、月次・イベント単位で美しいタイムラインとして表示する。手動での整理作業は不要で、忘れていた思い出を再発見できる。

---

## 2. 機能要件

### 2.1 写真同期機能（Phase 1: MVP）

#### 2.1.1 写真ライブラリアクセス
ユーザーがアプリ初回起動時に写真ライブラリへのアクセス許可を求める。iOSの写真アクセス権限には以下の3つのレベルがあり、ユーザーが選択可能である。

- **全写真へのアクセス**: すべての写真を同期
- **選択した写真のみ**: ユーザーが選択した写真のみ同期
- **アクセスなし**: アプリは写真にアクセスできない

アプリは「選択した写真のみ」モードでも動作可能とし、ユーザーが後から写真を追加できる機能を提供する。

#### 2.1.2 メタデータ抽出
各写真から以下のメタデータを抽出する。

| メタデータ項目 | 説明 | 取得方法 |
|---|---|---|
| 撮影日時 | 写真が撮影された日時 | EXIF情報 |
| 撮影場所（GPS） | 緯度・経度情報 | EXIF情報 |
| ファイル名 | 写真のファイル名 | ファイルシステム |
| 解像度 | 画像の幅・高さ | 画像情報 |
| ファイルサイズ | 写真のサイズ | ファイルシステム |

#### 2.1.3 同期方式
初回同期後は、新しく追加された写真のみを増分同期する。バックグラウンド同期は実装せず、アプリ起動時またはユーザーが手動で同期ボタンを押した際に同期を行う。

---

### 2.2 AI分析機能（Phase 2）

#### 2.2.1 イベント自動検出
撮影日時と場所情報を基に、連続して撮影された写真群を1つのイベントとして自動的にグルーピングする。

**グルーピングロジック**:
- 時間的に近い写真（例：2時間以内）を同一イベントとみなす
- 場所が大きく変わった場合は別イベントとして分割
- 1日に複数のイベントが存在する可能性を考慮

**イベント期間の定義**:
- 最初の写真の撮影時刻から最後の写真の撮影時刻までをイベント期間とする
- 1枚のみの写真も1つのイベントとして扱う

#### 2.2.2 画像内容分析
各写真の内容を分析し、以下の情報を抽出する。

| 分析項目 | 説明 | 実装方法 |
|---|---|---|
| シーン分類 | 食事、旅行、スポーツ、会議など | OpenAI Vision API |
| 物体検出 | 写真に写っている物体 | OpenAI Vision API |
| テキスト認識 | 写真内の文字情報 | Vision Framework OCR |
| 雰囲気・感情 | 写真の雰囲気（楽しい、静か、など） | OpenAI Vision API |

#### 2.2.3 人物認識（Phase 2）
写真内の人物を検出し、同一人物をグルーピングする。

**技術的制約**: iOSの写真アプリが持つ「People」アルバムのデータには、サードパーティアプリからアクセスできない。そのため、独自に人物認識を実装する必要がある。

**実装アプローチ**:
1. **顔検出**: Vision Frameworkの`VNDetectFaceRectanglesRequest`を使用して顔領域を検出
2. **顔特徴抽出**: Vision Frameworkの`VNDetectFaceLandmarksRequest`で顔の特徴点を抽出
3. **顔クラスタリング**: 類似した顔特徴を持つ顔をグルーピング（機械学習モデルまたはクラウドAPI使用）
4. **人物ラベル付け**: ユーザーが各グループに名前を付けられる機能を提供

**プライバシー配慮**:
- 顔特徴データは暗号化してローカルまたはユーザー専用クラウドに保存
- ユーザーの明示的な同意なしに顔データを外部送信しない

#### 2.2.4 場所情報の解析
GPS座標から具体的な場所名を取得する。

**実装方法**:
- iOS標準の逆ジオコーディングAPI（`CLGeocoder`）を使用
- 住所、都市名、国名を取得
- 可能であれば施設名（レストラン名、観光地名など）も取得

#### 2.2.5 イベントサマリー自動生成
各イベントについて、以下の情報を含むサマリーを自動生成する。

**サマリー構成要素**:
- **いつ**: 「2024年3月15日 午後2時〜午後5時」
- **誰と**: 「太郎、花子、次郎」（人物認識結果）
- **何を**: 「レストランでの食事」（画像内容分析結果）
- **どこで**: 「東京都渋谷区、〇〇レストラン」（場所情報）

**自動タイトル生成**:
OpenAI APIを使用して、上記情報から自然な日本語のイベントタイトルを生成する。
例: 「渋谷で太郎・花子とランチ」

---

### 2.3 タイムライン・アルバム表示機能（Phase 3）

#### 2.3.1 月次カレンダービュー
月ごとのカレンダー形式でイベントを表示する。

**表示要素**:
- 各日付にその日のイベント数を表示
- 各日付の代表写真をサムネイル表示
- イベントがある日付はハイライト表示

**インタラクション**:
- 日付をタップすると、その日のイベント一覧が表示される
- 月を切り替えるスワイプジェスチャー

#### 2.3.2 イベント一覧ビュー
選択した期間（日、週、月）のイベントを時系列で一覧表示する。

**表示要素**:
- イベントタイトル
- イベント期間
- 代表写真（1〜3枚）
- 参加人物のアイコン
- 場所情報

**インタラクション**:
- イベントをタップすると詳細ビューに遷移
- 上下スクロールで過去・未来のイベントを閲覧

#### 2.3.3 イベント詳細ビュー
個別イベントの詳細情報と写真を表示する。

**表示要素**:
- イベントタイトル（編集可能）
- 自動生成されたサマリー
  - いつ
  - 誰と
  - 何を
  - どこで
- イベント内の全写真をグリッド表示
- 地図上での場所表示

**インタラクション**:
- 写真をタップして全画面表示
- 写真を左右スワイプで次の写真へ
- イベント情報の手動編集
- 写真の追加・削除

#### 2.3.4 検索・フィルタリング機能
ユーザーが特定の条件で写真・イベントを検索できる。

**検索条件**:
- 日付範囲
- 人物名
- 場所
- イベントタイプ（食事、旅行、など）
- キーワード（イベントタイトル、サマリー内のテキスト）

**検索結果表示**:
- 条件に合致するイベント一覧
- 条件に合致する写真一覧

---

### 2.4 編集・カスタマイズ機能（Phase 3）

#### 2.4.1 イベント編集
ユーザーがイベント情報を手動で編集できる。

**編集可能項目**:
- イベントタイトル
- イベント期間（開始・終了日時）
- 参加人物の追加・削除
- 場所情報の修正
- イベントタイプの変更

#### 2.4.2 人物管理
検出された人物に名前を付けて管理する。

**機能**:
- 人物グループ一覧の表示
- 各グループに名前を付ける
- 誤ってグルーピングされた顔を分離
- 別グループの顔を統合
- 人物の代表写真を設定

#### 2.4.3 イベント統合・分割
自動検出されたイベントを手動で調整する。

**機能**:
- 複数のイベントを1つに統合
- 1つのイベントを複数に分割
- イベント間で写真を移動

---

### 2.5 共有機能（Phase 4）

#### 2.5.1 イベント共有
特定のイベントを他のユーザーと共有する。

**共有方法**:
- 共有リンクの生成
- QRコードでの共有
- メール・メッセージアプリ経由での共有

**共有設定**:
- 閲覧のみ / コメント可能 / 写真追加可能
- 共有期限の設定
- パスワード保護

#### 2.5.2 アルバムエクスポート
イベントまたは期間を指定して、写真をエクスポートする。

**エクスポート形式**:
- ZIP形式での一括ダウンロード
- PDF形式でのアルバム作成
- スライドショー動画の生成

---

## 3. 非機能要件

### 3.1 パフォーマンス要件

| 項目 | 目標値 | 測定方法 |
|---|---|---|
| アプリ起動時間 | 3秒以内 | 起動からホーム画面表示まで |
| 写真同期速度 | 1000枚で5分以内 | 初回同期時 |
| AI分析速度 | 1枚あたり2秒以内 | 画像内容分析 |
| 画面遷移速度 | 0.5秒以内 | タップから次画面表示まで |
| スクロール性能 | 60fps維持 | イベント一覧のスクロール時 |

### 3.2 セキュリティ・プライバシー要件

本アプリは個人の写真という極めてセンシティブな情報を扱うため、最高水準のセキュリティとプライバシー保護を実装する。

#### 3.2.1 データ保存
ユーザーは以下の2つのモードから選択可能とする。

**ローカルモード**:
- 全データをデバイス内のみに保存
- クラウド同期なし
- デバイス紛失時はデータ復旧不可

**クラウド同期モード**:
- 写真とメタデータをユーザー専用のクラウドストレージに保存
- エンドツーエンド暗号化
- 複数デバイス間での同期が可能

#### 3.2.2 暗号化
- 顔特徴データ: AES-256で暗号化
- データベース: SQLCipherで暗号化
- 通信: HTTPS/TLS 1.3以上

#### 3.2.3 認証
- ユーザー認証: OAuth 2.0（Manus-Oauth使用）
- 生体認証: Face ID / Touch ID対応
- セッション管理: JWT

#### 3.2.4 プライバシーポリシー
- 写真データはユーザーの明示的な同意なしに外部送信しない
- AI分析に使用する写真は、分析後直ちにサーバーから削除
- ユーザーデータの販売・第三者提供は一切行わない

### 3.3 互換性要件

| 項目 | 要件 |
|---|---|
| iOS バージョン | iOS 15.0以上 |
| デバイス | iPhone 8以降 |
| ストレージ | 最低500MB以上の空き容量 |
| ネットワーク | Wi-Fi推奨（モバイルデータでも動作） |

### 3.4 ユーザビリティ要件

アプリは直感的で使いやすいUIを提供し、技術に詳しくないユーザーでも簡単に利用できることを目指す。

- **言語**: 日本語（将来的に英語など多言語対応）
- **アクセシビリティ**: VoiceOver対応、ダイナミックタイプ対応
- **オフライン動作**: ネットワーク接続なしでも閲覧可能（AI分析は除く）
- **ヘルプ機能**: 初回起動時のチュートリアル、各画面でのヘルプ表示

### 3.5 スケーラビリティ要件

- 10,000枚以上の写真でも快適に動作
- データベースクエリの最適化（インデックス使用）
- 画像のサムネイルキャッシュ
- 仮想スクロール（Virtualized List）の使用

---

## 4. 技術仕様

### 4.1 技術スタック

#### 4.1.1 フロントエンド（モバイルアプリ）

| 技術 | バージョン | 用途 |
|---|---|---|
| React Native | 最新安定版 | クロスプラットフォーム開発 |
| Expo | SDK 52以上 | 開発環境・ビルドツール |
| TypeScript | 5.x | 型安全な開発 |
| TailwindCSS (NativeWind) | 最新版 | スタイリング |
| React Navigation | 6.x | 画面遷移 |
| Expo MediaLibrary | 最新版 | 写真アクセス |
| Expo Location | 最新版 | 位置情報取得 |

#### 4.1.2 バックエンド

| 技術 | 用途 |
|---|---|
| Node.js + Express | RESTful API |
| Drizzle ORM | データベースORM |
| MySQL / TiDB | リレーショナルデータベース |
| Manus-Oauth | ユーザー認証 |

#### 4.1.3 AI・機械学習

| 技術 | 用途 |
|---|---|
| OpenAI Vision API | 画像内容分析、イベントサマリー生成 |
| iOS Vision Framework | 顔検出、テキスト認識 |
| OpenAI GPT-4 | イベントタイトル自動生成 |

#### 4.1.4 インフラ・その他

| 技術 | 用途 |
|---|---|
| AWS S3 / Cloudflare R2 | 画像ストレージ |
| Expo EAS | アプリビルド・配信 |
| GitHub | バージョン管理 |

### 4.2 データベース設計

#### 4.2.1 ER図（概念）

主要なエンティティとリレーションシップを以下に示す。

**エンティティ**:
- **User**: ユーザー情報
- **Photo**: 写真情報
- **Event**: イベント情報
- **Person**: 人物情報
- **Face**: 顔検出結果
- **Location**: 場所情報
- **EventShare**: イベント共有情報

**リレーションシップ**:
- User 1:N Photo（1人のユーザーは複数の写真を持つ）
- User 1:N Event（1人のユーザーは複数のイベントを持つ）
- Event 1:N Photo（1つのイベントは複数の写真を含む）
- Photo 1:N Face（1枚の写真には複数の顔が含まれる）
- Person 1:N Face（1人の人物は複数の顔検出結果に紐づく）
- Event 1:1 Location（1つのイベントは1つの場所を持つ）
- Event 1:N EventShare（1つのイベントは複数のユーザーと共有可能）

#### 4.2.2 テーブル定義

##### users テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | ユーザーID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | メールアドレス |
| name | VARCHAR(100) | NOT NULL | ユーザー名 |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

##### photos テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | 写真ID |
| user_id | UUID | FOREIGN KEY, NOT NULL | ユーザーID |
| event_id | UUID | FOREIGN KEY, NULLABLE | イベントID |
| file_path | VARCHAR(500) | NOT NULL | ファイルパス |
| thumbnail_path | VARCHAR(500) | NULLABLE | サムネイルパス |
| taken_at | TIMESTAMP | NOT NULL | 撮影日時 |
| latitude | DECIMAL(10, 8) | NULLABLE | 緯度 |
| longitude | DECIMAL(11, 8) | NULLABLE | 経度 |
| width | INT | NOT NULL | 画像幅 |
| height | INT | NOT NULL | 画像高さ |
| file_size | BIGINT | NOT NULL | ファイルサイズ |
| analyzed | BOOLEAN | DEFAULT FALSE | AI分析済みフラグ |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |

##### events テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | イベントID |
| user_id | UUID | FOREIGN KEY, NOT NULL | ユーザーID |
| title | VARCHAR(200) | NOT NULL | イベントタイトル |
| description | TEXT | NULLABLE | イベント説明 |
| start_time | TIMESTAMP | NOT NULL | 開始日時 |
| end_time | TIMESTAMP | NOT NULL | 終了日時 |
| location_id | UUID | FOREIGN KEY, NULLABLE | 場所ID |
| event_type | VARCHAR(50) | NULLABLE | イベントタイプ |
| cover_photo_id | UUID | FOREIGN KEY, NULLABLE | カバー写真ID |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

##### persons テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | 人物ID |
| user_id | UUID | FOREIGN KEY, NOT NULL | ユーザーID |
| name | VARCHAR(100) | NULLABLE | 人物名 |
| representative_face_id | UUID | FOREIGN KEY, NULLABLE | 代表顔ID |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

##### faces テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | 顔ID |
| photo_id | UUID | FOREIGN KEY, NOT NULL | 写真ID |
| person_id | UUID | FOREIGN KEY, NULLABLE | 人物ID |
| face_rect_x | FLOAT | NOT NULL | 顔領域X座標 |
| face_rect_y | FLOAT | NOT NULL | 顔領域Y座標 |
| face_rect_width | FLOAT | NOT NULL | 顔領域幅 |
| face_rect_height | FLOAT | NOT NULL | 顔領域高さ |
| face_encoding | BLOB | NULLABLE | 顔特徴ベクトル（暗号化） |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |

##### locations テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | 場所ID |
| latitude | DECIMAL(10, 8) | NOT NULL | 緯度 |
| longitude | DECIMAL(11, 8) | NOT NULL | 経度 |
| address | VARCHAR(500) | NULLABLE | 住所 |
| city | VARCHAR(100) | NULLABLE | 都市名 |
| country | VARCHAR(100) | NULLABLE | 国名 |
| place_name | VARCHAR(200) | NULLABLE | 施設名 |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |

##### event_shares テーブル
| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PRIMARY KEY | 共有ID |
| event_id | UUID | FOREIGN KEY, NOT NULL | イベントID |
| shared_by_user_id | UUID | FOREIGN KEY, NOT NULL | 共有元ユーザーID |
| share_token | VARCHAR(100) | UNIQUE, NOT NULL | 共有トークン |
| permission | ENUM | NOT NULL | 権限（view/comment/edit） |
| expires_at | TIMESTAMP | NULLABLE | 有効期限 |
| password_hash | VARCHAR(255) | NULLABLE | パスワードハッシュ |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |

### 4.3 API設計

#### 4.3.1 認証API

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/auth/register` | POST | ユーザー登録 |
| `/api/auth/login` | POST | ログイン |
| `/api/auth/logout` | POST | ログアウト |
| `/api/auth/refresh` | POST | トークン更新 |

#### 4.3.2 写真API

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/photos` | GET | 写真一覧取得 |
| `/api/photos/:id` | GET | 写真詳細取得 |
| `/api/photos` | POST | 写真アップロード |
| `/api/photos/:id` | DELETE | 写真削除 |
| `/api/photos/sync` | POST | 写真同期 |

#### 4.3.3 イベントAPI

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/events` | GET | イベント一覧取得 |
| `/api/events/:id` | GET | イベント詳細取得 |
| `/api/events` | POST | イベント作成 |
| `/api/events/:id` | PUT | イベント更新 |
| `/api/events/:id` | DELETE | イベント削除 |
| `/api/events/:id/photos` | GET | イベント内写真取得 |

#### 4.3.4 人物API

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/persons` | GET | 人物一覧取得 |
| `/api/persons/:id` | GET | 人物詳細取得 |
| `/api/persons/:id` | PUT | 人物情報更新 |
| `/api/persons/:id/merge` | POST | 人物統合 |

#### 4.3.5 AI分析API

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/analyze/photo/:id` | POST | 写真分析実行 |
| `/api/analyze/event/:id` | POST | イベント分析実行 |
| `/api/analyze/faces/:photoId` | POST | 顔検出実行 |

#### 4.3.6 共有API

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/shares` | POST | 共有リンク作成 |
| `/api/shares/:token` | GET | 共有イベント取得 |
| `/api/shares/:id` | DELETE | 共有削除 |

### 4.4 アーキテクチャ設計

#### 4.4.1 システム構成図

```
[iPhone App (React Native + Expo)]
    ↓ HTTPS
[API Gateway / Load Balancer]
    ↓
[Backend API Server (Node.js + Express)]
    ↓
[Database (MySQL / TiDB)]
    ↓
[Object Storage (S3 / R2)]

[External Services]
- OpenAI API (画像分析、テキスト生成)
- Manus OAuth (認証)
```

#### 4.4.2 アプリケーション層構造

**React Native アプリ**:
```
src/
├── screens/          # 画面コンポーネント
│   ├── HomeScreen.tsx
│   ├── TimelineScreen.tsx
│   ├── EventDetailScreen.tsx
│   └── ...
├── components/       # 再利用可能なコンポーネント
│   ├── PhotoGrid.tsx
│   ├── EventCard.tsx
│   └── ...
├── services/         # ビジネスロジック
│   ├── photoService.ts
│   ├── eventService.ts
│   ├── aiService.ts
│   └── ...
├── api/              # API通信
│   ├── client.ts
│   ├── auth.ts
│   ├── photos.ts
│   └── ...
├── store/            # 状態管理（Redux / Zustand）
│   ├── userSlice.ts
│   ├── photoSlice.ts
│   └── ...
├── utils/            # ユーティリティ関数
│   ├── dateUtils.ts
│   ├── imageUtils.ts
│   └── ...
└── types/            # TypeScript型定義
    ├── photo.ts
    ├── event.ts
    └── ...
```

**Backend API**:
```
src/
├── routes/           # APIルート定義
│   ├── auth.ts
│   ├── photos.ts
│   ├── events.ts
│   └── ...
├── controllers/      # コントローラー
│   ├── photoController.ts
│   ├── eventController.ts
│   └── ...
├── services/         # ビジネスロジック
│   ├── photoService.ts
│   ├── aiService.ts
│   └── ...
├── models/           # データモデル（Drizzle ORM）
│   ├── user.ts
│   ├── photo.ts
│   └── ...
├── middleware/       # ミドルウェア
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── ...
└── utils/            # ユーティリティ関数
    ├── encryption.ts
    └── ...
```

### 4.5 AI分析ワークフロー

#### 4.5.1 写真同期時の処理フロー

```
1. ユーザーが写真同期を実行
2. Expo MediaLibraryから写真一覧を取得
3. 各写真のメタデータ（EXIF）を抽出
4. サーバーに写真とメタデータをアップロード
5. サーバーはデータベースに写真情報を保存
6. サムネイル画像を生成してストレージに保存
7. AI分析キューに写真を追加
```

#### 4.5.2 AI分析処理フロー

```
1. AI分析キューから未分析の写真を取得
2. Vision Frameworkで顔検出を実行
   - 検出された顔領域をデータベースに保存
   - 顔特徴ベクトルを抽出・暗号化して保存
3. OpenAI Vision APIで画像内容分析を実行
   - シーン分類
   - 物体検出
   - 雰囲気・感情分析
4. 分析結果をデータベースに保存
5. 写真の`analyzed`フラグをtrueに更新
```

#### 4.5.3 イベント自動生成フロー

```
1. 全写真を撮影日時でソート
2. 時間的に近い写真をグルーピング
   - 2時間以内の写真を同一イベント候補とする
   - GPS情報が大きく変わった場合は分割
3. 各イベントについて以下を実行:
   - 開始・終了日時を決定
   - 代表写真を選定（最初の写真または顔が写っている写真）
   - 場所情報を逆ジオコーディング
   - 参加人物を抽出（イベント内の全顔から人物を特定）
4. OpenAI GPT-4でイベントタイトルを生成
   - プロンプト: 「以下の情報から自然な日本語のイベントタイトルを生成してください。日時: {}, 場所: {}, 人物: {}, 内容: {}」
5. イベントをデータベースに保存
```

### 4.6 セキュリティ実装詳細

#### 4.6.1 顔特徴データの暗号化

顔特徴ベクトルは個人を特定できる情報であるため、以下の方法で暗号化する。

**暗号化アルゴリズム**: AES-256-GCM
**鍵管理**: ユーザーごとに異なる暗号化鍵を生成し、鍵自体はマスターキーで暗号化して保存

**実装例**（Node.js）:
```typescript
import crypto from 'crypto';

function encryptFaceEncoding(faceEncoding: Float32Array, userKey: Buffer): Buffer {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', userKey, iv);
  
  const buffer = Buffer.from(faceEncoding.buffer);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, encrypted]);
}
```

#### 4.6.2 API認証フロー

1. ユーザーがログイン（Manus OAuth経由）
2. サーバーがJWTアクセストークンとリフレッシュトークンを発行
3. クライアントはアクセストークンをHTTPヘッダーに含めてAPIリクエスト
4. サーバーはトークンを検証し、有効であればリクエストを処理
5. アクセストークンの有効期限が切れた場合、リフレッシュトークンで新しいアクセストークンを取得

---

## 5. 開発フェーズと優先順位

### Phase 1: MVP（最小viable製品） - 2週間

**目標**: 基本的な写真同期と時系列表示を実現する。

**実装機能**:
- ユーザー登録・ログイン
- 写真ライブラリアクセス許可
- 写真の同期（メタデータ抽出）
- 写真一覧表示（日付順）
- 簡易的な月次カレンダービュー

**技術タスク**:
- Expoプロジェクト初期化
- Manus OAuth統合
- Expo MediaLibrary統合
- バックエンドAPI基本構造
- データベーススキーマ作成
- 写真アップロードAPI実装

**成果物**:
- 動作するモバイルアプリ（iOS）
- 写真を同期して日付順に表示できる

---

### Phase 2: AI分析機能 - 3週間

**目標**: 写真から自動的にイベントを検出し、基本的な分析を行う。

**実装機能**:
- イベント自動検出
- 画像内容分析（OpenAI Vision API）
- 場所情報の逆ジオコーディング
- イベント一覧表示
- イベント詳細表示

**技術タスク**:
- OpenAI API統合
- Vision Framework統合（顔検出）
- イベント自動生成アルゴリズム実装
- 逆ジオコーディング実装
- AI分析バックグラウンドジョブ

**成果物**:
- 自動的にイベントが生成される
- イベントごとに写真が整理される
- 場所情報が表示される

---

### Phase 3: 人物認識と高度なUI - 3週間

**目標**: 人物認識機能を実装し、ユーザー体験を向上させる。

**実装機能**:
- 顔検出と人物グルーピング
- 人物名の登録・編集
- イベントサマリー自動生成
- 検索・フィルタリング機能
- イベント編集機能

**技術タスク**:
- 顔クラスタリングアルゴリズム実装
- 顔特徴データの暗号化
- 人物管理UI実装
- 検索機能実装
- イベント編集UI実装

**成果物**:
- 人物ごとに写真を検索できる
- イベントに「誰と」が表示される
- ユーザーがイベント情報を編集できる

---

### Phase 4: 共有機能と最適化 - 2週間

**目標**: イベント共有機能を実装し、パフォーマンスを最適化する。

**実装機能**:
- イベント共有リンク生成
- 共有イベントの閲覧
- アルバムエクスポート
- パフォーマンス最適化
- UI/UX改善

**技術タスク**:
- 共有API実装
- 共有ページUI実装
- PDFエクスポート機能
- データベースクエリ最適化
- 画像キャッシュ最適化
- ユーザーテスト実施

**成果物**:
- イベントを他のユーザーと共有できる
- アプリが快適に動作する
- 本番環境へのデプロイ準備完了

---

## 6. 開発環境セットアップ手順

### 6.1 必要なツール

- Node.js 18以上
- pnpm または npm
- Expo CLI
- Xcode（iOS開発用）
- Git

### 6.2 プロジェクト初期化コマンド

```bash
# Expoプロジェクト作成
npx create-expo-app@latest photo-memory-timeline --template

# プロジェクトディレクトリに移動
cd photo-memory-timeline

# 必要なパッケージをインストール
npx expo install expo-media-library expo-location expo-image-picker
npx expo install react-navigation @react-navigation/native @react-navigation/stack
npx expo install nativewind tailwindcss
npx expo install drizzle-orm mysql2

# TypeScript設定
npx expo install typescript @types/react @types/react-native

# 開発サーバー起動
npx expo start
```

### 6.3 バックエンドセットアップ

```bash
# バックエンドディレクトリ作成
mkdir backend
cd backend

# package.json作成
pnpm init

# 必要なパッケージをインストール
pnpm add express cors dotenv
pnpm add drizzle-orm mysql2
pnpm add jsonwebtoken bcrypt
pnpm add openai
pnpm add -D typescript @types/node @types/express ts-node nodemon

# TypeScript設定
npx tsc --init

# 開発サーバー起動
pnpm dev
```

---

## 7. テスト戦略

### 7.1 単体テスト

- ユーティリティ関数のテスト（Jest）
- API エンドポイントのテスト（Supertest）
- データベースモデルのテスト

### 7.2 統合テスト

- 写真同期フローのテスト
- AI分析フローのテスト
- イベント生成フローのテスト

### 7.3 E2Eテスト

- ユーザー登録からイベント閲覧までの一連の流れ
- 写真アップロードから分析完了までの流れ

### 7.4 ユーザーテスト

- Phase 1完了後: 5名のテストユーザーで基本機能を検証
- Phase 3完了後: 10名のテストユーザーで全機能を検証
- フィードバックを基にUI/UX改善

---

## 8. リスクと対策

### 8.1 技術的リスク

| リスク | 影響度 | 対策 |
|---|---|---|
| AI分析の精度が低い | 高 | 複数のAI APIを試し、最適なものを選定 |
| 顔認識の精度が低い | 中 | ユーザーが手動で修正できる機能を提供 |
| 大量の写真でパフォーマンス低下 | 高 | 仮想スクロール、サムネイルキャッシュ、インデックス最適化 |
| iOS写真アクセス権限の制限 | 中 | 「選択した写真のみ」モードでも動作可能に |

### 8.2 ビジネスリスク

| リスク | 影響度 | 対策 |
|---|---|---|
| OpenAI APIコストが高額 | 高 | 分析頻度を制限、ローカル処理優先 |
| ユーザーのプライバシー懸念 | 高 | ローカルモード提供、透明性の高いプライバシーポリシー |
| 競合アプリの存在 | 中 | 独自の価値提案（AI自動整理、美しいUI） |

---

## 9. 今後の拡張可能性

### 9.1 機能拡張

- **動画対応**: 写真だけでなく動画も分析・整理
- **音声メモ**: イベントに音声メモを追加
- **コラボレーション**: 複数ユーザーで1つのイベントを共同編集
- **プリント注文**: イベントから直接フォトブックを注文
- **AI チャットボット**: 「去年の夏に誰と旅行した？」などの質問に回答

### 9.2 プラットフォーム拡張

- **Android対応**: React Nativeのため比較的容易
- **Web版**: ブラウザからもアクセス可能に
- **macOS/Windows デスクトップアプリ**: Electronで実装

### 9.3 ビジネスモデル

- **フリーミアム**: 基本機能無料、高度な機能は有料
- **ストレージ課金**: 一定容量以上は有料
- **プリントサービス**: フォトブック作成で収益化

---

## 10. まとめ

本ドキュメントでは、iPhone写真フォルダから思い出を自動整理・振り返りできるモバイルアプリ「Photo Memory Timeline」の詳細な要件定義と技術仕様を示した。本アプリは、AI技術を活用して「いつ・誰と・何をしたか」を自動的に抽出し、ユーザーに豊かな思い出体験を提供する。

開発は4つのフェーズに分けて段階的に進め、各フェーズで動作する成果物を作成する。Phase 1では基本的な写真同期と表示、Phase 2ではAI分析機能、Phase 3では人物認識と高度なUI、Phase 4では共有機能と最適化を実装する。

技術スタックとしては、React Native + Expo、Node.js + Express、MySQL、OpenAI APIを採用し、セキュリティとプライバシーを最優先に設計する。

本仕様書は、Claude CodeやCursorなどのAIコーディングツールでも開発可能なように、詳細な技術情報とデータベース設計、API設計を含んでいる。

---

## 付録A: 用語集

| 用語 | 説明 |
|---|---|
| EXIF | 画像ファイルに埋め込まれるメタデータ形式 |
| GPS | 全地球測位システム、位置情報 |
| 逆ジオコーディング | 緯度・経度から住所や場所名を取得する処理 |
| JWT | JSON Web Token、認証トークン形式 |
| OAuth | 認証・認可のための標準プロトコル |
| ORM | Object-Relational Mapping、データベース操作を簡易化 |
| MVP | Minimum Viable Product、最小viable製品 |
| Vision Framework | AppleのコンピュータビジョンAPI |

---

## 付録B: 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Apple Vision Framework](https://developer.apple.com/documentation/vision)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

**ドキュメントバージョン**: 1.0  
**最終更新日**: 2026年1月4日  
**作成者**: Manus AI Agent
