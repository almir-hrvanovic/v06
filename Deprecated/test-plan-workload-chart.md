# WorkloadChart Component Test Plan

## Overview
This test plan ensures the WorkloadChart component functions correctly without crashes across all scenarios, including edge cases and user interactions.

## Component Analysis

### Component Structure
- **Location**: `/src/components/assignments/workload-chart.tsx`
- **Integration**: Used in `/src/app/dashboard/assignments/unified/page.tsx`
- **Dependencies**: Recharts, Next-intl, Lucide React, Tailwind CSS

### Props Interface
```typescript
interface WorkloadChartProps {
  users: User[]
  userWorkloads: Map<string, { pending: number; completed: number; total: number }>
  loading?: boolean
}
```

## Test Scenarios

### 1. Component Import and Integration Tests

#### 1.1 Import Verification
- **Test**: Verify WorkloadChart is properly imported in unified page
- **Location**: Line 29 in `/src/app/dashboard/assignments/unified/page.tsx`
- **Expected**: Import statement exists and is correct
- **Status**: ✅ VERIFIED - `import { WorkloadChart } from '@/components/assignments/workload-chart'`

#### 1.2 Component Instantiation
- **Test**: Verify WorkloadChart is instantiated with correct props
- **Location**: Lines 343-347 in unified page
- **Expected**: Component receives users, userWorkloads, and loading props
- **Status**: ✅ VERIFIED - All required props are passed correctly

### 2. Props Validation Tests

#### 2.1 Required Props Test
```typescript
// Test Case: All required props provided
const validProps = {
  users: mockUsers,
  userWorkloads: mockWorkloads,
  loading: false
}
// Expected: Component renders without errors
```

#### 2.2 Optional Props Test
```typescript
// Test Case: Loading prop handling
const loadingProps = {
  users: [],
  userWorkloads: new Map(),
  loading: true
}
// Expected: Loading skeleton is displayed
```

### 3. Toggle Functionality Tests

#### 3.1 Toggle State Management
- **Test**: Verify clicking "Assigned" card toggles workload chart visibility
- **Location**: Lines 284-304 in unified page (Assigned card)
- **Mechanism**: `onClick={toggleWorkloadChart}` on lines 290
- **State**: `showWorkloadChart` state managed on lines 50-56
- **Expected**: 
  - Chart appears when `showWorkloadChart` is true
  - Chart disappears when `showWorkloadChart` is false
  - State persists in localStorage

#### 3.2 Toggle Persistence Test
```javascript
// Test Case: localStorage persistence
localStorage.setItem('show-workload-chart', 'true')
// Reload page
// Expected: Chart remains visible after page reload
```

### 4. Animation and Styling Tests

#### 4.1 CSS Animation Classes
- **Test**: Verify animation classes are applied correctly
- **Location**: Line 340 - `animate-in slide-in-from-top-2 duration-200`
- **Expected**: Smooth slide-in animation when chart appears

#### 4.2 Card Styling States
```css
/* Test Case: Card hover and active states */
.cursor-pointer.transition-all.hover:shadow-md.hover:border-primary/50
/* When showWorkloadChart is true */
.border-primary.shadow-md
```

### 5. Chart Rendering Tests

#### 5.1 Data Processing Test
```typescript
// Test Case: Chart data transformation
const chartData = users.map(user => {
  const workload = userWorkloads.get(user.id) || { pending: 0, completed: 0, total: 0 }
  return {
    name: user.name.split(' ')[0], // First name only
    fullName: user.name,
    pending: workload.pending,
    completed: workload.completed,
    total: workload.total,
    id: user.id
  }
}).sort((a, b) => b.pending - a.pending) // Sort by pending workload
```

#### 5.2 Statistics Calculation Test
```typescript
// Test Case: Workload statistics
const totalPending = chartData.reduce((sum, user) => sum + user.pending, 0)
const avgPending = users.length > 0 ? Math.round(totalPending / users.length) : 0
const maxPending = Math.max(...chartData.map(u => u.pending))
const overloadedUsers = chartData.filter(user => user.pending > avgPending * 1.5)
```

#### 5.3 Color Coding Test
```typescript
// Test Case: Bar color calculation
const getBarColor = (pending: number) => {
  if (pending > avgPending * 1.5) return COLORS.danger    // #ff6b6b
  if (pending > avgPending * 1.2) return COLORS.warning   // #ffc658
  return COLORS.normal                                     // #8884d8
}
```

### 6. Edge Cases and Error Handling

#### 6.1 Empty Data Tests

