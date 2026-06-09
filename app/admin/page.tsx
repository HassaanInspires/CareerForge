import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch all users with their memory and proofOfWork
  const users = await prisma.user.findMany({
    include: {
      memory: true,
      proofOfWork: true,
      sessions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6 md:p-12 font-sans text-white">
      <nav className="mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80">
          CareerForge <span className="text-[var(--color-accent-orange)] font-mono text-sm ml-2">Admin Dashboard</span>
        </Link>
        <Link href="/" className="text-sm text-[var(--color-text-secondary)] hover:text-white">Back to App</Link>
      </nav>

      <main className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-blue)]">
            <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-2">Total Candidates</h3>
            <p className="text-4xl font-bold font-mono">{users.length}</p>
          </div>
          <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-purple)]">
            <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-2">Total PoW Artifacts</h3>
            <p className="text-4xl font-bold font-mono">
              {users.reduce((acc, user) => acc + user.proofOfWork.length, 0)}
            </p>
          </div>
          <div className="glass-card p-6 border-t-4 border-t-[var(--color-success)]">
            <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-2">Total Assessments Run</h3>
            <p className="text-4xl font-bold font-mono">
              {users.reduce((acc, user) => acc + user.sessions.length, 0)}
            </p>
          </div>
        </div>

        <div className="glass-card p-0 overflow-hidden">
          <div className="p-6 bg-[rgba(255,255,255,0.02)] border-b border-[var(--color-border-medium)]">
            <h2 className="text-xl font-bold text-white">Candidate Verification Roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Candidate</th>
                  <th className="px-6 py-4 font-medium">Career Level</th>
                  <th className="px-6 py-4 font-medium">Verified Skills</th>
                  <th className="px-6 py-4 font-medium">PoW Artifacts</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-medium)]">
                {users.map((user) => {
                  let coreSkills = [];
                  try {
                    if (user.memory?.coreSkills) {
                      coreSkills = JSON.parse(user.memory.coreSkills);
                    }
                  } catch (e) {}

                  return (
                    <tr key={user.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{user.name || 'Anonymous'}</div>
                        <div className="text-[var(--color-text-secondary)] text-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge">{user.memory?.careerLevel || 'Unassessed'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {coreSkills.slice(0, 3).map((skill: string, i: number) => (
                            <span key={i} className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded border border-[var(--color-border-light)]">{skill}</span>
                          ))}
                          {coreSkills.length > 3 && <span className="text-xs text-[var(--color-text-disabled)]">+{coreSkills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-[var(--color-accent-blue)]">{user.proofOfWork.length} artifacts</span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-mono">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-12 text-center text-[var(--color-text-disabled)] italic">
                No candidates registered yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
