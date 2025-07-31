# Assignment Components Documentation

## Overview
This folder contains specialized components for the drag-and-drop assignment system that allows VPP users to assign inquiry items to VP users for cost calculation. The system features both individual item and group assignment capabilities with comprehensive filtering and user management.

## Architecture Overview
The assignment system uses `@dnd-kit` for drag-and-drop functionality with a modular component architecture:
- **Drag Sources**: Unassigned items area with collapsible groups
- **Drop Targets**: User zones for VP/VPP assignments
- **Draggable Elements**: Individual items and entire inquiry groups
- **Filtering System**: Multi-criteria filtering with pending state management
- **User Management**: Dynamic user filtering and workload visualization

## Component Structure

### 1. **AssignmentFilters** (`assignment-filters.tsx`)
Advanced filtering system with pending state management for controlled filter application.

**Key Features:**
- Search bar with icon integration
- Expandable filter panel with visual indicators
- Customer, inquiry, and priority dropdowns
- Apply/Reset assignments button controls
- Pending changes visualization (orange ring + pulse)
- Active filter count badge

**Props Interface:**
```typescript
interface AssignmentFiltersProps {
  customers: Customer[]
  inquiries: Inquiry[]
  onFilterChange: (filters: {
    customerId?: string
    inquiryId?: string
    priority?: Priority
    search?: string
  }) => void
  onPendingStateChange?: (isPending: boolean) => void
  className?: string
  defaultExpanded?: boolean
}
```

**State Management:**
- Separate `filters` (applied) and `pendingFilters` (uncommitted)
- Visual pending state indicator when filters differ
- Parent notification via `onPendingStateChange` callback

### 2. **CollapsibleInquiryGroup** (`collapsible-inquiry-group.tsx`)
Draggable group container that allows batch assignment of all items within an inquiry.

**Key Features:**
- Collapsible/expandable UI with chevron indicators
- Group-level drag handle with visual feedback
- Item count badge
- Priority inheritance (shows most urgent child priority)
- Drag entire groups to assign all items at once

**Props Interface:**
```typescript
interface CollapsibleInquiryGroupProps {
  inquiryId: string
  inquiryTitle: string
  customerName: string
  items: InquiryItemWithRelations[]
  priority: Priority
  isDragging?: boolean
}
```

**Priority Logic:**
- Calculates most urgent priority from child items
- Visual priority badges with color coding
- Priority order: URGENT > HIGH > MEDIUM > LOW

### 3. **DraggableItem** (`draggable-item.tsx`)
Individual draggable item card with comprehensive item details.

**Key Features:**
- Full item information display
- Priority-based left border coloring
- Hover and drag state animations
- Assignment status display
- Icon-based metadata visualization

**Visual Elements:**
- Item name with truncation
- Customer and inquiry info
- Quantity with unit
- Priority badge
- Creation date
- Inquiry reference
- Assigned user display (when applicable)

**Props Interface:**
```typescript
interface DraggableItemProps {
  item: InquiryItemWithRelations
  isDragging?: boolean
}
```

### 4. **SortableUserZone** (`sortable-user-zone.tsx`)
Wrapper component that makes user zones both droppable and sortable.

**Key Features:**
- User zone reordering capability
- Drag handle on hover (top-center position)
- Maintains drop zone functionality while sortable
- Smooth transitions during reorder

**Props Interface:**
```typescript
interface SortableUserZoneProps {
  user: User & {
    pendingCount?: number
    completedCount?: number
  }
  items: InquiryItemWithRelations[]
  isOver?: boolean
}
```

### 5. **UnassignedDropZone** (`unassigned-drop-zone.tsx`)
Drop zone for unassigned items with automatic inquiry grouping.

**Key Features:**
- Automatic grouping by inquiry
- Empty state with visual guidance
- Drop hover effects
- Supports both item and group drops
- Fixed 30% width layout

**Props Interface:**
```typescript
interface UnassignedDropZoneProps {
  items: InquiryItemWithRelations[]
  isOver?: boolean
}
```

**Grouping Logic:**
- Items automatically grouped by `inquiryId`
- Each group rendered as `CollapsibleInquiryGroup`
- Maintains inquiry metadata for display

### 6. **UserDropZone** (`user-drop-zone.tsx`)
Individual user assignment zone with workload visualization.

**Key Features:**
- User info with role badge (VPP highlighted)
- Workload indicators:
  - Pending items (red with package icon)
  - Completed items (green with checkmark)
- Sortable item container
- Empty state messaging
- Drop hover effects

**Props Interface:**
```typescript
interface UserDropZoneProps {
  user: User & {
    pendingCount?: number
    completedCount?: number
  }
  items: InquiryItemWithRelations[]
  isOver?: boolean
}
```

### 7. **UserFilterDropdown** (`user-filter-dropdown.tsx`)
Multi-select dropdown for filtering visible VP/VPP users.

**Key Features:**
- Checkbox-style selection with check marks
- Select All/Deselect All quick actions
- User count in trigger button
- Role badges for each user
- Scrollable user list

**Props Interface:**
```typescript
interface UserFilterDropdownProps {
  users: User[]
  selectedUserIds: string[]
  onSelectionChange: (userIds: string[]) => void
}
```

## Drag & Drop Architecture

