# Photo Memory Timeline - 開発ガイド（Claude Code / Cursor用）

このドキュメントは、Claude CodeやCursorなどのAIコーディングツールを使用して本アプリを開発する際のガイドラインです。

---

## 📋 プロジェクト概要

**アプリ名**: Photo Memory Timeline  
**目的**: iPhoneの写真フォルダから自動的に思い出を整理・振り返りできるモバイルアプリ  
**技術スタック**: React Native + Expo, Node.js + Express, MySQL, OpenAI API

---

## 🚀 クイックスタート

### 1. プロジェクト初期化

```bash
# モバイルアプリの初期化
npx create-expo-app@latest photo-memory-timeline --template blank-typescript
cd photo-memory-timeline

# 必要なパッケージをインストール
npx expo install expo-media-library expo-location expo-image-picker
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install nativewind tailwindcss
npx expo install expo-crypto expo-secure-store
npx expo install @tanstack/react-query axios

# バックエンドの初期化
mkdir backend
cd backend
pnpm init
pnpm add express cors dotenv mysql2 drizzle-orm
pnpm add jsonwebtoken bcrypt openai
pnpm add -D typescript @types/node @types/express ts-node nodemon
npx tsc --init
```

### 2. 環境変数の設定

**backend/.env**:
```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/photo_memory

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Manus OAuth
MANUS_OAUTH_CLIENT_ID=your-client-id
MANUS_OAUTH_CLIENT_SECRET=your-client-secret

# Storage
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

**mobile/app.json**:
```json
{
  "expo": {
    "name": "Photo Memory Timeline",
    "slug": "photo-memory-timeline",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.photomemory",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "このアプリは写真を分析して思い出を整理するために、写真ライブラリへのアクセスが必要です。",
        "NSPhotoLibraryAddUsageDescription": "このアプリは編集した写真を保存するために、写真ライブラリへの書き込みが必要です。",
        "NSLocationWhenInUseUsageDescription": "このアプリは写真の撮影場所を特定するために、位置情報へのアクセスが必要です。"
      }
    },
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "このアプリは写真を分析して思い出を整理するために、写真ライブラリへのアクセスが必要です。",
          "savePhotosPermission": "このアプリは編集した写真を保存するために、写真ライブラリへの書き込みが必要です。",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}
```

---

## 📁 プロジェクト構造

### モバイルアプリ（React Native + Expo）

```
photo-memory-timeline/
├── app/                      # Expo Router（推奨）またはsrc/
│   ├── (auth)/              # 認証関連画面
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # メイン画面（タブナビゲーション）
│   │   ├── index.tsx        # ホーム画面
│   │   ├── timeline.tsx     # タイムライン画面
│   │   ├── search.tsx       # 検索画面
│   │   └── profile.tsx      # プロフィール画面
│   ├── event/[id].tsx       # イベント詳細画面
│   └── _layout.tsx          # ルートレイアウト
├── components/
│   ├── PhotoGrid.tsx        # 写真グリッド表示
│   ├── EventCard.tsx        # イベントカード
│   ├── CalendarView.tsx     # カレンダービュー
│   └── PersonAvatar.tsx     # 人物アバター
├── services/
│   ├── photoService.ts      # 写真関連ロジック
│   ├── eventService.ts      # イベント関連ロジック
│   ├── aiService.ts         # AI分析ロジック
│   └── syncService.ts       # 同期ロジック
├── api/
│   ├── client.ts            # API クライアント（axios）
│   ├── auth.ts              # 認証API
│   ├── photos.ts            # 写真API
│   └── events.ts            # イベントAPI
├── store/
│   ├── authStore.ts         # 認証状態管理
│   ├── photoStore.ts        # 写真状態管理
│   └── eventStore.ts        # イベント状態管理
├── types/
│   ├── photo.ts             # 写真型定義
│   ├── event.ts             # イベント型定義
│   └── user.ts              # ユーザー型定義
└── utils/
    ├── dateUtils.ts         # 日付ユーティリティ
    ├── imageUtils.ts        # 画像ユーティリティ
    └── encryption.ts        # 暗号化ユーティリティ
