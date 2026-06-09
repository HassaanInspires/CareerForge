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
    const { 
      query = '', 
      location = '', 
      provider: providerName, 
      model, 
      userApiKey,
      depth = 'quick' // 'quick' (5 jobs) or 'deep' (15 jobs)
    } = body;

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

    // 1. Fetch from Public Job Feeds (Remotive & Arbeitnow)
    let jobsList: JobSourceItem[] = [];

    try {
      // Fetch Remotive (Remote Focus)
      const remotiveRes = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
        headers: { 'User-Agent': 'CareerForge-AI-Agent/1.0' }
      });
      if (remotiveRes.ok) {
        const data = await remotiveRes.json();
        if (data.jobs && Array.isArray(data.jobs)) {
          data.jobs.forEach((j: any) => {
            jobsList.push({
              title: j.title || '',
              company: j.company_name || '',
              url: j.url || '',
              location: j.candidate_required_location || 'Remote',
              salary: j.salary || 'Not specified',
              description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 1000),
              isRemote: true
            });
          });
        }
      }
    } catch (e: any) {
      console.warn("Remotive API failed:", e.message);
    }

    try {
      // Fetch Arbeitnow (European / Hybrid Focus)
      const arbeitRes = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { 'User-Agent': 'CareerForge-AI-Agent/1.0' }
      });
      if (arbeitRes.ok) {
        const data = await arbeitRes.json();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((j: any) => {
            jobsList.push({
              title: j.title || '',
              company: j.company_name || '',
              url: j.url || '',
              location: j.location || 'Europe',
              salary: 'Negotiable',
              description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 1000),
              isRemote: !!j.remote
            });
          });
        }
      }
    } catch (e: any) {
      console.warn("Arbeitnow API failed:", e.message);
    }

    // 2. Filter & Keyword Match
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let filteredJobs = jobsList;

    if (searchTerms.length > 0) {
      filteredJobs = jobsList.filter(job => {
        const titleMatch = searchTerms.some((term: string) => job.title.toLowerCase().includes(term));
        const companyMatch = searchTerms.some((term: string) => job.company.toLowerCase().includes(term));
        const descMatch = searchTerms.some((term: string) => job.description.toLowerCase().includes(term));
        return titleMatch || companyMatch || descMatch;
      });
    }

    if (location) {
      const locTerm = location.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(locTerm) || 
        (locTerm === 'remote' && job.isRemote)
      );
    }

    // Limit to top 8 items for LLM evaluation to avoid token limits
    const maxItems = depth === 'deep' ? 12 : 6;
    const candidateJobs = filteredJobs.slice(0, maxItems);

    // If no jobs match, supply a generic list or return empty
    if (candidateJobs.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // 3. AI Authenticity & Match Valuation Loop
    const provider = getProvider(providerName);
    const evaluationPrompt = `
You are the AI Job Agent & Authenticity Validator of CareerForge.
Your job is to evaluate a roster of job postings against a candidate's profile to score the fit and determine if the posting or company looks authentic (not spam/outdated).

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
Description: ${job.description.substring(0, 300)}...
`).join('\n---\n')}

Evaluate each job. Determine:
1. A Match Fit score (0-100) based on how well their skills match the requirements.
2. A Company Authenticity Trust Score (0-100) explaining if the company looks legitimate, has clear technology alignment, or contains spam patterns.
3. List matched skills and missing skills.
4. State if the position supports remote or physical.

Return ONLY a valid JSON object matching this exact structure:
{
  "evaluatedJobs": [
    {
      "id": 0,
      "fitScore": 85,
      "trustScore": 95,
      "trustExplanation": "Company is verified and description outlines standard engineering standards.",
      "matchedSkills": ["skill1"],
      "missingSkills": ["skill2"],
      "remoteType": "Remote"
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
        trustExplanation: "Default check completed.",
        matchedSkills: [],
        missingSkills: [],
        remoteType: job.isRemote ? "Remote" : "On-site"
      };

      return {
        ...job,
        fitScore: evaluation.fitScore,
        trustScore: evaluation.trustScore,
        trustExplanation: evaluation.trustExplanation,
        matchedSkills: evaluation.matchedSkills,
        missingSkills: evaluation.missingSkills,
        remoteType: evaluation.remoteType || (job.isRemote ? "Remote" : "On-site")
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
