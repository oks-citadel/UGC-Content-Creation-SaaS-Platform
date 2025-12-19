'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const invoices = [
    { id: 'INV-001', org: 'Acme Corp', amount: 2999, status: 'paid', date: '2024-03-15' },
    { id: 'INV-002', org: 'Fashion Co', amount: 999, status: 'paid', date: '2024-03-14' },
    { id: 'INV-003', org: 'Food Brand', amount: 499, status: 'pending', date: '2024-03-13' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-2">View and manage all invoices</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/billing/invoices/${invoice.id}`} className="font-medium text-blue-600">
                    {invoice.id}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{invoice.org}</td>
                <td className="px-6 py-4 text-sm font-medium">{formatCurrency(invoice.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(invoice.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
