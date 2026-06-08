import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm-providers';
import { Provider } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider: providerName, apiKey } = body as { provider: Provider; apiKey?: string };

    if (!providerName) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    try {
      const provider = getProvider(providerName);
      const models = await provider.getAvailableModels(apiKey || '');
      
      return NextResponse.json({ models });
    } catch (err: any) {
      return NextResponse.json(
        { error: `Failed to fetch models: ${err.message}` },
        { status: err.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Models API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
