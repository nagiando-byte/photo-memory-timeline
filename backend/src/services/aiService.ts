import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PhotoAnalysis {
  scene: string;
  sceneJa: string;
  objects: string[];
  atmosphere: string;
  atmosphereJa: string;
  description: string;
  people_count: number;
  suggested_title: string;
  tags: string[];
}

export interface FaceAnalysis {
  faces: Array<{
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    description: string;
  }>;
}

export interface EventSummary {
  title: string;
  description: string;
  when: string;
  who: string;
  what: string;
  where: string;
  mood: string;
}

/**
 * Analyze photo content using OpenAI Vision API
 */
export async function analyzePhotoContent(imagePath: string): Promise<PhotoAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `この写真を分析して、以下の情報をJSON形式で返してください。必ず有効なJSONのみを返し、他のテキストは含めないでください。

{
  "scene": "シーンの種類（英語: meal, travel, sports, meeting, celebration, nature, urban, home, work, shopping, entertainment, other）",
  "sceneJa": "シーンの日本語名（例: 食事, 旅行, スポーツ）",
  "objects": ["写っている主要な物体のリスト（日本語）"],
  "atmosphere": "雰囲気（英語: joyful, calm, exciting, romantic, nostalgic, formal, casual）",
  "atmosphereJa": "雰囲気の日本語（例: 楽しい, 穏やか, 活気がある）",
  "description": "写真の簡単な説明（日本語、1-2文）",
  "people_count": 写っている人数（数字）,
  "suggested_title": "この写真/イベントの提案タイトル（日本語、10文字以内）",
  "tags": ["関連するタグ（日本語、3-5個）"]
}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as PhotoAnalysis;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Failed to parse AI analysis result');
  }
}

/**
 * Detect faces in a photo
 */
export async function detectFaces(imagePath: string): Promise<FaceAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `この写真に写っている人物の顔を検出し、以下の情報をJSON形式で返してください。必ず有効なJSONのみを返してください。

{
  "faces": [
    {
      "boundingBox": {
        "x": 顔の左上X座標（0-1の相対座標）,
        "y": 顔の左上Y座標（0-1の相対座標）,
        "width": 顔の幅（0-1の相対値）,
        "height": 顔の高さ（0-1の相対値）
      },
      "description": "この人物の特徴（年齢層、表情など、日本語）"
    }
  ]
}

人物がいない場合は {"faces": []} を返してください。`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as FaceAnalysis;
  } catch (error) {
    console.error('Failed to parse face detection response:', content);
    return { faces: [] };
  }
}

/**
 * Generate event summary from multiple photos
 */
export async function generateEventSummary(
  photoAnalyses: PhotoAnalysis[],
  locationName?: string,
  dateStr?: string
): Promise<EventSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const analysisText = photoAnalyses
    .map((a, i) => `写真${i + 1}: ${a.description} (シーン: ${a.sceneJa}, 人数: ${a.people_count})`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `以下の複数の写真の分析結果から、イベントのサマリーを生成してください。

写真分析:
${analysisText}

${locationName ? `場所: ${locationName}` : ''}
${dateStr ? `日時: ${dateStr}` : ''}

以下のJSON形式で返してください:
{
  "title": "イベントタイトル（10文字以内、日本語）",
  "description": "イベントの説明（30文字以内、日本語）",
  "when": "いつ（例: 2024年3月の週末）",
  "who": "誰と（例: 友人3人と、家族と、一人で）",
  "what": "何をした（例: 花見を楽しんだ、ランチを食べた）",
  "where": "どこで（例: 上野公園、レストラン）",
  "mood": "全体的な雰囲気（例: 楽しい、リラックス）"
}`,
      },
    ],
    max_tokens: 300,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as EventSummary;
  } catch (error) {
    console.error('Failed to parse event summary response:', content);
    return {
      title: 'イベント',
      description: '',
      when: dateStr || '',
      who: '',
      what: '',
      where: locationName || '',
      mood: '',
    };
  }
}

/**
 * Generate event title from analysis
 */
export async function generateEventTitle(
  analysis: PhotoAnalysis,
  locationName?: string,
  dateStr?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to simple title generation
    if (analysis.suggested_title) {
      return analysis.suggested_title;
    }
    return analysis.sceneJa || 'イベント';
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `以下の情報から、短いイベントタイトルを生成してください（10文字以内、日本語）:

シーン: ${analysis.sceneJa}
説明: ${analysis.description}
${locationName ? `場所: ${locationName}` : ''}
${dateStr ? `日時: ${dateStr}` : ''}

タイトルのみを返してください。`,
      },
    ],
    max_tokens: 50,
  });

  return response.choices[0].message.content?.trim() || analysis.suggested_title || 'イベント';
}