```

### バックエンド（Node.js + Express）

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts          # 認証ルート
│   │   ├── photos.ts        # 写真ルート
│   │   ├── events.ts        # イベントルート
│   │   ├── persons.ts       # 人物ルート
│   │   └── shares.ts        # 共有ルート
│   ├── controllers/
│   │   ├── photoController.ts
│   │   ├── eventController.ts
│   │   └── aiController.ts
│   ├── services/
│   │   ├── photoService.ts
│   │   ├── eventService.ts
│   │   ├── aiService.ts
│   │   └── storageService.ts
│   ├── models/              # Drizzle ORM スキーマ
│   │   ├── schema.ts        # 全テーブル定義
│   │   └── relations.ts     # リレーション定義
│   ├── middleware/
│   │   ├── auth.ts          # JWT認証ミドルウェア
│   │   ├── errorHandler.ts # エラーハンドリング
│   │   └── upload.ts        # ファイルアップロード
│   ├── utils/
│   │   ├── encryption.ts    # 暗号化ユーティリティ
│   │   ├── jwt.ts           # JWT ユーティリティ
│   │   └── logger.ts        # ロガー
│   └── index.ts             # エントリーポイント
├── drizzle/                 # マイグレーションファイル
├── package.json
└── tsconfig.json
```

---

## 🗄️ データベーススキーマ（Drizzle ORM）

### schema.ts

```typescript
import { mysqlTable, varchar, uuid, timestamp, decimal, int, bigint, boolean, text, mysqlEnum, blob } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const photos = mysqlTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  eventId: uuid('event_id').references(() => events.id),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  thumbnailPath: varchar('thumbnail_path', { length: 500 }),
  takenAt: timestamp('taken_at').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  width: int('width').notNull(),
  height: int('height').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  analyzed: boolean('analyzed').default(false),
  analysisResult: text('analysis_result'), // JSON形式で保存
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const events = mysqlTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  locationId: uuid('location_id').references(() => locations.id),
  eventType: varchar('event_type', { length: 50 }),
  coverPhotoId: uuid('cover_photo_id').references(() => photos.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const persons = mysqlTable('persons', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }),
  representativeFaceId: uuid('representative_face_id').references(() => faces.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const faces = mysqlTable('faces', {
  id: uuid('id').primaryKey().defaultRandom(),
  photoId: uuid('photo_id').notNull().references(() => photos.id),
  personId: uuid('person_id').references(() => persons.id),
  faceRectX: decimal('face_rect_x', { precision: 10, scale: 6 }).notNull(),
  faceRectY: decimal('face_rect_y', { precision: 10, scale: 6 }).notNull(),
  faceRectWidth: decimal('face_rect_width', { precision: 10, scale: 6 }).notNull(),
  faceRectHeight: decimal('face_rect_height', { precision: 10, scale: 6 }).notNull(),
  faceEncoding: blob('face_encoding'), // 暗号化された顔特徴ベクトル
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const locations = mysqlTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  placeName: varchar('place_name', { length: 200 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const eventShares = mysqlTable('event_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  sharedByUserId: uuid('shared_by_user_id').notNull().references(() => users.id),
  shareToken: varchar('share_token', { length: 100 }).notNull().unique(),
  permission: mysqlEnum('permission', ['view', 'comment', 'edit']).notNull(),
  expiresAt: timestamp('expires_at'),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## 🔧 主要機能の実装ガイド

### Phase 1: MVP（写真同期と表示）

#### 1.1 写真ライブラリアクセス

**services/photoService.ts**:
```typescript
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

export async function requestPermissions() {
  const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
  const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
  
  return {
    media: mediaStatus === 'granted',
    location: locationStatus === 'granted',
  };
}

export async function syncPhotos() {
  const { media } = await requestPermissions();
  if (!media) {
    throw new Error('写真ライブラリへのアクセスが拒否されました');
  }

  // 全写真を取得
  const assets = await MediaLibrary.getAssetsAsync({
    mediaType: 'photo',
    sortBy: MediaLibrary.SortBy.creationTime,
    first: 1000, // 最初の1000枚
  });

  const photos = [];
  
  for (const asset of assets.assets) {
    // EXIF情報を取得
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
    
    photos.push({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
      location: assetInfo.location,
      exif: assetInfo.exif,
    });
  }

  return photos;
}
```

#### 1.2 写真アップロードAPI

**backend/src/controllers/photoController.ts**:
```typescript
import { Request, Response } from 'express';
import { db } from '../db';
import { photos } from '../models/schema';
import { uploadToS3 } from '../services/storageService';
import sharp from 'sharp';

