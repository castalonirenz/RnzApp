import { NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = 'llava:7b';
const DEFAULT_OLLAMA_HTTP_TIMEOUT_MS = 180000;

const extractJsonObject = (text) => {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Try parsing the first object-looking block.
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!objectMatch?.[0]) return null;

  try {
    return JSON.parse(objectMatch[0]);
  } catch {
    return null;
  }
};

const normalizeAmount = (value) => {
  if (value == null) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  const normalized = String(value).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const pickAmountFromText = (text) => {
  if (!text || typeof text !== 'string') return null;

  const matches = [...text.matchAll(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:\.\d{1,2})\b/g)];
  if (matches.length === 0) return null;

  // Heuristic: amount due / total is usually one of the largest currency-like values.
  const numbers = matches
    .map((match) => normalizeAmount(match[0]))
    .filter((value) => value != null);

  if (numbers.length === 0) return null;
  return Math.max(...numbers);
};

const buildOllamaPayload = (base64Image, modelName) => ({
  model: modelName,
  stream: false,
  format: 'json',
  options: {
    temperature: 0,
  },
  messages: [
    {
      role: 'user',
      content:
        'You read receipts. Return only strict JSON with this shape: {"amount": number|null, "currency": "PHP|USD|UNKNOWN", "note": "short reason"}. Choose the final payable/total amount on the receipt.',
      images: [base64Image],
    },
  ],
});

const describeFetchFailure = (error, ollamaBaseUrl) => {
  const cause = error?.cause;
  const diagnostics = [];

  if (cause?.code) diagnostics.push(`code=${cause.code}`);
  if (cause?.address) diagnostics.push(`address=${cause.address}`);
  if (cause?.port) diagnostics.push(`port=${cause.port}`);

  const details =
    diagnostics.length > 0
      ? diagnostics.join(', ')
      : error?.message || 'Unknown network error';

  return `Cannot connect to Ollama at ${ollamaBaseUrl}. Start Ollama and verify the URL. (${details})`;
};

const requestOllamaChat = async ({ ollamaBaseUrl, modelName, base64Image }) => {
  try {
    const timeoutMs = Number(process.env.OLLAMA_HTTP_TIMEOUT_MS || DEFAULT_OLLAMA_HTTP_TIMEOUT_MS);

    const response = await axios.post(
      `${ollamaBaseUrl}/api/chat`,
      buildOllamaPayload(base64Image, modelName),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_OLLAMA_HTTP_TIMEOUT_MS,
        validateStatus: () => true,
      }
    );

    if (response.status < 200 || response.status >= 300) {
      return {
        ok: false,
        status: response.status,
        errorText:
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {}),
      };
    }

    if (!response.data || typeof response.data !== 'object') {
      return {
        ok: false,
        status: 502,
        errorText: 'Invalid JSON response from Ollama.',
      };
    }

    return {
      ok: true,
      payload: response.data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      errorText: describeFetchFailure(error, ollamaBaseUrl),
    };
  }
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ message: 'Receipt image is required.' }, { status: 400 });
    }

    if (!String(file.type || '').startsWith('image/')) {
      return NextResponse.json({ message: 'Only image files are allowed.' }, { status: 400 });
    }

    if (!file.size || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: 'Receipt image must be between 1 byte and 10 MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');

    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
    const ollamaModel = DEFAULT_OLLAMA_MODEL;

    let activeModel = ollamaModel;
    let ollamaResult = await requestOllamaChat({
      ollamaBaseUrl,
      modelName: activeModel,
      base64Image,
    });

    if (!ollamaResult.ok) {
      const errorText = String(ollamaResult.errorText || '');
      const looksLikeNonVisionModel =
        ollamaResult.status === 400 &&
        /image|vision|multimodal|does not support/i.test(errorText);

      return NextResponse.json(
        {
          message: looksLikeNonVisionModel
            ? `Model "${activeModel}" does not appear to support images. Use a vision model.`
            : `Ollama request failed (${ollamaResult.status}). Ensure Ollama is running and model "${activeModel}" is available.`,
          details: errorText.slice(0, 500) || null,
        },
        { status: 502 }
      );
    }

    const ollamaPayload = ollamaResult.payload;
    const content = String(ollamaPayload?.message?.content || '');
    const parsed = extractJsonObject(content);

    const amountFromJson = normalizeAmount(parsed?.amount);
    const fallbackAmount = pickAmountFromText(content);
    const amount = amountFromJson ?? fallbackAmount;

    return NextResponse.json({
      amount,
      currency: parsed?.currency || 'UNKNOWN',
      note: parsed?.note || '',
      model: activeModel,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Failed to extract amount from receipt.',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
