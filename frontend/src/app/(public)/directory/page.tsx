import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/shared/Navbar';
import { DirectoryContent } from '@/components/public/DirectoryContent';

export const metadata: Metadata = {
  title: 'Business Directory',
  description: 'Browse and search verified businesses on TruVis.info. Filter by country, industry, and verification status.',
};

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <Suspense fallback={<DirectoryLoading />}>
          <DirectoryContent />
        </Suspense>
      </div>
    </div>
  );
}

function DirectoryLoading() {
  return (
    <div className="section-container py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