export async function uploadPhoto(req: Request, res: Response) {
  try {
    const userId = req.user.id; // JWTミドルウェアで設定
    const file = req.file; // multerで処理
    const { takenAt, latitude, longitude, width, height } = req.body;

    // S3にアップロード
    const filePath = await uploadToS3(file.buffer, `photos/${userId}/${Date.now()}.jpg`);

    // サムネイル生成
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailPath = await uploadToS3(thumbnail, `thumbnails/${userId}/${Date.now()}.jpg`);

    // データベースに保存
    const [photo] = await db.insert(photos).values({
      userId,
      filePath,
      thumbnailPath,
      takenAt: new Date(takenAt),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      width: parseInt(width),
      height: parseInt(height),
      fileSize: file.size,
    }).returning();

    res.json({ success: true, photo });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
}
```

---

### Phase 2: AI分析機能

#### 2.1 OpenAI Vision APIで画像分析

**backend/src/services/aiService.ts**:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzePhotoContent(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `この写真を分析して、以下の情報をJSON形式で返してください：
            - scene: シーンの種類（食事、旅行、スポーツ、会議、など）
            - objects: 写っている主要な物体のリスト
            - atmosphere: 写真の雰囲気（楽しい、静か、活気がある、など）
            - description: 写真の簡単な説明（日本語、1-2文）`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}
```

#### 2.2 イベント自動検出

**backend/src/services/eventService.ts**:
```typescript
import { db } from '../db';
import { photos, events, locations } from '../models/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function detectEvents(userId: string) {
  // ユーザーの全写真を取得（撮影日時順）
  const userPhotos = await db.select()
    .from(photos)
    .where(eq(photos.userId, userId))
    .orderBy(photos.takenAt);

  const eventGroups: any[] = [];
  let currentGroup: any[] = [];
  let lastPhotoTime: Date | null = null;

  for (const photo of userPhotos) {
    if (!lastPhotoTime) {
      currentGroup.push(photo);
      lastPhotoTime = photo.takenAt;
      continue;
    }

    const timeDiff = photo.takenAt.getTime() - lastPhotoTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // 2時間以上空いていたら別イベント
    if (hoursDiff > 2) {
      if (currentGroup.length > 0) {
        eventGroups.push([...currentGroup]);
      }
      currentGroup = [photo];
    } else {
      currentGroup.push(photo);
    }

    lastPhotoTime = photo.takenAt;
  }

  // 最後のグループを追加
  if (currentGroup.length > 0) {
    eventGroups.push(currentGroup);
  }

  // 各グループからイベントを作成
  for (const group of eventGroups) {
    const startTime = group[0].takenAt;
    const endTime = group[group.length - 1].takenAt;
    const coverPhotoId = group[0].id;

    // 場所情報を取得（最初の写真のGPS）
    let locationId = null;
    if (group[0].latitude && group[0].longitude) {
      const location = await getOrCreateLocation(
        parseFloat(group[0].latitude),
        parseFloat(group[0].longitude)
      );
      locationId = location.id;
    }

    // イベントタイトルを生成
    const title = await generateEventTitle(group, locationId);

    // イベントを作成
    const [event] = await db.insert(events).values({
      userId,
      title,
      startTime,
      endTime,
      locationId,
      coverPhotoId,
    }).returning();

    // 写真にイベントIDを設定
    for (const photo of group) {
      await db.update(photos)
        .set({ eventId: event.id })
        .where(eq(photos.id, photo.id));
    }
  }

  return eventGroups.length;
}

async function generateEventTitle(photos: any[], locationId: string | null) {
  // 場所情報を取得
  let locationName = '';
  if (locationId) {
    const location = await db.select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);
    if (location[0]) {
      locationName = location[0].placeName || location[0].city || '';
    }
  }

  // 最初の写真を分析
  const firstPhoto = photos[0];
  const analysis = JSON.parse(firstPhoto.analysisResult || '{}');

  // GPT-4でタイトル生成
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'あなたは写真イベントのタイトルを生成するアシスタントです。自然で簡潔な日本語のタイトルを生成してください。',
      },
      {
        role: 'user',
        content: `以下の情報から、イベントのタイトルを生成してください（10文字以内）：
        - 日時: ${firstPhoto.takenAt}
        - 場所: ${locationName}
        - 内容: ${analysis.scene || '不明'}
        - 説明: ${analysis.description || ''}`,
      },
    ],
    max_tokens: 50,
  });

  return response.choices[0].message.content.trim();
}
```

---

### Phase 3: 人物認識

#### 3.1 Vision Frameworkで顔検出（iOS Native Module）

React Nativeから直接Vision Frameworkを使用するには、ネイティブモジュールが必要です。
代わりに、サーバー側で画像を受け取り、OpenAI Vision APIで人物検出を行う方法を推奨します。

**backend/src/services/aiService.ts**:
```typescript
export async function detectFaces(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `この写真に写っている人物の顔を検出し、以下の情報をJSON形式で返してください：
            - faces: 顔のリスト、各顔について：
              - boundingBox: { x, y, width, height }（相対座標、0-1の範囲）
              - description: 顔の特徴（年齢層、性別、表情など）`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}
```

#### 3.2 顔クラスタリング（簡易版）

顔特徴ベクトルの類似度計算は複雑なため、Phase 3では手動でのグルーピングをサポートし、
Phase 4で機械学習モデルを導入することを推奨します。

---

## 🎨 UI/UXガイドライン

### デザインシステム

**TailwindCSS（NativeWind）カラーパレット**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          500: '#2196F3',
          700: '#1976D2',
          900: '#0D47A1',
        },
        secondary: {
          50: '#FFF3E0',
          500: '#FF9800',
          700: '#F57C00',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          500: '#9E9E9E',
          700: '#616161',
          900: '#212121',
        },
      },
    },
  },
};
```

### 主要画面のUI例

#### ホーム画面（月次カレンダー）

```tsx
// app/(tabs)/index.tsx
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState([]);

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-neutral-900 mb-4">
          思い出タイムライン
        </Text>
        
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#2196F3' },
          }}
          theme={{
            todayTextColor: '#FF9800',
            selectedDayBackgroundColor: '#2196F3',
          }}
        />

        <View className="mt-6">
          <Text className="text-lg font-semibold text-neutral-700 mb-3">
            {selectedDate || '今日'}のイベント
          </Text>
          
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
```

---

## 🧪 テスト

### 単体テスト例

**services/eventService.test.ts**:
```typescript
import { describe, it, expect } from '@jest/globals';
import { detectEvents } from './eventService';

