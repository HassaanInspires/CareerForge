import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm-providers';
import { Provider } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { provider: providerName, apiKey } = body as { provider: Provider; apiKey?: string };

    if (!providerName) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Fallback to database key if apiKey not sent in body
    if (!apiKey) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        if (user?.apiKeys) {
          try {
            const dbKeys = JSON.parse(user.apiKeys);
            if (dbKeys[providerName]) {
              apiKey = dbKeys[providerName];
            }
          } catch (e) {}
        }
      }
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
