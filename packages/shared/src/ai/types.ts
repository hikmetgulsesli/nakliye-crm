export type AIProviderName = 'claude' | 'openai' | 'minimax' | 'kimi';

export type AITaskName =
  | 'draft-email'
  | 'win-probability'
  | 'churn-risk'
  | 'coaching'
  | 'summarize'
  | 'custom';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseJson?: boolean;
  task?: AITaskName;
  userId?: number;
}

export interface AIUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface AIChatResult {
  text: string;
  provider: AIProviderName;
  model: string;
  usage: AIUsageInfo;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: AIProviderName;
  readonly defaultModel: string;
  chat(messages: AIMessage[], opts?: AIChatOptions): Promise<AIChatResult>;
  isConfigured(): boolean;
}
