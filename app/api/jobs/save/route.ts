import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' }
    });

    // Parse skills from JSON string back to arrays
    const formattedJobs = savedJobs.map(job => {
      let matchedSkills = [];
      let missingSkills = [];
      try { matchedSkills = JSON.parse(job.matchedSkills); } catch (e) {}
      try { missingSkills = JSON.parse(job.missingSkills); } catch (e) {}

      return {
        ...job,
        matchedSkills,
        missingSkills
      };
    });

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error: any) {
    console.error('Fetch saved jobs error:', error);
    return NextResponse.json(
      { error: `Failed to fetch saved jobs: ${error.message}` },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();
    const {
      title,
      company,
      url,
      location,
      salary,
      description,
      isRemote = true,
      fitScore,
      trustScore,
      trustExplanation,
      fitExplanation,
      unfitExplanation,
      matchedSkills = [],
      missingSkills = [],
      remoteType = 'Remote',
      source = 'duckduckgo'
    } = body;

    if (!title || !company || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findFirst({
      where: {
        userId: user.id,
        url: url
      }
    });

    if (existing) {
      // Unsave/Delete
      await prisma.savedJob.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ saved: false, message: 'Job unsaved successfully' });
    } else {
      // Save
      const newJob = await prisma.savedJob.create({
        data: {
          userId: user.id,
          title,
          company,
          url,
          location,
          salary,
          description,
          isRemote,
          fitScore: fitScore ? parseInt(fitScore) : null,
          trustScore: trustScore ? parseInt(trustScore) : null,
          trustExplanation,
          fitExplanation,
          unfitExplanation,
          matchedSkills: JSON.stringify(matchedSkills),
          missingSkills: JSON.stringify(missingSkills),
          remoteType,
          source
        }
      });
      return NextResponse.json({ saved: true, job: newJob, message: 'Job saved successfully' });
    }
  } catch (error: any) {
    console.error('Toggle saved job error:', error);
    return NextResponse.json(
      { error: `Failed to toggle saved job: ${error.message}` },
      { status: 500 }
    );
  }
}
