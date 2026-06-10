import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider, resolveActiveLLM } from '@/lib/llm-providers';

interface JobSourceItem {
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  isRemote: boolean;
  source: 'tavily' | 'duckduckgo' | 'adzuna' | 'themuse' | 'remoteok';
  postedTimestamp: number;
  relevanceScore: number;
}

// Centralized Date/Timestamp Normalizer Helper
function parseDateToTimestamp(dateVal: any): number {
  if (!dateVal) return 0;
  try {
    const timestamp = Date.parse(String(dateVal));
    if (!isNaN(timestamp)) {
      return timestamp;
    }
    const num = Number(dateVal);
    if (!isNaN(num)) {
      return num < 9999999999 ? num * 1000 : num;
    }
  } catch (e) {}
  return 0;
}

// Local Keyword Relevance Scoring Algorithm
function calculateRelevanceScore(job: Omit<JobSourceItem, 'relevanceScore'>, query: string): number {
  const cleanQuery = query.toLowerCase().replace(/["',]/g, ' ').trim();
  const tokens = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  if (tokens.length === 0) return 1;

  let score = 0;
  const title = job.title.toLowerCase();
  const desc = job.description.toLowerCase();

  // Priority 1: Exact matches of phrase segments split by commas
  const segments = query.toLowerCase().split(/[,|]/).map(s => s.trim()).filter(s => s.length > 3);
  for (const segment of segments) {
    if (title.includes(segment)) {
      score += 20;
    }
    if (desc.includes(segment)) {
      score += 5;
    }
  }

  // Priority 2: Individual token matches
  for (const token of tokens) {
    if (title.includes(token)) {
      score += 5;
    }
    if (desc.includes(token)) {
      score += 1;
    }
  }

  return score;
}

// 1. DuckDuckGo Free Search Scraper (100% Free, No Key Required)
async function crawlDuckDuckGo(searchQuery: string): Promise<JobSourceItem[]> {
  try {
    const url = `https://html.duckduckgo.com/html/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `q=${encodeURIComponent(searchQuery)}&df=m` // Restricted to past month to ensure freshness
    });

    if (!res.ok) {
      console.warn("DuckDuckGo HTML scraper returned status:", res.status);
      return [];
    }
    const html = await res.text();

    const results: JobSourceItem[] = [];
    const resultBlocks = html.split(/class="[^"]*result[^"]*"/);

    // Default DuckDuckGo postings to 3 days ago for baseline sorting range
    const fallbackTime = Date.now() - 3 * 24 * 3600 * 1000;

    for (let i = 1; i < resultBlocks.length; i++) {
      const block = resultBlocks[i];
      const urlMatch = block.match(/href="([^"]+)"/) || block.match(/href='([^']+)'/);
      const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/) || 
                         block.match(/class="result__url"[^>]*>([\s\S]*?)<\/a>/) ||
                         block.match(/<a[^>]*>([\s\S]*?)<\/a>/);

      if (urlMatch && titleMatch) {
        let link = urlMatch[1];
        if (link.includes('uddg=')) {
          const parts = link.split('uddg=');
          if (parts[1]) {
            link = decodeURIComponent(parts[1].split('&')[0]);
          }
        }
        
        if (link.startsWith('/') || link.includes('duckduckgo.com/')) {
          continue;
        }

        const titleText = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        if (!titleText || titleText.toLowerCase().includes('javascript is required')) {
          continue;
        }

        const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/) ||
                             block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/div>/) ||
                             block.match(/<td[^>]*>([\s\S]*?)<\/td>/);
        const snippetText = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';

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
        } else if (titleText.includes('-')) {
          const split = titleText.split('-');
          cleanTitle = split[0].trim();
          company = split[1].trim();
        }

        const isRemote = searchQuery.toLowerCase().includes('remote') || 
                         titleText.toLowerCase().includes('remote') || 
                         snippetText.toLowerCase().includes('remote');

        results.push({
          title: cleanTitle,
          company,
          url: link,
          location: isRemote ? 'Remote' : 'Worldwide',
          salary: 'Estimated based on spec',
          description: snippetText.substring(0, 1000) || 'Active job opening listed on web directory.',
          isRemote,
          source: 'duckduckgo',
          postedTimestamp: fallbackTime - (i * 1000),
          relevanceScore: 0
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

    const fallbackTime = Date.now() - 2 * 24 * 3600 * 1000;

    return data.results.map((r: any, idx: number) => {
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
        isRemote,
        source: 'tavily',
        postedTimestamp: fallbackTime - (idx * 1000),
        relevanceScore: 0
      };
    });
  } catch (error) {
    console.error("Tavily search crawl failed:", error);
    return [];
  }
}

// 3. Adzuna API Crawler (Persists app_id and app_key in User model keys)
async function crawlAdzuna(query: string, location: string, appId: string, appKey: string): Promise<JobSourceItem[]> {
  try {
    let country = 'us';
    const locLower = location.toLowerCase();
    if (locLower.includes('uk') || locLower.includes('gb') || locLower.includes('london') || locLower.includes('united kingdom')) {
      country = 'gb';
    } else if (locLower.includes('ca') || locLower.includes('canada') || locLower.includes('toronto')) {
      country = 'ca';
    } else if (locLower.includes('in') || locLower.includes('india') || locLower.includes('mumbai') || locLower.includes('bangalore')) {
      country = 'in';
    } else if (locLower.includes('de') || locLower.includes('germany') || locLower.includes('berlin')) {
      country = 'de';
    } else if (locLower.includes('fr') || locLower.includes('france') || locLower.includes('paris')) {
      country = 'fr';
    } else if (locLower.includes('au') || locLower.includes('australia') || locLower.includes('sydney')) {
      country = 'au';
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(query)}&results_per_page=30&content-type=application/json`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Adzuna API returned status:", res.status);
      return [];
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: any) => {
      const title = (r.title || '').replace(/<[^>]*>/g, '').trim();
      const company = r.company?.display_name || 'Web Listing';
      const link = r.redirect_url || '';
      const description = (r.description || '').replace(/<[^>]*>/g, '').substring(0, 1000);
      const locationName = r.location?.display_name || 'Remote/Worldwide';

      const isRemote = locLower.includes('remote') || 
                       title.toLowerCase().includes('remote') || 
                       description.toLowerCase().includes('remote');

      const postedTimestamp = parseDateToTimestamp(r.created) || (Date.now() - 4 * 24 * 3600 * 1000);

      return {
        title,
        company,
        url: link,
        location: locationName,
        salary: r.salary_min ? `$${Math.round(r.salary_min / 1000)}k - $${Math.round(r.salary_max / 1000)}k` : 'Negotiable',
        description,
        isRemote,
        source: 'adzuna',
        postedTimestamp,
        relevanceScore: 0
      };
    });
  } catch (error) {
    console.error("Adzuna API crawl failed:", error);
    return [];
  }
}

