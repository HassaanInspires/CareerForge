import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider, resolveActiveLLM } from '@/lib/llm-providers';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 });
    }

    // Resolve LLM Provider for Technical Auditing
    let dbKeys: Record<string, string> = {};
    let dbModels: Record<string, string> = {};
    if (user.apiKeys) {
      try { dbKeys = JSON.parse(user.apiKeys); } catch (e) {}
    }
    if (user.selectedModels) {
      try { dbModels = JSON.parse(user.selectedModels); } catch (e) {}
    }

    const resolvedLLM = resolveActiveLLM(
      dbKeys,
      dbModels,
      user.activeProvider || 'anthropic',
      ''
    );

    const providerName = resolvedLLM.provider;
    const model = resolvedLLM.model;
    const userApiKey = resolvedLLM.apiKey;

    const hasLLMConfigured = !!(providerName && model && userApiKey);

    // Fetch top 5 most recently updated public repositories
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CareerForge-PoW-Engine'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'GitHub user not found' }, { status: 404 });
      }
      throw new Error('Failed to fetch from GitHub API');
    }

    const repos = await response.json();

    // Map and fetch READMEs for parallel AI auditing
    const auditPromises = repos.map(async (repo: any) => {
      let readmeText = '';
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CareerForge-PoW-Engine'
          }
        });
        if (readmeRes.ok) {
          const readmeData = await readmeRes.json();
          if (readmeData.content && readmeData.encoding === 'base64') {
            const decoded = Buffer.from(readmeData.content, 'base64').toString('utf8');
            readmeText = decoded.substring(0, 4000); // Grab a sensible chunk of the README
          }
        }
      } catch (e) {
        console.warn(`Could not fetch README for ${repo.name}:`, e);
      }

      let aiSummary = repo.description || 'No description provided.';
      let aiSkills: string[] = repo.language ? [repo.language] : [];
      let aiArchitecture = 'Standard repository layout.';
      let aiComplexity = 'Simple';

      if (hasLLMConfigured && readmeText.trim().length > 50) {
        try {
          const provider = getProvider(providerName);
          const auditPrompt = `
You are the CareerForge AI Technical Auditor.
Analyze the following public GitHub repository details and its README.md content to generate an expert summary.

Repository Name: ${repo.name}
Primary Language: ${repo.language || 'Unknown'}
Description: ${repo.description || 'No description.'}

--- README.md ---
${readmeText}
-----------------

Analyze this repository and output ONLY a valid JSON object matching this exact structure:
{
  "aiSummary": "A concise, professional 2-sentence summary of the project's purpose and goals.",
  "aiSkills": ["React", "TypeScript", "Node.js"], // List up to 6 core technologies, frameworks, or libraries used
  "aiArchitecture": "Brief 1-sentence description of the project structure or codebase architecture (e.g. Next.js App Router, MVC with Express, etc.).",
  "aiComplexity": "Simple" // Choose one: "Simple", "Moderate", "Advanced" based on files, layout, and description
}
`;

          const rawResponse = await provider.callAPI(auditPrompt, userApiKey || '', model);
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
          const parsed = JSON.parse(jsonString);

          if (parsed.aiSummary) aiSummary = parsed.aiSummary;
          if (Array.isArray(parsed.aiSkills) && parsed.aiSkills.length > 0) aiSkills = parsed.aiSkills;
          if (parsed.aiArchitecture) aiArchitecture = parsed.aiArchitecture;
          if (parsed.aiComplexity) aiComplexity = parsed.aiComplexity;
        } catch (auditError) {
          console.warn(`LLM Audit failed for ${repo.name}, falling back to repository metadata:`, auditError);
        }
      }

      return {
        id: `github-${repo.id}`,
        type: 'github_repo',
        title: repo.name,
        description: repo.description || 'No description provided.',
        url: repo.html_url,
        verifiedAt: new Date().toISOString(),
        metrics: {
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updated_at: repo.updated_at,
          aiSummary,
          aiSkills,
          aiArchitecture,
          aiComplexity
        }
      };
    });

    const proofOfWork = await Promise.all(auditPromises);

    return NextResponse.json({ proofOfWork });
  } catch (error: any) {
    console.error('GitHub Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while fetching GitHub data' },
      { status: 500 }
    );
  }
}
