# Code Patterns

## API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session) return unauthorized()
  
  // 2. Permission check
  if (!hasPermission(session.user, 'resource:read')) {
    return forbidden()
  }
  
  // 3. Validate inputs
  const { searchParams } = new URL(request.url)
  const validated = schema.parse(Object.fromEntries(searchParams))
  
  // 4. Business logic
  try {
    const data = await prisma.resource.findMany({...})
    return NextResponse.json(data)
  } catch (error) {
    return serverError(error)
  }
}
```

## Component Pattern
```typescript
interface Props {
  data: EntityType
  onAction: (id: string) => Promise<void>
}

export function Component({ data, onAction }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleAction = async () => {
    setIsLoading(true)
    try {
      await onAction(data.id)
      toast.success('Action completed')
    } catch (error) {
      toast.error('Action failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card>
      {/* Component UI */}
    </Card>
  )
}
```

## Context7 Integration Points
1. **Entity Relationships**: Track all Prisma model connections
2. **Workflow States**: Monitor business process flows
3. **Permission Checks**: Ensure consistent auth patterns
4. **Component Dependencies**: Track UI component usage
5. **API Contracts**: Maintain endpoint documentation