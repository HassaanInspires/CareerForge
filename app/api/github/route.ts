import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 });
    }

    // Fetch top 10 most recently updated public repositories
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
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

    // Transform to ProofOfWorkItem structure
    const proofOfWork = repos.map((repo: any) => ({
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
        updated_at: repo.updated_at
      }
    }));

    return NextResponse.json({ proofOfWork });
  } catch (error: any) {
    console.error('GitHub Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while fetching GitHub data' },
      { status: 500 }
    );
  }
}
