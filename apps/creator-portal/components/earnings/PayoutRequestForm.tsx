'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface PayoutRequestFormProps {
  onCancel: () => void;
}

export default function PayoutRequestForm({ onCancel }: PayoutRequestFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = 2890;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (amount > availableBalance) {
      alert('Amount exceeds available balance');
      return;
    }

    if (amount < 50) {
      alert('Minimum payout amount is $50');
      return;
    }

    setIsSubmitting(true);

    // Submit logic here
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Payout request submitted successfully!');
      onCancel();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-900 mb-1">
          <DollarSign className="h-5 w-5" />
          <span className="font-semibold">Available Balance</span>
        </div>
        <p className="text-2xl font-bold text-blue-900">${availableBalance}</p>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Payout Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            id="amount"
            type="number"
            required
            min="50"
            max={availableBalance}
            step="0.01"
            className="input pl-8"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Minimum payout: $50 | Maximum: ${availableBalance}
        </p>
      </div>

      <div>
        <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
          Payout Method
        </label>
        <select
          id="method"
          className="input"
          value={formData.method}
          onChange={(e) =>
            setFormData({ ...formData, method: e.target.value })
          }
        >
          <option value="bank">Bank Transfer (Primary)</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Processing Time
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>Bank Transfer: 3-5 business days</li>
          <li>PayPal: 1-2 business days</li>
          <li>Payouts are processed on Mondays and Thursdays</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary flex-1"
        >
          {isSubmitting ? 'Processing...' : 'Request Payout'}
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
