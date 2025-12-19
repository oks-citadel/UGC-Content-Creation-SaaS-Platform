'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ApplicationFormProps {
  opportunityId: string;
  onCancel: () => void;
}

export default function ApplicationForm({
  opportunityId,
  onCancel,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: '',
    portfolioLinks: '',
    availability: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Submit logic here
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Application submitted successfully!');
      onCancel();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
          Cover Letter
        </label>
        <textarea
          id="coverLetter"
          rows={4}
          required
          className="input"
          placeholder="Tell the brand why you're the perfect fit..."
          value={formData.coverLetter}
          onChange={(e) =>
            setFormData({ ...formData, coverLetter: e.target.value })
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.coverLetter.length}/500 characters
        </p>
      </div>

      <div>
        <label htmlFor="proposedRate" className="block text-sm font-medium text-gray-700 mb-1">
          Proposed Rate (Optional)
        </label>
        <input
          id="proposedRate"
          type="text"
          className="input"
          placeholder="$1,500"
          value={formData.proposedRate}
          onChange={(e) =>
            setFormData({ ...formData, proposedRate: e.target.value })
          }
        />
      </div>

      <div>
        <label htmlFor="portfolioLinks" className="block text-sm font-medium text-gray-700 mb-1">
          Relevant Portfolio Links
        </label>
        <textarea
          id="portfolioLinks"
          rows={2}
          className="input"
          placeholder="Paste links to similar work (one per line)"
          value={formData.portfolioLinks}
          onChange={(e) =>
            setFormData({ ...formData, portfolioLinks: e.target.value })
          }
        />
      </div>

      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
          Availability
        </label>
        <input
          id="availability"
          type="text"
          required
          className="input"
          placeholder="e.g., Available immediately"
          value={formData.availability}
          onChange={(e) =>
            setFormData({ ...formData, availability: e.target.value })
          }
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            'Submitting...'
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Application
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
