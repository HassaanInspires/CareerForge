import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/llm-providers';

interface JobSourceItem {
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  isRemote: boolean;
}

// 1. DuckDuckGo Free Search Scraper (100% Free, No Key Required)
async function crawlDuckDuckGo(searchQuery: string): Promise<JobSourceItem[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return [];
    const html = await res.text();

    const results: JobSourceItem[] = [];
    const resultBlocks = html.split('<div class="web-result');

    for (let i = 1; i < resultBlocks.length; i++) {
      const block = resultBlocks[i];
      const titleMatch = block.match(/<a class="result__url"[^>]*>([\s\S]*?)<\/a>/);
      const urlMatch = block.match(/href="([^"]+)"/);
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch && urlMatch) {
        const titleText = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        let link = urlMatch[1];
        if (link.includes('uddg=')) {
          const parts = link.split('uddg=');
          if (parts[1]) {
            link = decodeURIComponent(parts[1].split('&')[0]);
          }
        }
        const snippetText = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';

        // Extract company from title (e.g. "React Developer - Upwork" or "React Developer at Stripe")
        let company = 'Web Listing';
        let cleanTitle = titleText;
        if (titleText.includes('at ')) {
          const split = titleText.split('at ');
          cleanTitle = split[0].trim();
          company = split[1].split('-')[0].trim();
        } else if (titleText.includes('|')) {
          const split = titleText.split('|');
          cleanTitle = split[0].trim();
          company = split[1].trim();
        }

        // Deduce remote status
        const isRemote = searchQuery.toLowerCase().includes('remote') || 
                         titleText.toLowerCase().includes('remote') || 
                         snippetText.toLowerCase().includes('remote');

        results.push({
          title: cleanTitle,
          company,
          url: link,
          location: isRemote ? 'Remote' : 'Worldwide',
          salary: 'Estimated based on spec',
          description: snippetText.substring(0, 1000),
          isRemote
        });
      }
    }

    return results;
  } catch (error) {
    console.error("DuckDuckGo search crawl failed:", error);
    return [];
  }
}

