'use client'

export function AttributionTable({ campaignId }: { campaignId: string }) {
  const attributionData = [
    {
      touchpoint: 'Instagram Post',
      impressions: 125000,
      clicks: 4200,
      conversions: 156,
      revenue: 18720,
      attribution: 35,
    },
    {
      touchpoint: 'TikTok Video',
      impressions: 89000,
      clicks: 3100,
      conversions: 98,
      revenue: 11760,
      attribution: 22,
    },
    {
      touchpoint: 'YouTube Review',
      impressions: 56000,
      clicks: 2400,
      conversions: 87,
      revenue: 10440,
      attribution: 19,
    },
    {
      touchpoint: 'Instagram Story',
      impressions: 45000,
      clicks: 1800,
      conversions: 62,
      revenue: 7440,
      attribution: 14,
    },
    {
      touchpoint: 'Website Direct',
      impressions: 0,
      clicks: 0,
      conversions: 45,
      revenue: 5400,
      attribution: 10,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Touchpoint
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impressions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clicks
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conversions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attribution %
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attributionData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">{row.touchpoint}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.impressions > 0 ? row.impressions.toLocaleString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.clicks > 0 ? row.clicks.toLocaleString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.conversions}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${row.revenue.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${row.attribution}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                    {row.attribution}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
