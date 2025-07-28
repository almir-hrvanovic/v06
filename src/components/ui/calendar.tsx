"use client"

import * as React from "react"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | Date[] | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  className?: string
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  initialFocus,
  className,
}: CalendarProps) {
  // Simple date picker implementation
  const today = new Date()
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth())
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    if (disabled && disabled(date)) return
    if (onSelect) {
      onSelect(date)
    }
  }

  const isSelected = (day: number) => {
    if (!selected || mode !== "single") return false
    const date = new Date(currentYear, currentMonth, day)
    return selected instanceof Date && 
      date.toDateString() === selected.toDateString()
  }

  const isDisabled = (day: number) => {
    if (!disabled) return false
    const date = new Date(currentYear, currentMonth, day)
    return disabled(date)
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div className={`p-3 ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-accent rounded"
        >
          ←
        </button>
        <div className="font-medium">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-accent rounded"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const disabled = isDisabled(day)
          const selected = isSelected(day)
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={disabled}
              className={`
                p-2 text-sm rounded-md transition-colors
                ${selected ? 'bg-primary text-primary-foreground' : ''}
                ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}
                ${!selected && !disabled ? 'text-foreground' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }