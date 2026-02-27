'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, XCircle, AlertCircle, Edit, Send, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { dashboardApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { TruvisVerifiedBadge, TruvisClientBadge } from '@/components/ui/Badge';
import type { Company } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['my-company'],
    queryFn: () => dashboardApi.getMyProfile(accessToken!) as Promise<Company>,
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const statusConfig = {
    draft: { icon: Edit, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Draft — not submitted' },
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Under Review' },
    approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Published & Live' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Needs Revision' },
  };

  const statusInfo = company ? statusConfig[company.status] : null;
  const StatusIcon = statusInfo?.icon || AlertCircle;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Company Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your company profile and track your listing.</p>
      </div>

      {/* Status Banner */}
      {company && statusInfo && (
        <div className={`${statusInfo.bg} rounded-xl p-5 flex items-start gap-4`}>
          <StatusIcon className={`w-6 h-6 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <div className="font-semibold text-navy-900">{statusInfo.label}</div>
            {company.status === 'rejected' && company.rejectionReason && (
              <p className="text-sm text-gray-600 mt-1">{company.rejectionReason}</p>
            )}
            {company.status === 'draft' && (
              <p className="text-sm text-gray-500 mt-1">
                Complete your profile and submit it for admin review to go live.
              </p>
            )}
            {company.status === 'approved' && (
              <Link href={`/directory/${company.slug}`} className="inline-flex items-center gap-1 text-sm text-navy-700 hover:text-navy-900 mt-1">
                View public profile <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {(company.status === 'draft' || company.status === 'rejected') && (
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/dashboard/profile" className="btn-ghost text-sm">
                Edit Profile
              </Link>
              {company.status === 'draft' && (
                <SubmitButton companyId={company.id} accessToken={accessToken!} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Profile Score */}
      {company && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-navy-900">Profile Completeness</h2>
            <span className="text-2xl font-bold text-navy-900">{company.profileScore}%</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                company.profileScore >= 80 ? 'bg-green-500' :
                company.profileScore >= 50 ? 'bg-amber-500' : 'bg-red-400'
              }`}
              style={{ width: `${company.profileScore}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Logo', done: !!company.logoUrl, pts: '15pts' },
              { label: 'Cover Image', done: !!company.coverUrl, pts: '10pts' },
              { label: 'Description', done: !!(company.description && company.description.length > 100), pts: '15pts' },
              { label: 'Location', done: !!(company.country && company.city), pts: '10pts' },
              { label: 'Contact Info', done: !!(company.phone && company.email), pts: '10pts' },
              { label: 'Services', done: !!(company.services && company.services.length > 0), pts: '10pts' },
              { label: 'Gallery (3+)', done: !!(company.gallery && company.gallery.length >= 3), pts: '10pts' },
              { label: 'Social Links', done: !!(Object.values(company.socialLinks || {}).filter(Boolean).length >= 2), pts: '5pts' },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${item.done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                {item.done ? (
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span>{item.label}</span>
                <span className="ml-auto font-medium">{item.pts}</span>
              </div>
            ))}
          </div>

          <Link href="/dashboard/profile" className="btn-primary w-full mt-4">
            <Edit className="w-4 h-4" />
            Complete Profile
          </Link>
        </div>
      )}

      {/* Badges */}
      {company && (company.truvisVerified || company.truvisClient) && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-navy-900 mb-3">Your TruVis Badges</h2>
          <div className="flex gap-3">
            {company.truvisVerified && <TruvisVerifiedBadge />}
            {company.truvisClient && <TruvisClientBadge />}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/profile', label: 'Edit Profile', icon: '✏️', desc: 'Update your information' },
          { href: '/dashboard/media', label: 'Upload Media', icon: '🖼️', desc: 'Logo, cover, gallery' },
          { href: '/dashboard/blog', label: 'Write Insights', icon: '📝', desc: 'Submit blog posts' },
        ].map(link => (
          <Link key={link.href} href={link.href} className="bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition-shadow group">
            <div className="text-2xl mb-2">{link.icon}</div>
            <div className="font-medium text-navy-900 group-hover:text-navy-700">{link.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SubmitButton({ companyId, accessToken }: { companyId: string; accessToken: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await dashboardApi.submitForApproval(accessToken);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSubmit} disabled={loading} className="btn-primary text-sm">
      <Send className="w-3.5 h-3.5" />
      {loading ? 'Submitting...' : 'Submit for Review'}
    </button>
  );
}

// Need to add useState back
import { useState } from 'react';
