'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ApplicationForm from '@/components/opportunities/ApplicationForm';
import { ArrowLeft, DollarSign, Calendar, Users, MapPin, CheckCircle, Loader2, Building2 } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  brand: string;
  brandId: string;
  brandLogo: string | null;
  budget: string;
  deadline: string;
  location: string;
  applicants: number;
  description: string;
  requirements: string[];
  deliverables: string[];
  timeline: string;
  category: string;
  tags: string[];
}

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandLogoError, setBrandLogoError] = useState(false);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch opportunity details from marketplace service
        const response = await fetch(`/api/opportunities/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Opportunity not found');
          }
          throw new Error('Failed to load opportunity');
        }

        const data = await response.json();
        const oppData = data.data || data;

        // Fetch brand details to get the logo
        let brandLogo = oppData.brandLogo || null;
        if (!brandLogo && oppData.brandId) {
          try {
            const brandResponse = await fetch(`/api/brands/${oppData.brandId}`);
            if (brandResponse.ok) {
              const brandData = await brandResponse.json();
              const brand = brandData.data || brandData;
              brandLogo = brand.logo || brand.logoUrl || brand.imageUrl || null;
            }
          } catch (e) {
            console.warn('Failed to fetch brand details:', e);
          }
        }

        // Format the opportunity data
        setOpportunity({
          id: oppData.id || params.id,
          title: oppData.title || 'Untitled Opportunity',
          brand: oppData.brand || oppData.brandName || 'Unknown Brand',
          brandId: oppData.brandId || '',
          brandLogo: brandLogo,
          budget: formatBudget(oppData.budget, oppData.minBudget, oppData.maxBudget, oppData.currency),
          deadline: formatDeadline(oppData.deadline),
          location: oppData.location || oppData.locations?.[0] || 'Remote',
          applicants: oppData.applicants || oppData.bidCount || oppData._count?.bids || 0,
          description: oppData.description || '',
          requirements: oppData.requirements || [],
          deliverables: oppData.deliverables || [],
          timeline: oppData.timeline || oppData.duration || 'To be discussed',
          category: oppData.category || oppData.targetNiche?.[0] || 'General',
          tags: oppData.tags || oppData.targetNiche || [],
        });
      } catch (err) {
        console.error('Failed to fetch opportunity:', err);
        setError(err instanceof Error ? err.message : 'Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [params.id]);

  // Helper to format budget range
  const formatBudget = (
    budget?: number,
    minBudget?: number,
    maxBudget?: number,
    currency: string = 'USD'
  ): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (budget) {
      return formatter.format(budget);
    }
    if (minBudget && maxBudget) {
      return `${formatter.format(minBudget)} - ${formatter.format(maxBudget)}`;
    }
    if (minBudget) {
      return `From ${formatter.format(minBudget)}`;
    }
    if (maxBudget) {
      return `Up to ${formatter.format(maxBudget)}`;
    }
    return 'Negotiable';
  };

  // Helper to format deadline
  const formatDeadline = (deadline?: string | Date): string => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link
          href="/opportunities"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Link>
        <div className="card text-center py-12">
          <p className="text-gray-600">{error || 'Opportunity not found'}</p>
          <Link href="/opportunities" className="btn btn-primary mt-4">
            Browse Opportunities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/opportunities"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {opportunity.brandLogo && !brandLogoError ? (
                  <img
                    src={opportunity.brandLogo}
                    alt={`${opportunity.brand} logo`}
                    className="w-full h-full object-cover"
                    onError={() => setBrandLogoError(true)}
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {opportunity.title}
                </h1>
                <p className="text-gray-600">{opportunity.brand}</p>
              </div>
              <span className="badge badge-primary">{opportunity.category}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="font-semibold text-gray-900">{opportunity.budget}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="font-semibold text-gray-900">{opportunity.deadline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{opportunity.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-500">Applicants</p>
                  <p className="font-semibold text-gray-900">{opportunity.applicants}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">About This Opportunity</h2>
              <p className="text-gray-700 leading-relaxed">{opportunity.description}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Requirements</h2>
            <ul className="space-y-2">
              {opportunity.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Deliverables</h2>
            <ul className="space-y-2">
              {opportunity.deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{deliverable}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Timeline:</strong> {opportunity.timeline}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="font-semibold mb-4">Apply for this opportunity</h3>
            <p className="text-sm text-gray-600 mb-4">
              Submit your application to be considered for this campaign.
            </p>
            {showApplicationForm ? (
              <ApplicationForm
                opportunityId={opportunity.id}
                onCancel={() => setShowApplicationForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="btn btn-primary w-full"
              >
                Apply Now
              </button>
            )}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag) => (
                  <span key={tag} className="badge bg-gray-100 text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
