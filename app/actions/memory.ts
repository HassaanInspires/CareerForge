'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CandidateMemory, ProofOfWorkItem } from '@/lib/memory';

export async function loadUserMemory(): Promise<CandidateMemory | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memory: true,
      proofOfWork: true
    }
  });

  if (!user || !user.memory) {
    return null;
  }

  const memory = user.memory;
  const pow = user.proofOfWork;

  // Parse JSON strings back to arrays
  let coreSkills = [];
  let verifiableMetrics = [];
  let identifiedGaps = [];
  
  try { coreSkills = JSON.parse(memory.coreSkills); } catch(e) {}
  try { verifiableMetrics = JSON.parse(memory.verifiableMetrics); } catch(e) {}
  try { identifiedGaps = JSON.parse(memory.identifiedGaps || '[]'); } catch(e) {}

  const parsedPoW: ProofOfWorkItem[] = pow.map(p => {
    let metrics = {};
    try { metrics = JSON.parse(p.metrics || '{}'); } catch(e) {}
    
    return {
      id: p.id,
      type: p.type as any,
      title: p.title,
      description: p.description || '',
      url: p.url || '',
      verifiedAt: p.verifiedAt.toISOString(),
      metrics
    };
  });

  return {
    careerLevel: memory.careerLevel || 'Entry Level',
    coreSkills,
    verifiableMetrics,
    careerGoals: memory.careerGoals || '',
    identifiedGaps,
    dataSufficiencyScore: memory.dataSufficiencyScore || 0,
    proofOfWork: parsedPoW,
    verifiedSkills: [],
    resumeFileName: memory.resumeFileName,
    resumeBase64: memory.resumeBase64,
    resumeUploadedAt: memory.resumeUploadedAt ? memory.resumeUploadedAt.toISOString() : null
  };
}

export async function saveUserMemory(memory: CandidateMemory) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memory: true }
  });

  if (!user) throw new Error('User not found');

  // Load existing proof of work items from DB to ensure complete sync
  const dbPow = await prisma.proofOfWork.findMany({
    where: { userId: user.id }
  });

  const allPow = [...(memory.proofOfWork || [])];
  dbPow.forEach(p => {
    if (!allPow.some(x => x.title === p.title)) {
      let metrics = {};
      try { metrics = JSON.parse(p.metrics || '{}'); } catch(e) {}
      allPow.push({
        id: p.id,
        type: p.type as any,
        title: p.title,
        description: p.description || '',
        url: p.url || '',
        verifiedAt: p.verifiedAt.toISOString(),
        metrics
      });
    }
  });

  // Extract skills and metrics from all ProofOfWork items
  const gitSkills: string[] = [];
  const gitMetrics: string[] = [];

  allPow.forEach(pow => {
    if (pow.metrics?.aiSkills && Array.isArray(pow.metrics.aiSkills)) {
      pow.metrics.aiSkills.forEach((s: string) => {
        const cleanSkill = s.trim();
        if (cleanSkill && !gitSkills.includes(cleanSkill)) {
          gitSkills.push(cleanSkill);
        }
      });
    }
    const stars = pow.metrics?.stars || 0;
    const complexity = pow.metrics?.aiComplexity || 'Simple';
    const summary = pow.metrics?.aiSummary || pow.description || '';
    const metricStr = `Verified GitHub Project: ${pow.title} (${complexity} Complexity, ${stars} ⭐). ${summary}`;
    
    // Check if a similar metric statement is already included
    if (!gitMetrics.some(m => m.startsWith(`Verified GitHub Project: ${pow.title}`))) {
      gitMetrics.push(metricStr);
    }
  });

  // Merge with existing coreSkills and verifiableMetrics, keeping them unique
  const mergedSkills = Array.from(new Set([...(memory.coreSkills || []), ...gitSkills]));
  
  // Keep original non-github metrics, and append gitMetrics
  const nonGitMetrics = (memory.verifiableMetrics || []).filter(m => !m.startsWith('Verified GitHub Project:'));
  const mergedMetrics = Array.from(new Set([...nonGitMetrics, ...gitMetrics]));

  // Update memory
  await prisma.candidateMemory.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      careerLevel: memory.careerLevel,
      careerGoals: memory.careerGoals,
      coreSkills: JSON.stringify(mergedSkills),
      verifiableMetrics: JSON.stringify(mergedMetrics),
      identifiedGaps: JSON.stringify(memory.identifiedGaps || []),
      dataSufficiencyScore: memory.dataSufficiencyScore || 0,
      resumeFileName: memory.resumeFileName || null,
      resumeBase64: memory.resumeBase64 || null,
      resumeUploadedAt: memory.resumeUploadedAt ? new Date(memory.resumeUploadedAt) : null
    },
    update: {
      careerLevel: memory.careerLevel,
      careerGoals: memory.careerGoals,
      coreSkills: JSON.stringify(mergedSkills),
      verifiableMetrics: JSON.stringify(mergedMetrics),
      identifiedGaps: JSON.stringify(memory.identifiedGaps || []),
      dataSufficiencyScore: memory.dataSufficiencyScore || 0,
      resumeFileName: memory.resumeFileName !== undefined ? memory.resumeFileName : undefined,
      resumeBase64: memory.resumeBase64 !== undefined ? memory.resumeBase64 : undefined,
      resumeUploadedAt: memory.resumeUploadedAt !== undefined ? (memory.resumeUploadedAt ? new Date(memory.resumeUploadedAt) : null) : undefined
    }
  });

  // Handle ProofOfWork updates
  if (memory.proofOfWork && memory.proofOfWork.length > 0) {
    for (const pow of memory.proofOfWork) {
      // Check if it exists by URL or title to prevent duplicates (naive approach for now)
      const existing = await prisma.proofOfWork.findFirst({
        where: {
          userId: user.id,
          title: pow.title,
          type: pow.type
        }
      });

      if (!existing) {
        await prisma.proofOfWork.create({
          data: {
            userId: user.id,
            type: pow.type,
            title: pow.title,
            description: pow.description,
            url: pow.url,
            metrics: JSON.stringify(pow.metrics || {})
          }
        });
      }
    }
  }

  return { success: true };
}

