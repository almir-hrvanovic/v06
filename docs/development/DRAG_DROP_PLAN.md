# Drag and Drop Implementation Plan for Assignment Page

## Overview
This document outlines the plan to implement drag and drop functionality on the assignment page using the @dnd-kit library. This will allow VPP users to assign inquiry items to VPs through an intuitive drag-and-drop interface.

## Current State
- Assignment page uses checkboxes and a dialog for bulk assignment
- Table view shows unassigned items
- Manual selection and assignment process

## Proposed Implementation

### 1. Dependencies
Install the following packages:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Page Structure Enhancement
Add a view toggle to switch between:
- **List View** (current table implementation)
- **Board View** (new drag-and-drop interface)

### 3. Board View Layout
```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Unassigned Items│   VP User 1  │   VP User 2  │   VP User 3  │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ ┌─────────────┐ │ ┌──────────┐ │ ┌──────────┐ │              │
│ │ Item Card 1 │ │ │ Item A   │ │ │ Item X   │ │              │
│ └─────────────┘ │ └──────────┘ │ └──────────┘ │              │
│ ┌─────────────┐ │ ┌──────────┐ │              │              │
│ │ Item Card 2 │ │ │ Item B   │ │              │              │
│ └─────────────┘ │ └──────────┘ │              │              │
│       ...       │     ...      │     ...      │     ...      │
└─────────────────┴──────────────┴──────────────┴──────────────┘
```

### 4. Component Structure

#### DraggableItem Component
```typescript
interface DraggableItemProps {
  item: InquiryItemWithRelations
  isSelected: boolean
  onSelect: (itemId: string) => void
}
```
Features:
- Display item name, customer, quantity
- Show selection state for multi-drag
- Visual feedback during drag

#### DroppableVPColumn Component
```typescript
interface DroppableVPColumnProps {
  vp: User & { _count: { inquiryItems: number } }
  items: InquiryItemWithRelations[]
  onDrop: (itemIds: string[], vpId: string) => void
}
```
Features:
- Show VP name and workload count
- Highlight on drag over
- Display assigned items

### 5. Drag and Drop Logic

#### Single Item Drag
1. User drags an item from unassigned column
2. Visual feedback shows dragging state
3. VP columns highlight when hovering
4. On drop: API call to assign item
5. Optimistic update with rollback on error

#### Multi-Select Drag
1. User selects multiple items (checkbox/ctrl-click)
2. Drag any selected item moves all selected
3. Shows count badge during drag
4. Batch assignment on drop

### 6. API Integration
```typescript
const handleDrop = async (itemIds: string[], vpId: string) => {
  try {
    // Optimistic update
    updateUIOptimistically(itemIds, vpId)
    
    // API call
    await apiClient.assignItems({
      itemIds,
      assigneeId: vpId
    })
    
    // Refresh data
    await fetchData()
    toast.success(`Assigned ${itemIds.length} items`)
  } catch (error) {
    // Rollback optimistic update
    rollbackUIUpdate()
    toast.error('Failed to assign items')
  }
}
```

### 7. Enhanced Features

#### Workload Balancing
- Color-coded VP columns based on workload:
  - Green: Low workload (0-5 items)
  - Yellow: Medium workload (6-15 items)
  - Red: High workload (16+ items)
- Show workload statistics in column header

#### Search and Filter
- Maintain existing search functionality
- Filter items by customer, date, priority
- Search works in both views

#### Undo Functionality
- Store last 5 assignment actions
- Show "Undo" button after assignment
- Revert assignments within 10 seconds

### 8. Responsive Design
- Desktop: Full board view with all columns
- Tablet: Horizontal scroll for VP columns
- Mobile: Fallback to list view (current implementation)

### 9. Accessibility
- Keyboard navigation support
- Arrow keys to move between items
- Space to select, Enter to open menu
- Announce drag operations to screen readers

### 10. Performance Optimizations
- Virtual scrolling for large item lists
- Lazy load VP columns
- Debounced search
- Memoized components

## Implementation Phases

### Phase 1: Basic Drag and Drop (Week 1)
- Install dependencies
- Create board view structure
- Implement single item drag and drop
- Basic visual feedback

### Phase 2: Enhanced Features (Week 2)
- Multi-select functionality
- Workload indicators
- Undo functionality
- Polish animations

### Phase 3: Testing and Optimization (Week 3)
- Performance testing with large datasets
- Accessibility audit
- Mobile responsiveness
- Bug fixes

## Success Metrics
- Reduced time to assign items (measure before/after)
- Improved workload distribution across VPs
- User satisfaction (gather feedback)
- Reduced mis-assignments

## Technical Stack
- @dnd-kit/core: Core drag and drop functionality
- @dnd-kit/sortable: For sortable lists within columns
- @dnd-kit/utilities: Helper functions
- Existing: React, TypeScript, Tailwind CSS

## Risks and Mitigations
1. **Performance with many items**
   - Mitigation: Implement virtual scrolling
   
2. **Complex state management**
   - Mitigation: Use React Query for server state
   
3. **Mobile touch conflicts**
   - Mitigation: Provide alternative UI for mobile

## Future Enhancements
- Drag items between VP columns (reassignment)
- Bulk actions menu on selected items
- Assignment templates/rules
- AI-powered assignment suggestions
- Real-time collaboration (WebSocket)