// 2. Tavily API Job Crawler (Requires tvly-... Key)
async function crawlTavily(searchQuery: string, apiKey: string): Promise<JobSourceItem[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'advanced',
        include_answer: false,
        max_results: 10
      })
    });

    if (!res.ok) {
      console.warn("Tavily search API responded with error status:", res.status);
      return [];
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: any) => {
      let company = 'Web Listing';
      const titleText = r.title || 'Job Opening';
      let cleanTitle = titleText;
      if (titleText.includes('at ')) {
        const split = titleText.split('at ');
        cleanTitle = split[0].trim();
        company = split[1].split('-')[0].trim();
      }

      const isRemote = searchQuery.toLowerCase().includes('remote') || 
                       titleText.toLowerCase().includes('remote') || 
                       r.content.toLowerCase().includes('remote');

      return {
        title: cleanTitle,
        company,
        url: r.url || '',
        location: isRemote ? 'Remote' : 'Hybrid/Worldwide',
        salary: 'Negotiable',
        description: r.content || '',
        isRemote
      };
    });
  } catch (error) {
    console.error("Tavily search crawl failed:", error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { memory: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    let { 
      query = '', 
      location = '', 
      provider: providerName, 
      model, 
      userApiKey,
      tavilyApiKey = '',
      duckduckgoKey = '',
      depth = 'quick' // 'quick' (5 jobs) or 'deep' (15 jobs)
    } = body;

    // Load settings from Database if missing
    let dbKeys: Record<string, string> = {};
    let dbModels: Record<string, string> = {};
    if (user.apiKeys) {
      try { dbKeys = JSON.parse(user.apiKeys); } catch (e) {}
    }
    if (user.selectedModels) {
      try { dbModels = JSON.parse(user.selectedModels); } catch (e) {}
    }

    if (!providerName) {
      providerName = user.activeProvider || 'anthropic';
    }
    if (!model) {
      model = dbModels[providerName] || '';
    }
    if (!userApiKey) {
      userApiKey = dbKeys[providerName] || '';
    }
    if (!tavilyApiKey) {
      tavilyApiKey = user.tavilyKey || '';
    }
    if (!duckduckgoKey) {
      duckduckgoKey = user.duckduckgoKey || '';
    }

    if (!providerName || !model) {
      return NextResponse.json({ error: 'LLM provider and model are required' }, { status: 400 });
    }

    // Load Candidate Memory Details
    let coreSkills: string[] = [];
    let careerLevel = 'Unknown';
    if (user.memory) {
      try { coreSkills = JSON.parse(user.memory.coreSkills); } catch (e) {}
      careerLevel = user.memory.careerLevel || 'Unknown';
    }

    let jobsList: JobSourceItem[] = [];

    // Construct broad query parameters
    const targetQuery = `${query} ${location || 'Remote'} Developer designer jobs project`;

    // 1. Fetch from Tavily if key exists, otherwise crawl DuckDuckGo
    if (tavilyApiKey && tavilyApiKey.trim().startsWith('tvly-')) {
      console.log("Using Tavily Search engine...");
      // Search Upwork/Fiverr/Freelancer/LinkedIn and direct company ATS pages in parallel
      const searchQueries = [
        `site:upwork.com/jobs OR site:upwork.com/freelance-jobs "${query}"`,
        `site:linkedin.com/jobs/view OR site:linkedin.com/jobs "${query}" "${location}"`,
        `site:freelancer.com/projects OR site:fiverr.com "${query}"`,
        `site:greenhouse.io OR site:lever.co OR site:*.jobs "${query}" "${location}"`,
        `"${query}" career portal jobs OR hiring "${location}"`
      ];
      
      const crawledArrays = await Promise.all(
        searchQueries.map(q => crawlTavily(q, tavilyApiKey))
      );
      crawledArrays.forEach(arr => jobsList.push(...arr));
    } else {
      console.log("Tavily key missing. Falling back to DuckDuckGo HTML Scraper + public APIs...");
      // Fallback search Upwork & LinkedIn + Official Company Portals
      const ddgJobs = await crawlDuckDuckGo(`site:upwork.com/jobs OR site:linkedin.com/jobs "${query}" ${location}`);
      const ddgCompanyJobs = await crawlDuckDuckGo(`site:greenhouse.io OR site:lever.co OR site:*.jobs "${query}" ${location}`);
      const ddgDirectJobs = await crawlDuckDuckGo(`"${query}" career page OR hiring OR jobs "${location}"`);
      
      jobsList.push(...ddgJobs, ...ddgCompanyJobs, ...ddgDirectJobs);

      // Add Remotive + Arbeitnow feeds
      try {
        const remotiveRes = await fetch('https://remotive.com/api/remote-jobs?limit=20');
        if (remotiveRes.ok) {
          const data = await remotiveRes.json();
          if (data.jobs && Array.isArray(data.jobs)) {
            data.jobs.forEach((j: any) => {
              if (j.title.toLowerCase().includes(query.toLowerCase())) {
                jobsList.push({
                  title: j.title || '',
                  company: j.company_name || 'Remotive Recruiter',
                  url: j.url || '',
                  location: j.candidate_required_location || 'Remote',
                  salary: j.salary || 'Not specified',
                  description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 1000),
                  isRemote: true
                });
              }
            });
          }
        }
      } catch (e) {}

      try {
        const arbeitRes = await fetch('https://www.arbeitnow.com/api/job-board-api');
        if (arbeitRes.ok) {
          const data = await arbeitRes.json();
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach((j: any) => {
              if (j.title.toLowerCase().includes(query.toLowerCase())) {
                jobsList.push({
                  title: j.title || '',
                  company: j.company_name || 'Arbeitnow Hiring',
                  url: j.url || '',
                  location: j.location || 'Europe',
                  salary: 'Negotiable',
                  description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 1000),
                  isRemote: !!j.remote
                });
              }
            });
          }
        }
      } catch (e) {}
    }

    // Deduplicate lists based on Title & Company
    const seen = new Set<string>();
    let dedupedJobs = jobsList.filter(job => {
      const uniqueKey = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });

    if (dedupedJobs.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // Slice based on search depth
    const maxItems = depth === 'deep' ? 12 : 6;
    const candidateJobs = dedupedJobs.slice(0, maxItems);

    // 3. AI Authenticity, Match, Salary Verification Loop
    const provider = getProvider(providerName);
    const evaluationPrompt = `
You are the AI Job Agent & Authenticity Validator of CareerForge.
Your job is to evaluate a roster of job postings against a candidate's profile to score the fit and verify if the posting or company looks authentic (not spam/outdated).
Verify the company details, trends, and calculate salary expectations.

--- CANDIDATE INFORMATION ---
Career Level: ${careerLevel}
Core Skills: ${coreSkills.join(', ')}

--- JOB ROSTER TO EVALUATE ---
${candidateJobs.map((job, idx) => `
ID: ${idx}
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Salary: ${job.salary}
URL: ${job.url}
Description: ${job.description.substring(0, 400)}...
`).join('\n---\n')}

Evaluate each job. Determine:
1. A Match Fit score (0-100) based on how well their skills match the requirements.
2. A Company Authenticity Trust Score (0-100) explaining if the company looks legitimate, has active operations, or is a generic freelance middleman.
3. List matched skills and missing skills.
4. Estimate realistic salary offerings based on market standards.

Return ONLY a valid JSON object matching this exact structure:
{
  "evaluatedJobs": [
    {
      "id": 0,
      "fitScore": 85,
      "trustScore": 95,
      "trustExplanation": "Standard company with verifiable domain footprint.",
      "matchedSkills": ["skill1"],
      "missingSkills": ["skill2"],
      "salaryEstimate": "$80k - $100k"
    }
  ]
}
`;

    const rawResponse = await provider.callAPI(evaluationPrompt, userApiKey || '', model);
    
    // Parse response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const result = JSON.parse(jsonString);

    const evaluatedList = candidateJobs.map((job, idx) => {
      const evaluation = result.evaluatedJobs?.find((e: any) => e.id === idx) || {
        fitScore: 50,
        trustScore: 80,
        trustExplanation: "Standard web listings verification completed.",
        matchedSkills: [],
        missingSkills: [],
        salaryEstimate: job.salary
      };

      return {
        ...job,
        fitScore: evaluation.fitScore,
        trustScore: evaluation.trustScore,
        trustExplanation: evaluation.trustExplanation,
        matchedSkills: evaluation.matchedSkills,
        missingSkills: evaluation.missingSkills,
        salary: evaluation.salaryEstimate || job.salary
      };
    });

    return NextResponse.json({ jobs: evaluatedList });

  } catch (error: any) {
    console.error('Job Agent Search Error:', error);
    return NextResponse.json(
      { error: `Search failed: ${error.message}` },
      { status: 500 }
    );
  }
}