export async function saveUserResumeFile(fileName: string, base64Data: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error('User not found');

  await prisma.candidateMemory.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      resumeFileName: fileName,
      resumeBase64: base64Data,
      resumeUploadedAt: new Date(),
      careerLevel: 'Entry Level',
      careerGoals: '',
      coreSkills: '[]',
      verifiableMetrics: '[]',
      identifiedGaps: '[]',
      dataSufficiencyScore: 0
    },
    update: {
      resumeFileName: fileName,
      resumeBase64: base64Data,
      resumeUploadedAt: new Date()
    }
  });

  return { success: true };
}

export async function loadUserHistory() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { sessions: { orderBy: { createdAt: 'desc' } } }
  });

  if (!user) return [];

  return user.sessions.map(s => ({
    id: s.id,
    title: s.title,
    summary: s.summary || '',
    score: s.score,
    path: s.path,
    output: s.output,
    timestamp: s.createdAt.toLocaleString()
  }));
}

export async function saveUserHistory(title: string, summary: string, score: number, path: string, output: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error('Not authenticated');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error('User not found');

  const newSession = await prisma.sessionHistory.create({
    data: {
      userId: user.id,
      title,
      summary,
      score,
      path,
      output
    }
  });

  return newSession;
}

export async function loadUserChatLog() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memory: true }
  });

  if (!user || !user.memory) return [];

  try {
    return JSON.parse(user.memory.chatLog || '[]');
  } catch (e) {
    return [];
  }
}

export async function saveUserChatLog(chatLog: any[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error('Not authenticated');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error('User not found');

  await prisma.candidateMemory.update({
    where: { userId: user.id },
    data: {
      chatLog: JSON.stringify(chatLog)
    }
  });

  return { success: true };
}

export async function loadUserSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) return null;

  let apiKeys: Record<string, string> = {};
  let selectedModels: Record<string, string> = {};
  try { apiKeys = JSON.parse(user.apiKeys || '{}'); } catch (e) {}
  try { selectedModels = JSON.parse(user.selectedModels || '{}'); } catch (e) {}

  return {
    apiKeys,
    selectedModels,
    activeProvider: user.activeProvider || 'anthropic',
    aiRealism: user.aiRealism || 'brutal',
    tavilyKey: user.tavilyKey || '',
    duckduckgoKey: user.duckduckgoKey || ''
  };
}

export async function saveUserSettings(settings: {
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  activeProvider: string;
  aiRealism: string;
  tavilyKey: string;
  duckduckgoKey: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error('Not authenticated');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error('User not found');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      apiKeys: JSON.stringify(settings.apiKeys),
      selectedModels: JSON.stringify(settings.selectedModels),
      activeProvider: settings.activeProvider,
      aiRealism: settings.aiRealism,
      tavilyKey: settings.tavilyKey,
      duckduckgoKey: settings.duckduckgoKey
    }
  });

  return { success: true };
}

export async function deleteUserResume() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memory: true }
  });

  if (!user) throw new Error('User not found');

  if (user.memory) {
    await prisma.candidateMemory.update({
      where: { userId: user.id },
      data: {
        careerLevel: 'Entry Level',
        careerGoals: '',
        coreSkills: '[]',
        verifiableMetrics: '[]',
        identifiedGaps: '[]',
        dataSufficiencyScore: 0,
        resumeFileName: null,
        resumeBase64: null,
        resumeUploadedAt: null,
        chatLog: '[]'
      }
    });
  }

  // Delete all ProofOfWork artifacts
  await prisma.proofOfWork.deleteMany({
    where: { userId: user.id }
  });

  // Delete all vector chunks
  await prisma.careerChunk.deleteMany({
    where: { userId: user.id }
  });

  // Delete all optimization history
  await prisma.sessionHistory.deleteMany({
    where: { userId: user.id }
  });

  return { success: true };
}
