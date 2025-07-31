import { Badge } from '@/components/ui/badge'
import { Priority } from '@prisma/client'

export const priorityConfig = {
  LOW: {
    label: 'Low',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
  },
  MEDIUM: {
    label: 'Medium',
    variant: 'warning' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
  },
  HIGH: {
    label: 'High',
    variant: 'warning' as const,
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-300 dark:border-orange-700'
  },
  URGENT: {
    label: 'Urgent',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700 font-semibold'
  }
}

export function getPriorityBadge(priority: Priority | string, label?: string) {
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.LOW
  
  return (
    <Badge 
      variant="outline" 
      className={config.className}
    >
      {label || config.label}
    </Badge>
  )
}

export function getPriorityColor(priority: Priority | string): string {
  const colors = {
    LOW: 'gray',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    URGENT: 'red'
  }
  return colors[priority as keyof typeof colors] || 'gray'
}

export function getPriorityBorderClass(priority: Priority | string): string {
  const borders = {
    LOW: 'border-l-gray-400',
    MEDIUM: 'border-l-yellow-500',
    HIGH: 'border-l-orange-500',
    URGENT: 'border-l-red-500'
  }
  return borders[priority as keyof typeof borders] || 'border-l-gray-400'
}