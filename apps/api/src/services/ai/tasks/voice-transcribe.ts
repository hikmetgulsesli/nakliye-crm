import OpenAI, { toFile } from 'openai';

/**
 * Whisper ile ses → metin. OpenAI API key gerekir.
 */

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY tanimli degil (voice transcribe icin)');
  client = new OpenAI({ apiKey });
  return client;
}

export async function transcribeAudio(
  buffer: Buffer,
  filename: string,
  language: string = 'tr',
): Promise<{ text: string; durationSec?: number }> {
  const file = await toFile(buffer, filename);
  const res = await getClient().audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language,
    response_format: 'verbose_json',
  });
  const r = res as unknown as { text: string; duration?: number };
  return { text: r.text, durationSec: r.duration };
}