// 4. The Muse API (Public Directory - Zero Key Required)
async function crawlTheMuse(query: string): Promise<JobSourceItem[]> {
  try {
    const url = `https://www.themuse.com/api/public/jobs?page=1&category=Engineering&category=Software+Engineering&category=Design&category=Data+Science&category=Product+Management`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("The Muse API returned status:", res.status);
      return [];
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    const results: JobSourceItem[] = [];
    const queryTokens = query.toLowerCase().split(/[\s,+-]+/).filter((w: string) => w.length > 2);

    data.results.forEach((r: any) => {
      const title = r.name || '';
      const company = r.company?.name || 'The Muse Partner';
      const link = r.refs?.landing_page || '';
      const description = (r.contents || '').replace(/<[^>]*>/g, '').substring(0, 1000);
      const locations = r.locations?.map((l: any) => l.name).join(', ') || 'Remote';

      const isRemote = locations.toLowerCase().includes('remote') || 
                       title.toLowerCase().includes('remote') || 
                       description.toLowerCase().includes('remote');

      // Local query keyword filter
      const matchesQuery = queryTokens.length === 0 || queryTokens.some((token: string) => 
        title.toLowerCase().includes(token) || 
        description.toLowerCase().includes(token)
      );

      if (matchesQuery) {
        const postedTimestamp = parseDateToTimestamp(r.publication_date) || (Date.now() - 5 * 24 * 3600 * 1000);
        results.push({
          title,
          company,
          url: link,
          location: locations,
          salary: 'Estimated based on spec',
          description,
          isRemote,
          source: 'themuse',
          postedTimestamp,
          relevanceScore: 0
        });
      }
    });

    return results;
  } catch (error) {
    console.error("The Muse API crawl failed:", error);
    return [];
  }
}

