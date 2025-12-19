'use client';

import { useState } from 'react';
import Link from 'next/link';
import ApplicationForm from '@/components/opportunities/ApplicationForm';
import { ArrowLeft, DollarSign, Calendar, Users, MapPin, CheckCircle } from 'lucide-react';

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Mock data - replace with API call
  const opportunity = {
    id: params.id,
    title: 'Summer Fashion Campaign',
    brand: 'StyleCo',
    brandLogo: '/placeholder-brand.png',
    budget: '$1,500 - $2,500',
    deadline: 'June 30, 2024',
    location: 'Remote',
    applicants: 42,
    description: `We're looking for fashion creators to showcase our new summer collection. This campaign will focus on beach and casual wear, targeting millennials and Gen Z audiences.`,
    requirements: [
      'Minimum 10K followers on Instagram',
      'Fashion or lifestyle niche',
      'Previous brand collaboration experience preferred',
      'High engagement rate (>3%)',
    ],
    deliverables: [
      '3 Instagram feed posts',
      '5 Instagram stories',
      '1 Instagram Reel',
      'All content must feature our products',
    ],
    timeline: '4 weeks from acceptance',
    category: 'Fashion',
    tags: ['fashion', 'summer', 'lifestyle', 'casual'],
  };

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
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">SC</span>
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