describe('eventService', () => {
  it('should group photos into events based on time', async () => {
    const userId = 'test-user-id';
    const eventCount = await detectEvents(userId);
    
    expect(eventCount).toBeGreaterThan(0);
  });
});
```

---

## 📝 開発時の注意事項

### セキュリティ

1. **顔特徴データの暗号化**: 必ずAES-256で暗号化してから保存
2. **JWT トークン**: 有効期限を適切に設定（7日推奨）
3. **API キー**: 環境変数で管理し、コードにハードコーディングしない
4. **写真アクセス権限**: ユーザーに明確に説明し、必要最小限のアクセスのみ要求

### パフォーマンス

1. **画像サムネイル**: 必ずサムネイルを生成し、一覧表示ではサムネイルのみ使用
2. **仮想スクロール**: `FlatList`の`windowSize`を適切に設定
3. **データベースインデックス**: `takenAt`, `userId`, `eventId`にインデックスを作成
4. **API レスポンス**: ページネーションを実装（1ページ20-50件）

### AI API コスト管理

1. **OpenAI Vision API**: 1枚あたり約$0.01-0.03のコストがかかるため、分析は必要な写真のみに限定
2. **キャッシュ**: 一度分析した写真は再分析しない
3. **バッチ処理**: 複数の写真を一度に分析する場合は、並列処理を制限（同時5件まで）

---

## 🚢 デプロイ

### モバイルアプリ（Expo EAS）

```bash
# EAS Build設定
eas build:configure

# iOS ビルド
eas build --platform ios

# TestFlight配信
eas submit --platform ios
```

### バックエンド（例: Railway / Heroku）

```bash
# Dockerfileを作成
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]

# デプロイ
railway up
```

---

## 📚 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

---

## 🤝 開発サポート

このガイドに従って開発を進めてください。各フェーズごとに動作確認を行い、
問題が発生した場合は、エラーメッセージとコンテキストを提供してください。

**Claude Code / Cursor での開発手順**:
1. このドキュメントを開く
2. 「Phase 1から実装を開始してください」と指示
3. 各ファイルの実装コードを生成
4. 動作確認後、次のフェーズへ進む

---

**ドキュメントバージョン**: 1.0  
**最終更新日**: 2026年1月4日
