
'use client';

import { Shell } from '@/components/layout/Shell';
import { RequestForm } from '@/components/requests/RequestForm';

export default function NewRequestPage() {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <RequestForm />
      </div>
    </Shell>
  );
}