##### 6.1.1 No Users
```typescript
// Test Case: Empty users array
const emptyUsersProps = {
  users: [],
  userWorkloads: new Map(),
  loading: false
}
// Expected: Component renders with empty chart, no crashes
```

##### 6.1.2 No Workload Data
```typescript
// Test Case: Empty workloads Map
const noWorkloadProps = {
  users: mockUsers,
  userWorkloads: new Map(),
  loading: false
}
// Expected: Users shown with 0 pending/completed items
```

##### 6.1.3 Partial Workload Data
```typescript
// Test Case: Some users missing from workloads
const partialWorkloadProps = {
  users: [user1, user2, user3],
  userWorkloads: new Map([
    [user1.id, { pending: 5, completed: 2, total: 7 }],
    // user2 and user3 missing from workloads
  ]),
  loading: false
}
// Expected: Missing users default to 0 values, no crashes
```

#### 6.2 Data Integrity Tests

##### 6.2.1 Invalid User Names
```typescript
// Test Case: Users with null/undefined names
const invalidNameUsers = [
  { id: '1', name: null },
  { id: '2', name: undefined },
  { id: '3', name: '' },
  { id: '4', name: 'Valid Name' }
]
// Expected: Component handles gracefully, uses fallback or skips invalid entries
```

##### 6.2.2 Negative Workload Values
```typescript
// Test Case: Negative workload numbers
const negativeWorkloads = new Map([
  ['user1', { pending: -5, completed: -2, total: -7 }]
])
// Expected: Component handles gracefully, possibly shows 0 or absolute values
```

### 7. Responsiveness Tests

#### 7.1 Container Sizing
- **Test**: Chart adapts to different container sizes
- **Component**: `ResponsiveContainer width="100%" height="100%"`
- **Expected**: Chart scales properly on different screen sizes

#### 7.2 Chart Elements Responsiveness
```typescript
// Test Case: Chart responsive elements
<XAxis 
  dataKey="name" 
  tick={{ fontSize: 12 }}
  interval={0}
  angle={-45}
  textAnchor="end"
  height={50}
/>
```

### 8. Internationalization Tests

#### 8.1 Translation Keys Test
```typescript
// Test Case: All translation keys exist and work
const requiredTranslations = [
  'assignments.workloadDistribution',
  'assignments.averageLoad',
  'assignments.itemsPerUser',
  'assignments.overloaded',
  'assignments.maxLoad',
  'assignments.pendingItems',
  'assignments.pending',
  'assignments.completed',
  'assignments.normalLoad',
  'assignments.highLoad'
]
// Expected: All translations resolve correctly
```

## Manual Testing Checklist

### Pre-Testing Setup
- [ ] Ensure test environment has users with varying workloads
- [ ] Clear localStorage before each test session
- [ ] Have browser dev tools open to monitor console errors

### Basic Functionality Tests
- [ ] Navigate to assignments unified page
- [ ] Verify WorkloadChart is not visible initially (unless localStorage has it enabled)
- [ ] Click on "Assigned" card with chart icon
- [ ] Verify chart appears with smooth animation
- [ ] Click "Assigned" card again to hide chart
- [ ] Verify chart disappears
- [ ] Refresh page and verify state persists

### Data Visualization Tests
- [ ] Verify users are displayed on X-axis (first names only)
- [ ] Verify pending items are shown as bars
- [ ] Verify bars are colored correctly (normal/warning/danger)
- [ ] Hover over bars and verify tooltip shows full name and data
- [ ] Verify statistics at top (average load, overloaded users)
- [ ] Verify legend shows correct colors and labels

### Edge Case Manual Tests
- [ ] Test with no users assigned any items
- [ ] Test with all users having equal workloads
- [ ] Test with one user heavily overloaded
- [ ] Test after changing user filters (verify chart updates)
- [ ] Test with loading state (should show skeleton)

### Responsive Design Tests
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify chart scales appropriately
- [ ] Verify text remains readable at all sizes

### Browser Compatibility Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Automated Test Scenarios

### Unit Tests (Jest + React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkloadChart } from '@/components/assignments/workload-chart'

