'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const mockEvents = {
    5: [{ title: 'Photo Post', platform: 'Instagram', creator: 'Sarah J.' }],
    12: [
      { title: 'Video Review', platform: 'TikTok', creator: 'Mike C.' },
      { title: 'Story Post', platform: 'Instagram', creator: 'Emma D.' },
    ],
    18: [{ title: 'Reel', platform: 'Instagram', creator: 'Alex R.' }],
    25: [{ title: 'YouTube Video', platform: 'YouTube', creator: 'David K.' }],
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const events = mockEvents[day as keyof typeof mockEvents] || []
          const isToday = new Date().getDate() === day &&
            new Date().getMonth() === currentDate.getMonth() &&
            new Date().getFullYear() === currentDate.getFullYear()

          return (
            <div
              key={day}
              className={`aspect-square border border-gray-200 rounded-lg p-2 ${
                isToday ? 'border-primary-500 bg-primary-50' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-primary-100 text-primary-800 px-1 py-0.5 rounded truncate"
                    title={`${event.title} - ${event.creator}`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
