import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
        success:
          'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
        warning:
          'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-100 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
        error:
          'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const alertIcons = {
  default: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
    showIcon?: boolean
  }
>(({ className, variant, showIcon = true, children, ...props }, ref) => {
  const Icon = variant ? alertIcons[variant] : alertIcons.default

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {showIcon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </div>
  )
})
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