describe('WorkloadChart', () => {
  const mockUsers = [
    { id: '1', name: 'John Doe', role: 'VP' },
    { id: '2', name: 'Jane Smith', role: 'VPP' }
  ]

  const mockWorkloads = new Map([
    ['1', { pending: 5, completed: 3, total: 8 }],
    ['2', { pending: 2, completed: 1, total: 3 }]
  ])

  test('renders without crashing with valid props', () => {
    render(
      <WorkloadChart 
        users={mockUsers} 
        userWorkloads={mockWorkloads} 
        loading={false} 
      />
    )
    expect(screen.getByText('assignments.workloadDistribution')).toBeInTheDocument()
  })

  test('shows loading skeleton when loading prop is true', () => {
    render(
      <WorkloadChart 
        users={[]} 
        userWorkloads={new Map()} 
        loading={true} 
      />
    )
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  test('handles empty users array gracefully', () => {
    render(
      <WorkloadChart 
        users={[]} 
        userWorkloads={new Map()} 
        loading={false} 
      />
    )
    // Should not crash and should show empty state
    expect(screen.getByText('assignments.averageLoad')).toBeInTheDocument()
  })

  test('calculates statistics correctly', () => {
    render(
      <WorkloadChart 
        users={mockUsers} 
        userWorkloads={mockWorkloads} 
        loading={false} 
      />
    )
    // Average should be (5 + 2) / 2 = 3.5 rounded to 4
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
describe('WorkloadChart Integration', () => {
  test('integrates correctly with unified page', () => {
    // Mock the useAssignmentsData hook
    const mockData = {
      users: mockUsers,
      userWorkloads: mockWorkloads,
      loading: false
    }
    
    render(<UnifiedAssignmentsPage />)
    
    // Chart should not be visible initially
    expect(screen.queryByText('assignments.workloadDistribution')).not.toBeInTheDocument()
    
    // Click assigned card
    fireEvent.click(screen.getByText('assignments.assigned'))
    
    // Chart should now be visible
    expect(screen.getByText('assignments.workloadDistribution')).toBeInTheDocument()
  })
})
```

## Performance Tests

### Rendering Performance
```typescript
describe('WorkloadChart Performance', () => {
  test('renders efficiently with large datasets', () => {
    const largeUserSet = Array.from({ length: 100 }, (_, i) => ({
      id: `user-${i}`,
      name: `User ${i}`,
      role: 'VP'
    }))
    
    const largeWorkloadSet = new Map(
      largeUserSet.map(user => [
        user.id, 
        { pending: Math.floor(Math.random() * 20), completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 30) }
      ])
    )

    const startTime = performance.now()
    render(
      <WorkloadChart 
        users={largeUserSet} 
        userWorkloads={largeWorkloadSet} 
        loading={false} 
      />
    )
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(1000) // Should render within 1 second
  })
})
```

## Error Scenarios

### 1. Network/API Errors
- **Test**: Component behavior when userWorkloads data fails to load
- **Expected**: Component shows empty state or error message, doesn't crash

### 2. Memory Leaks
- **Test**: Component cleanup when unmounted
- **Expected**: No memory leaks, event listeners cleaned up

### 3. Recharts Errors
- **Test**: Handle Recharts library errors gracefully
- **Expected**: Fallback UI or error boundary catches issues

## Test Execution Priority

### Critical (Must Pass)
1. Component renders without crashing
2. Toggle functionality works correctly
3. Props are passed and processed correctly
4. Basic chart rendering works

### High (Should Pass)
1. Edge cases (empty data) handled gracefully
2. Statistics calculations are correct
3. Color coding works properly
4. Animations function correctly

### Medium (Nice to Have)
1. Performance with large datasets
2. All browser compatibility
3. Advanced responsive design features

## Success Criteria

### Functional Success
- [ ] Component never crashes under any test scenario
- [ ] Toggle functionality works reliably
- [ ] Chart displays accurate data
- [ ] All edge cases handled gracefully

### Performance Success
- [ ] Initial render time < 500ms
- [ ] Smooth animations (60fps)
- [ ] Memory usage remains stable
- [ ] Works with up to 100 users without performance degradation

### User Experience Success
- [ ] Chart is visually appealing and readable
- [ ] Interactions are intuitive
- [ ] Loading states provide good feedback
- [ ] Error states are informative

## Conclusion

This comprehensive test plan covers all critical aspects of the WorkloadChart component:

1. **Import and Integration**: Verified correct integration with the unified page
2. **Props Validation**: Ensures all props are handled correctly
3. **Toggle Functionality**: Tests the core interaction feature
4. **Data Processing**: Validates chart data transformation and statistics
5. **Edge Cases**: Covers empty data, invalid data, and error scenarios
6. **Performance**: Ensures the component scales well
7. **User Experience**: Validates animations, responsiveness, and accessibility

The test plan provides both automated test scenarios and manual testing checklists to ensure comprehensive coverage. Following this plan will help ensure the WorkloadChart component is stable, performant, and provides a great user experience.