# Code Style and Conventions

## TypeScript Standards
- **Strict Mode**: Enabled with `strict: true`
- **Type Safety**: Never use `any` without explicit justification
- **Interfaces**: Define strict TypeScript interfaces for all entities
- **Zod Validation**: Use Zod for runtime validation
- **Imports**: Use absolute imports with `@/` prefix

## Component Patterns
- **Server Components**: Use React Server Components where possible
- **Error Boundaries**: Implement proper error boundaries
- **Memoization**: Use React.memo for expensive components
- **Loading States**: Always show loading states for async operations

## Code Organization
- **Feature-based Structure**: Organize by features, not file types
- **Separation of Concerns**: UI, business logic, data access separate
- **Consistent Naming**: Use camelCase for variables, PascalCase for components

## Database Patterns
- **Transactions**: Use for multi-table operations
- **Soft Deletes**: Use isActive flags instead of hard deletes
- **Indexing**: Index frequently queried fields
- **Referential Integrity**: Maintain proper foreign key relationships

## Security Guidelines
- **Permission Checks**: Always verify user permissions in API routes
- **Input Validation**: Sanitize all user inputs with Zod
- **Parameterized Queries**: Prisma handles SQL injection protection
- **Audit Logging**: Log all system actions

## Performance Best Practices
- **Pagination**: Implement for all list views
- **Caching**: Use React Query for intelligent caching
- **Code Splitting**: Dynamic imports for lazy loading
- **Database Optimization**: Proper indexes and query optimization

## UI/UX Standards
- **Mobile-first**: Responsive design with TailwindCSS
- **Accessibility**: WCAG 2.1 compliance
- **Error Messages**: User-friendly error messages
- **Consistent Spacing**: Use Tailwind spacing classes