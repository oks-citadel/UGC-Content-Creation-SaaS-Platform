import * as React from 'react'
import { cn } from '../lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

function SkeletonText({
  className,
  lines = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && 'w-4/5')}
        />
      ))}
    </div>
  )
}

function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

function SkeletonAvatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn('h-10 w-10 rounded-full', className)}
      {...props}
    />
  )
}

function SkeletonButton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn('h-10 w-24 rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonButton }
