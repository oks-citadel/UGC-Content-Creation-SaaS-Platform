'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'

type ScheduleEvent = {
  title: string
  platform: string
  creator: string
}

type EventsByDay = Record<number, ScheduleEvent[]>

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<EventsByDay>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.schedule.getByMonth(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      )
      if (response.data?.data) {
        // Group events by day
        const eventsByDay: EventsByDay = {}
        response.data.data.forEach((event: any) => {
          const eventDate = new Date(event.scheduledAt)
          const day = eventDate.getDate()
          if (!eventsByDay[day]) {
            eventsByDay[day] = []
          }
          eventsByDay[day].push({
            title: event.title || event.content?.title || 'Untitled',
            platform: event.platform || 'Unknown',
            creator: event.creator?.name || event.creatorName || 'Unknown',
          })
        })
        setEvents(eventsByDay)
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
      setError('Failed to load schedule')
      // Set empty events on error so calendar still renders
      setEvents({})
    } finally {
      setIsLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

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

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4 mb-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-gray-500">Loading schedule...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-center py-2 mb-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchEvents}
            className="text-sm text-primary-600 hover:text-primary-700 mt-1"
          >
            Retry
          </button>
        </div>
      )}

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
          const dayEvents = events[day] || []
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
                {dayEvents.map((event, idx) => (
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
