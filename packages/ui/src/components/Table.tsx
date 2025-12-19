import * as React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableTableHeadProps>(
  ({ className, children, sortDirection, onSort, ...props }, ref) => {
    const Icon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown

    return (
      <TableHead ref={ref} className={cn(className)} {...props}>
        <button
          className="flex items-center gap-2 hover:text-foreground focus:outline-none focus:text-foreground"
          onClick={onSort}
          type="button"
        >
          {children}
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </TableHead>
    )
  }
)
SortableTableHead.displayName = 'SortableTableHead'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
}

const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: TablePaginationProps) => {
  const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {itemsPerPage && totalItems && (
          <span>
            Showing {startItem} to {endItem} of {totalItems} results
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
TablePagination.displayName = 'TablePagination'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  SortableTableHead,
  TablePagination,
}
