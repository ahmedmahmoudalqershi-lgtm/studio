import { Shell } from '@/components/layout/Shell';
import { HospitalDashboard } from '@/components/dashboard/HospitalDashboard';
import { EngineerDashboard } from '@/components/dashboard/EngineerDashboard';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const userRole = (role === 'engineer' ? 'engineer' : 'hospital') as 'hospital' | 'engineer';

  return (
    <Shell role={userRole}>
      {userRole === 'hospital' ? <HospitalDashboard /> : <EngineerDashboard />}
    </Shell>
  );
}
