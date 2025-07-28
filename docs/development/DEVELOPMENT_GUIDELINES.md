# Development Guidelines

## Code Organization
- Use feature-based folder structure
- Separate concerns: UI, business logic, data access
- Implement proper error boundaries
- Use React Server Components where possible

## Type Safety
- Define strict TypeScript interfaces for all entities
- Use Zod for runtime validation
- Maintain type consistency across client-server boundaries
- Never use `any` type without explicit justification

## Security First
- Always check user permissions in API routes
- Use parameterized queries (Prisma handles this)
- Sanitize all user inputs
- Implement proper CORS policies
- Never expose sensitive data in client-side code

## Performance Optimization
- Implement pagination for all list views
- Use React.memo for expensive components
- Optimize database queries with proper indexes
- Implement caching strategies with React Query
- Use dynamic imports for code splitting

## UI/UX Standards
- Mobile-first responsive design
- Loading states for all async operations
- Proper error messages (user-friendly)
- Consistent spacing and typography (via Tailwind)
- Accessibility compliance (WCAG 2.1)

## Business Logic Rules
- VPP can only assign to active VPs
- Cost calculations require all fields completed
- Managers must approve costs over threshold
- Quotes expire after validity period
- All actions create audit log entries

## Database Patterns
- Use transactions for multi-table operations
- Implement soft deletes (isActive flags)
- Maintain referential integrity
- Index frequently queried fields
- Use JSON fields for flexible data

## Testing Requirements
- Unit tests for business logic
- Integration tests for API routes
- E2E tests for critical workflows
- Test all user role scenarios
- Maintain >80% code coverage

## Error Handling Strategy
1. Catch errors at appropriate levels
2. Log technical details to server
3. Show user-friendly messages
4. Provide actionable next steps
5. Track error patterns for fixes

## Sprint Methodology
- 2-week sprints with clear deliverables
- Daily progress updates in SPRINTS.md
- Feature branches with PR reviews
- Continuous deployment to preview
- Production releases at sprint end