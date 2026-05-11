import OpenAI from 'openai';

const MODEL = process.env.SUMMARY_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

type CacheEntry = { summary: string; createdAt: number };

const cache = new Map<string, CacheEntry>();
let client: OpenAI | null = null;

function getClient(): OpenAI {
    if (!client) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not set');
        client = new OpenAI({ apiKey });
    }
    return client;
}

function hashKey(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
}

function readCache(key: string): string | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.summary;
}

function writeCache(key: string, summary: string): void {
    if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { summary, createdAt: Date.now() });
}

const SYSTEM_PROMPT =
    '당신은 한국어 뉴스 요약 전문가입니다. 입력된 기사 제목과 요약문을 바탕으로 핵심을 한 문장(60자 이내)으로 요약합니다. 추측하지 말고 입력에 명시된 사실만 사용하세요. 불필요한 인사말이나 설명 없이 요약 문장만 출력하세요.';

export type SummarizeInput = {
    title: string;
    description?: string | null;
};

export async function summarizeArticle(input: SummarizeInput): Promise<string> {
    const title = input.title.trim();
    if (!title) throw new Error('title required');

    const description = (input.description ?? '').trim();
    const cacheKey = hashKey(`${title}|${description}`);
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const userText = description
        ? `제목: ${title}\n요약문: ${description}`
        : `제목: ${title}`;

    const response = await getClient().chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userText },
        ],
    });

    const summary = response.choices[0]?.message?.content?.trim() ?? '';
    if (!summary) throw new Error('Empty summary from model');

    writeCache(cacheKey, summary);
    return summary;
}
