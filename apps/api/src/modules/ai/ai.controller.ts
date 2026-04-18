import { Request, Response } from 'express';
import { aiChat, resolveProvider } from '../../services/ai';
import type { AIMessage, AITaskName } from '@nakliye-crm/shared';

/**
 * Genel amacli AI chat endpoint'i — frontend'den ornek/test icin.
 * Gorev-spesifik endpoint'ler (draft-email, win-probability vb.)
 * sonraki fazlarda modullere eklenir.
 */
export async function chat(req: Request, res: Response) {
  const { messages, model, temperature, maxTokens, task } = req.body as {
    messages: AIMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    task?: AITaskName;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'messages gerekli' });
  }

  const result = await aiChat(messages, {
    model,
    temperature,
    maxTokens,
    task,
    userId: req.user?.userId,
  });
  res.json({ success: true, data: result });
}

export async function status(_req: Request, res: Response) {
  try {
    const provider = await resolveProvider();
    res.json({
      success: true,
      data: {
        provider: provider.name,
        defaultModel: provider.defaultModel,
      },
    });
  } catch (err) {
    res.json({
      success: true,
      data: { provider: null, defaultModel: null, error: (err as Error).message },
    });
  }
}
