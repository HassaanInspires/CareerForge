import { Provider } from './types';

/**
 * Unified interface for LLM providers
 */
export interface LLMProvider {
  callAPI(prompt: string, apiKey: string, model: string): Promise<string>;
  getAvailableModels(apiKey: string): Promise<{ id: string; name: string }[]>;
}

/**
 * Custom error for LLM provider issues
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public provider: Provider,
    public status?: number,
    public retryable: boolean = false
  ) {
    super(`[${provider.toUpperCase()} Error] ${message}`);
    this.name = 'LLMError';
  }
}

/**
 * Utility for executing fetch with retries, timeout, and backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  provider: Provider,
  maxRetries = 3,
  timeoutMs = 30000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (response.ok) {
        return response;
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (isRetryable && attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw new LLMError(errorMessage, provider, response.status, isRetryable);
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        lastError = new LLMError('Request timed out', provider, 408, true);
      } else {
        lastError = err;
      }

      if (attempt < maxRetries && (lastError as any).retryable !== false) {
        const backoff = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      break;
    }
  }

  throw lastError || new LLMError('Failed after retries', provider);
}

/**
 * Anthropic Provider Implementation
 */
export class AnthropicProvider implements LLMProvider {
  async callAPI(prompt: string, apiKey: string, model: string): Promise<string> {
    const response = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
        }),
      },
      'anthropic'
    );

    const data = await response.json();
    return data.content[0].text;
  }

  async getAvailableModels(apiKey: string): Promise<{ id: string; name: string }[]> {
    // Anthropic recently added a models API, but it's restricted for some users.
    // We'll try to fetch, and fallback to defaults if it fails.
    try {
      const key = apiKey || process.env.ANTHROPIC_API_KEY || '';
      if (!key) throw new Error('No API key');

      const response = await fetchWithRetry(
        'https://api.anthropic.com/v1/models',
        {
          method: 'GET',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
        },
        'anthropic'
      );
      const data = await response.json();
      return data.data.map((m: any) => ({ id: m.id, name: m.display_name || m.id }));
    } catch (err) {
      return [
        { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      ];
    }
  }
}

/**
 * OpenAI Provider Implementation (also used by Groq/Mistral with base URL changes)
 */
export class OpenAIProvider implements LLMProvider {
  constructor(
    protected provider: Provider = 'openai',
    protected baseUrl: string = 'https://api.openai.com/v1'
  ) {}

  async callAPI(prompt: string, apiKey: string, model: string): Promise<string> {
    const key = apiKey || process.env[`${this.provider.toUpperCase()}_API_KEY`] || '';
    
    const response = await fetchWithRetry(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
        }),
      },
      this.provider
    );

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async getAvailableModels(apiKey: string): Promise<{ id: string; name: string }[]> {
    try {
      const key = apiKey || process.env[`${this.provider.toUpperCase()}_API_KEY`] || '';
      if (!key) throw new Error('No API key');

      const response = await fetchWithRetry(
        `${this.baseUrl}/models`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${key}`,
          },
        },
        this.provider
      );
      const data = await response.json();
      
      // Filter out duplicate models returned by the API
      const seenIds = new Set<string>();
      const uniqueModels: { id: string; name: string }[] = [];
      
      if (Array.isArray(data.data)) {
        data.data.forEach((m: any) => {
          if (m && m.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            uniqueModels.push({ id: m.id, name: m.id });
          }
        });
      }
      
      const models = uniqueModels.filter((m: any) => {
        if (this.provider === 'openai') {
          return m.id.includes('gpt');
        }
        return true;
      });

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (err) {
      return this.getDefaultModels();
    }
  }

  private getDefaultModels() {
    if (this.provider === 'openai') {
      return [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      ];
    }
    if (this.provider === 'groq') {
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      ];
    }
    if (this.provider === 'mistral') {
      return [
        { id: 'mistral-large-latest', name: 'Mistral Large' },
        { id: 'mistral-medium-latest', name: 'Mistral Medium' },
        { id: 'mistral-small-latest', name: 'Mistral Small' },
      ];
    }
    return [];
  }
}

/**
 * Gemini Provider Implementation
 */
export class GeminiProvider implements LLMProvider {
  async callAPI(prompt: string, apiKey: string, model: string): Promise<string> {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
      'gemini'
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async getAvailableModels(apiKey: string): Promise<{ id: string; name: string }[]> {
    try {
      const key = apiKey || process.env.GEMINI_API_KEY || '';
      if (!key) throw new Error('No API key');

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        { method: 'GET' },
        'gemini'
      );
      const data = await response.json();
      return data.models
        .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
        .map((m: any) => ({
          id: m.name.split('/').pop(),
          name: m.displayName || m.name.split('/').pop(),
        }));
    } catch (err) {
      return [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
      ];
    }
  }
}

/**
 * Groq Provider Implementation
 */
export class GroqProvider extends OpenAIProvider {
  constructor() {
    super('groq', 'https://api.groq.com/openai/v1');
  }
}

/**
 * Mistral Provider Implementation
 */
export class MistralProvider extends OpenAIProvider {
  constructor() {
    super('mistral', 'https://api.mistral.ai/v1');
  }
}

/**
 * Factory function to get the appropriate provider
 */
export function getProvider(provider: Provider): LLMProvider {
  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'groq':
      return new GroqProvider();
    case 'mistral':
      return new MistralProvider();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export function resolveActiveLLM(
  dbKeys: Record<string, string>,
  dbModels: Record<string, string>,
  activeProvider: string,
  activeModel: string
): { provider: Provider; model: string; apiKey: string } {
  const requestedProvider = activeProvider as Provider;
  const requestedKey = dbKeys[requestedProvider] || '';
  
  if (requestedKey) {
    return {
      provider: requestedProvider,
      model: activeModel || dbModels[requestedProvider] || getDefaultModelForProvider(requestedProvider),
      apiKey: requestedKey
    };
  }

  // 1. Check database API keys for fallback
  const providersPriority: Provider[] = ['groq', 'mistral', 'openai', 'gemini', 'anthropic'];
  for (const provider of providersPriority) {
    const key = dbKeys[provider] || '';
    if (key) {
      const model = dbModels[provider] || getDefaultModelForProvider(provider);
      return {
        provider,
        model,
        apiKey: key
      };
    }
  }

  // 2. Check system environment variables for fallback
  for (const provider of providersPriority) {
    const envKey = process.env[`${provider.toUpperCase()}_API_KEY`] || '';
    if (envKey) {
      return {
        provider,
        model: dbModels[provider] || getDefaultModelForProvider(provider),
        apiKey: envKey
      };
    }
  }

  // 3. Absolute fallback to requested provider if absolutely no keys exist (throws error at caller level)
  return {
    provider: requestedProvider,
    model: activeModel || dbModels[requestedProvider] || getDefaultModelForProvider(requestedProvider),
    apiKey: ''
  };
}

export function getDefaultModelForProvider(provider: Provider): string {
  switch (provider) {
    case 'anthropic': return 'claude-3-5-sonnet-20240620';
    case 'openai': return 'gpt-4o';
    case 'gemini': return 'gemini-1.5-flash';
    case 'groq': return 'llama-3.3-70b-versatile';
    case 'mistral': return 'mistral-large-latest';
    default: return '';
  }
}