### DnD-Kit Setup
```typescript
// Collision detection
closestCenter // Used for stable dragging

// Sensors
PointerSensor // Primary interaction
KeyboardSensor // Accessibility support
TouchSensor // Mobile support

// Activation constraints
distance: 8 // Prevents accidental drags
```

### Draggable Types
1. **Individual Items**: `id: item.id`
2. **Inquiry Groups**: `id: group-${inquiryId}`
3. **User Zones**: `id: user-${userId}` (for reordering)

### Drop Zones
1. **Unassigned Area**: `id: 'unassigned'`
2. **User Zones**: `id: user-${userId}`

## State Management Patterns

### Filter State
```typescript
// Dual state for controlled application
const [filters, setFilters] = useState({...})
const [pendingFilters, setPendingFilters] = useState({...})

// Only apply on explicit action
const applyFilters = () => {
  setFilters(pendingFilters)
  onFilterChange(pendingFilters)
}
```

### Drag State
```typescript
// Track active drag for visual feedback
const [activeId, setActiveId] = useState(null)
const [overId, setOverId] = useState(null)
```

## Visual Design System

### Priority Colors
```typescript
URGENT: 'border-l-red-500' / 'bg-red-500'
HIGH: 'border-l-orange-500' / 'bg-orange-500'
MEDIUM: 'border-l-yellow-500' / 'bg-yellow-500'
LOW: 'border-l-gray-400' / 'bg-blue-500'
```

### Interactive States
- **Hover**: Shadow increase, cursor changes
- **Dragging**: Opacity reduction, scale transform
- **Over**: Ring highlight, background tint
- **Pending**: Orange ring with pulse animation

## Integration Guidelines

### Parent Component Requirements
```typescript
// Required providers
<DndContext 
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={userIds}>
    {/* Assignment components */}
  </SortableContext>
</DndContext>
```

### Data Flow
1. **Items Fetch**: Get unassigned items from API
2. **User Fetch**: Get VP/VPP users
3. **Assignment**: POST to `/api/items/assign`
4. **Unassignment**: POST to `/api/items/unassign`

## Performance Considerations

1. **Virtualization**: Consider for 100+ items
2. **Memoization**: Use for expensive calculations
3. **Batch Operations**: Group assignments reduce API calls
4. **Optimistic Updates**: Update UI before API confirmation

## Accessibility Features

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management during drag operations
- Screen reader announcements

## Mobile Optimization

- Touch sensor support
- Responsive layouts
- Larger touch targets on mobile
- Horizontal scrolling for user zones

## Best Practices

1. **State Management**
   - Keep drag state minimal
   - Use optimistic updates
   - Batch API calls when possible

2. **Visual Feedback**
   - Clear hover states
   - Smooth transitions
   - Loading indicators

3. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Rollback on failures

4. **Performance**
   - Debounce search inputs
   - Lazy load large datasets
   - Minimize re-renders

## Common Issues & Solutions

### Issue: Items not dropping
**Solution**: Ensure drop zone IDs are unique and properly registered

### Issue: Laggy drag performance
**Solution**: Reduce component re-renders, use React.memo

### Issue: Group drag not working
**Solution**: Check group ID format (`group-${inquiryId}`)

### Issue: User reordering conflicts with drop zones
**Solution**: Use proper event propagation and sortable context nesting

## Future Enhancements

1. **Bulk Operations**
   - Multi-select with checkboxes
   - Bulk assignment actions
   - Keyboard shortcuts

2. **Advanced Filtering**
   - Date range filters
   - Status filters
   - Saved filter presets

3. **Analytics Integration**
   - Assignment history
   - Performance metrics
   - Workload trends

4. **Real-time Updates**
   - WebSocket integration
   - Live collaboration
   - Conflict resolution

## Testing Guidelines

### Unit Tests
```typescript
// Test drag operations
it('should update assignments on drag end', () => {
  const { getByTestId } = render(<DragDropAssignmentPage />)
  // Simulate drag and drop
  // Assert assignment state updated
})

// Test filter application
it('should apply filters only on button click', () => {
  const { getByRole } = render(<AssignmentFilters {...props} />)
  // Change filter values
  // Assert onFilterChange not called until Apply clicked
})
```

### Integration Tests
- Test API endpoints with various status combinations
- Test authentication and authorization
- Test batch operations and error recovery

### E2E Tests
- Complete assignment workflow
- Filter and search functionality
- Mobile drag-and-drop operations

## Dependencies

- `@dnd-kit/core`: ^6.0.0 - Core drag-and-drop
- `@dnd-kit/sortable`: ^7.0.0 - Sortable functionality
- `@dnd-kit/utilities`: ^3.0.0 - Helper utilities
- `lucide-react`: ^0.263.0 - Icon library
- `next-intl`: ^3.0.0 - Internationalization
- UI components from `@/components/ui/*`

## Migration Notes

When migrating from other DnD libraries:
1. Replace drag event handlers with DnD-Kit sensors
2. Update component props to match DnD-Kit API
3. Implement proper collision detection
4. Add accessibility features

## Contributing

1. Follow existing component patterns
2. Add proper TypeScript types
3. Include comprehensive props documentation
4. Test on multiple browsers and devices
5. Update this README with new features