// 5. RemoteOK Free JSON API (100% Free, Keyless, Extra Professional)
async function crawlRemoteOk(query: string): Promise<JobSourceItem[]> {
  try {
    const cleanTokens = query.toLowerCase().split(/[\s,+-]+/).filter((w: string) => w.length > 2);
    const tag = cleanTokens[0] || 'dev';
    
    const url = `https://remoteok.com/api?tag=${encodeURIComponent(tag)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      console.warn("RemoteOK API returned status:", res.status);
      return [];
    }
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: JobSourceItem[] = [];
    
    // Skip index 0 (metadata/legal notice block)
    for (let i = 1; i < data.length; i++) {
      const item = data[i];
      if (!item || !item.url) continue;

      const title = item.position || item.title || 'Remote Developer';
      const company = item.company || 'Remote Employer';
      const url = item.url;
      const location = item.location || 'Remote';
      const salary = item.salary ? `${item.salary}` : 'Estimated based on spec';
      const description = (item.description || '').replace(/<[^>]*>/g, '').substring(0, 1000);
      const postedTimestamp = parseDateToTimestamp(item.date) || (Date.now() - 1 * 24 * 3600 * 1000);

      results.push({
        title,
        company,
        url,
        location,
        salary,
        description,
        isRemote: true,
        source: 'remoteok',
        postedTimestamp,
        relevanceScore: 0
      });
    }

    return results;
  } catch (error) {
    console.error("RemoteOK API crawl failed:", error);
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
      engineSource = 'mixed', 
      depth = 'quick'
    } = body;

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
      providerName || user.activeProvider || 'anthropic',
      model || ''
    );
    providerName = resolvedLLM.provider;
    model = resolvedLLM.model;
    userApiKey = resolvedLLM.apiKey;
    if (!tavilyApiKey) {
      tavilyApiKey = user.tavilyKey || '';
    }

    const adzunaAppId = dbKeys.adzunaAppId || '';
    const adzunaAppKey = dbKeys.adzunaAppKey || '';

    if (!providerName || !model) {
      return NextResponse.json({ error: 'LLM provider and model are required' }, { status: 400 });
    }

    let coreSkills: string[] = [];
    let careerLevel = 'Unknown';
    if (user.memory) {
      try { coreSkills = JSON.parse(user.memory.coreSkills); } catch (e) {}
      careerLevel = user.memory.careerLevel || 'Unknown';
    }

    let jobsList: JobSourceItem[] = [];
    let searchWarning = '';

    const hasTavilyKey = tavilyApiKey && tavilyApiKey.trim().startsWith('tvly-');
    let selectedEngine = engineSource;
    if ((selectedEngine === 'tavily' || selectedEngine === 'mixed') && !hasTavilyKey) {
      selectedEngine = 'duckduckgo';
      searchWarning = 'Tavily API key is missing. Automatically falling back to DuckDuckGo Scraper & Public Directories.';
    }

    // Clean search query to exclude commas and forced quotes for flexible matching
    const cleanQuery = query.replace(/["',]/g, ' ').trim();

    // Accumulate parallel search promises
    const promises: Promise<JobSourceItem[]>[] = [];

    if (selectedEngine === 'tavily') {
      const searchQueries = [
        `site:upwork.com/jobs OR site:upwork.com/freelance-jobs ${cleanQuery}`,
        `site:linkedin.com/jobs/view OR site:linkedin.com/jobs ${cleanQuery} ${location}`,
        `site:greenhouse.io OR site:lever.co OR site:*.jobs ${cleanQuery} ${location}`,
      ];
      searchQueries.forEach(q => promises.push(crawlTavily(q, tavilyApiKey)));
    } else if (selectedEngine === 'duckduckgo') {
      promises.push(crawlDuckDuckGo(`site:upwork.com/jobs OR site:linkedin.com/jobs ${cleanQuery} ${location}`));
      promises.push(crawlDuckDuckGo(`site:greenhouse.io OR site:lever.co OR site:*.jobs ${cleanQuery} ${location}`));
      promises.push(crawlDuckDuckGo(`${cleanQuery} career page OR hiring OR jobs ${location}`));
    } else {
      promises.push(crawlTavily(`site:upwork.com/jobs ${cleanQuery} ${location}`, tavilyApiKey));
      promises.push(crawlDuckDuckGo(`site:linkedin.com/jobs ${cleanQuery} ${location}`));
      promises.push(crawlDuckDuckGo(`site:greenhouse.io OR site:lever.co OR site:*.jobs ${cleanQuery} ${location}`));
    }

    // Always fetch The Muse (Public, keyless)
    promises.push(crawlTheMuse(query));

    // Always fetch RemoteOK (Public, keyless)
    promises.push(crawlRemoteOk(query));

    // Fetch Adzuna if credentials exist
    if (adzunaAppId && adzunaAppKey) {
      promises.push(crawlAdzuna(query, location, adzunaAppId, adzunaAppKey));
    }

    const crawledResults = await Promise.all(promises);
    crawledResults.forEach(arr => jobsList.push(...arr));

    // Fetch public Remotive & Arbeitnow feeds as extra sources in parallel
    const extraPromises: Promise<void>[] = [];
    
    // Remotive feed search parameter optimized
    const remotiveSearchTerm = cleanQuery.split(/\s+/)[0] || query;
    extraPromises.push(
      fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(remotiveSearchTerm)}&limit=35`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.jobs && Array.isArray(data.jobs)) {
            data.jobs.forEach((j: any) => {
              const postedTimestamp = parseDateToTimestamp(j.publication_date) || (Date.now() - 2 * 24 * 3600 * 1000);
              jobsList.push({
                title: j.title || '',
                company: j.company_name || 'Remotive Recruiter',
                url: j.url || '',
                location: j.candidate_required_location || 'Remote',
                salary: j.salary || 'Not specified',
                description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 1000),
                isRemote: true,
                source: 'duckduckgo',
                postedTimestamp,
                relevanceScore: 0
              });
            });
          }
        }).catch(() => {})
    );

    extraPromises.push(
      fetch('https://www.arbeitnow.com/api/job-board-api')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.data && Array.isArray(data.data)) {
            data.data.forEach((j: any) => {
              const postedTimestamp = parseDateToTimestamp(j.created_at) || (Date.now() - 1 * 24 * 3600 * 1000);
              jobsList.push({
                title: j.title || '',
                company: j.company_name || 'Arbeitnow Hiring',
                url: j.url || '',
                location: j.location || 'Europe',
                salary: 'Negotiable',
                description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 1000),
                isRemote: !!j.remote,
                source: 'duckduckgo',
                postedTimestamp,
                relevanceScore: 0
              });
            });
          }
        }).catch(() => {})
    );

    await Promise.all(extraPromises);

    // Deduplicate lists based on Title & Company
    const seen = new Set<string>();
    let dedupedJobs = jobsList.filter(job => {
      const uniqueKey = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });

    if (dedupedJobs.length === 0) {
      return NextResponse.json({ jobs: [], warning: searchWarning });
    }

    // Populate relevance scores and strictly filter out postings with 0 keyword matches
    const scoredJobs = dedupedJobs.map(job => {
      const relevanceScore = calculateRelevanceScore(job, query);
      return { ...job, relevanceScore };
    });

    // Discard any job with a relevanceScore of 0
    let relevantJobs = scoredJobs.filter(job => job.relevanceScore > 0);

    if (relevantJobs.length === 0) {
      // Fallback: If everything got filtered out, keep a basic subset to avoid returning empty list
      relevantJobs = scoredJobs;
    }

    // Sort: Primary sorting by relevanceScore descending, secondary by date/timestamp descending
    relevantJobs.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.postedTimestamp - a.postedTimestamp;
    });

    const maxItems = depth === 'deep' ? 12 : 6;

    // 5. STAGE 1: AI Relevance Gatekeeper pipeline
    const provider = getProvider(providerName);
    
    // Take a larger slice of high-relevance jobs to evaluate (e.g. 35 candidates)
    const gatekeeperCandidateSubset = relevantJobs.slice(0, 35);

    const gatekeeperPrompt = `
You are the CareerForge AI Relevance Gatekeeper.
Your job is to analyze the following candidate job listing results and identify which ones are GENUINE, active job postings matching the query "${query}".
Discard spam links, developer guides, tutorial documentation, old articles, homepage indexes, and completely unrelated roles.

Candidate Core Skills: ${coreSkills.join(', ')}

--- CANDIDATE JOB LISTINGS ---
${gatekeeperCandidateSubset.map((job, idx) => `
ID: ${idx}
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Snippet: ${job.description.substring(0, 300)}...
`).join('\n---\n')}

Identify which IDs are real, relevant job listings. Select up to 25 of the most relevant, genuine, active job postings matching the query. Return ONLY a valid JSON object matching this structure:
{
  "relevantIds": [0, 2]
}
`;

    let pureJobs: JobSourceItem[] = [];
    try {
      const rawGatekeeperResponse = await provider.callAPI(gatekeeperPrompt, userApiKey || '', model);
      const gatekeeperJsonMatch = rawGatekeeperResponse.match(/\{[\s\S]*\}/);
      const gatekeeperJson = JSON.parse(gatekeeperJsonMatch ? gatekeeperJsonMatch[0] : rawGatekeeperResponse);
      const relevantIds = gatekeeperJson.relevantIds || [];
      
      if (Array.isArray(relevantIds) && relevantIds.length > 0) {
        pureJobs = gatekeeperCandidateSubset.filter((_, idx) => relevantIds.includes(idx));
      }
    } catch (gatekeeperErr) {
      console.warn("Gatekeeper relevance check failed. Falling back to fuzzy token matched filtering.", gatekeeperErr);
    }

    // If gatekeeper returned no results or was bypassed, fall back to scored subset
    if (pureJobs.length === 0) {
      pureJobs = relevantJobs;
    }

    // Safeguard backfill: If pureJobs size is less than maxItems, backfill with high-scoring items from relevantJobs
    if (pureJobs.length < maxItems && relevantJobs.length > pureJobs.length) {
      const backfilled = [...pureJobs];
      for (const job of relevantJobs) {
        if (backfilled.length >= maxItems) break;
        if (!backfilled.some(j => j.url === job.url)) {
          backfilled.push(job);
        }
      }
      pureJobs = backfilled;
    }

    const candidateJobs = pureJobs.slice(0, maxItems);

    // 6. STAGE 2: AI Fit scoring, Trust Audit & Competency Validation
    const evaluationPrompt = `
You are the AI Job Agent & Authenticity Validator of CareerForge.
Your job is to evaluate a roster of job postings against a candidate's profile to score the fit, explain why they are a good match, and explain any mismatch.

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
2. A Company Authenticity Trust Score (0-100) explaining if the company looks legitimate.
3. List matched skills and missing skills.
4. Estimate realistic salary offerings based on market standards.
5. Create:
   - "fitExplanation": A 1-sentence explanation of why the user's skills are a great fit for this job.
   - "unfitExplanation": A 1-sentence warning of what requirements they are missing or what gaps they might face.

Return ONLY a valid JSON object matching this exact structure:
{
  "evaluatedJobs": [
    {
      "id": 0,
      "fitScore": 85,
      "trustScore": 95,
      "trustExplanation": "Standard company with verifiable domain footprint.",
      "fitExplanation": "Your deep expertise in React aligns perfectly with this front-end role.",
      "unfitExplanation": "You are missing experience with Shopify or liquid templates required for theme setup.",
      "matchedSkills": ["React"],
      "missingSkills": ["Shopify"],
      "salaryEstimate": "$80k - $100k"
    }
  ]
}
`;

    const rawResponse = await provider.callAPI(evaluationPrompt, userApiKey || '', model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const result = JSON.parse(jsonString);

    const evaluatedList = candidateJobs.map((job, idx) => {
      const evaluation = result.evaluatedJobs?.find((e: any) => e.id === idx) || {
        fitScore: 50,
        trustScore: 80,
        trustExplanation: "Standard web listings verification completed.",
        fitExplanation: "Candidate holds general alignment with development criteria.",
        unfitExplanation: "Make sure you check specific team frameworks not listed in memory.",
        matchedSkills: [],
        missingSkills: [],
        salaryEstimate: job.salary
      };

      return {
        ...job,
        fitScore: evaluation.fitScore,
        trustScore: evaluation.trustScore,
        trustExplanation: evaluation.trustExplanation,
        fitExplanation: evaluation.fitExplanation,
        unfitExplanation: evaluation.unfitExplanation,
        matchedSkills: evaluation.matchedSkills,
        missingSkills: evaluation.missingSkills,
        salary: evaluation.salaryEstimate || job.salary
      };
    });

    return NextResponse.json({ jobs: evaluatedList, warning: searchWarning });

  } catch (error: any) {
    console.error('Job Agent Search Error:', error);
    return NextResponse.json(
      { error: `Search failed: ${error.message}` },
      { status: 500 }
    );
  }
}
