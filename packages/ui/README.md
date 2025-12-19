# @nexus/ui

Production-ready shared UI component library for the NEXUS platform.

## Features

- Built with React 18+ and TypeScript
- Styled with TailwindCSS
- Follows shadcn/ui patterns
- Fully accessible (ARIA compliant)
- Composable components
- Type-safe with full TypeScript support
- Tree-shakeable exports

## Installation

```bash
npm install @nexus/ui
```

## Usage

### Import styles

Import the global styles in your app entry point:

```tsx
import '@nexus/ui/styles'
```

### Use components

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@nexus/ui'

function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to NEXUS</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="primary">Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

## Components

### Button

Five variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`
Three sizes: `sm`, `md`, `lg`

```tsx
<Button variant="primary" size="md">Click me</Button>
```

### Input

With label, error state, and helper text support:

```tsx
<Input
  label="Email"
  type="email"
  error="Invalid email"
  helperText="We'll never share your email"
/>
```

### Card

Composable card with header, content, and footer sections:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

### Modal

Accessible modal with overlay and animations:

```tsx
<Modal>
  <ModalTrigger asChild>
    <Button>Open Modal</Button>
  </ModalTrigger>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Modal Title</ModalTitle>
      <ModalDescription>Modal description</ModalDescription>
    </ModalHeader>
    <div>Modal content</div>
    <ModalFooter>
      <Button>Save</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

### Table

Sortable table with pagination:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <SortableTableHead sortDirection="asc" onSort={handleSort}>
        Name
      </SortableTableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
<TablePagination
  currentPage={1}
  totalPages={10}
  onPageChange={setPage}
/>
```

### Badge

Status variants: `default`, `secondary`, `outline`, `destructive`, `success`, `warning`, `info`, `pending`, `active`, `inactive`

```tsx
<Badge variant="success">Active</Badge>
```

### Avatar

With fallback support:

```tsx
<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Dropdown

Full-featured dropdown menu:

```tsx
<Dropdown>
  <DropdownTrigger asChild>
    <Button>Menu</Button>
  </DropdownTrigger>
  <DropdownContent>
    <DropdownItem>Profile</DropdownItem>
    <DropdownSeparator />
    <DropdownItem>Logout</DropdownItem>
  </DropdownContent>
</Dropdown>
```

### Tabs

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Alert

Four variants: `info`, `success`, `warning`, `error`

```tsx
<Alert variant="success">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>
```

### Skeleton

Loading states:

```tsx
<Skeleton className="h-12 w-12 rounded-full" />
<SkeletonText lines={3} />
<SkeletonCard />
```

### Toast

Notification toasts with context provider:

```tsx
// Wrap your app
<ToastProvider>
  <App />
</ToastProvider>

// Use in components
const { addToast } = useToast()

addToast({
  variant: 'success',
  children: (
    <>
      <ToastTitle>Success</ToastTitle>
      <ToastDescription>Operation completed</ToastDescription>
    </>
  ),
})
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run dev

# Type check
npm run type-check

# Lint
npm run lint
```

## TailwindCSS Configuration

To use this library in your app, extend your Tailwind config to include the library's source files:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nexus/ui/dist/**/*.{js,mjs}',
  ],
  // ... rest of config
}
```

## License

MIT
