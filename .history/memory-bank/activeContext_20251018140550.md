# Active Context - htwadmin

## Current Work Focus

### Immediate Priorities
- **Memory Bank Initialization**: Establishing comprehensive project documentation
- **Project Analysis**: Understanding current codebase state and architecture
- **Socket.io Architecture**: Implementing proven single-instance socket patterns
- **Code Modernization**: Updating incomplete components and dependencies

### Recent Changes
- **Memory Bank Creation**: Initializing project documentation system
- **Architecture Documentation**: Capturing Socket.io patterns from project.scope
- **Project Analysis**: Comprehensive review of current codebase structure
- **Technology Stack Documentation**: Recording current dependencies and setup

## Active Decisions and Considerations

### Socket.io Architecture Decisions
**Single Instance Principle**: Following established pattern from project.scope
- **Centralized Management**: Only one socket instance managed in Home.js
- **Props Distribution**: Socket operations passed as props to render components
- **Connection State Flow**: Clear authentication → connection → data loading sequence

### Component Architecture
- **Functional Components**: Modern React patterns with hooks
- **TypeScript Integration**: Gradual adoption with existing JavaScript components
- **Material-UI**: Consistent design system implementation
- **React Query**: State management for server data

### Authentication Flow
- **Firebase Integration**: Secure user authentication
- **JWT Token Management**: Automatic token handling for socket connections
- **Protected Routes**: Authentication-required access to admin features

## Important Patterns and Preferences

### Socket.io Event Naming Convention
- **English Names**: Consistent use of English for all events
- **Request/Response Pattern**: `listX` → `printX` event naming
- **Current Events**:
  - Paths: `listaSentieri` → `printSentieri`
  - Destinations: `listaDestinazioni` → `printDestinazioni`
  - Crossroads: `listCrossRoads` → `printCrossRoads`

### Edit Mode "Father State" Pattern
- **Dual State Management**: `currentMode` (internal) and `publicCurrentMode` (external) prevent race conditions
- **Coordinated Effect System**: Event handlers only set up when both mode changes AND layers are available
- **Event Handler Prevention**: `eventHandlersRef` tracks active handlers to prevent duplication
- **Layer Availability Coordination**: Monitors layer loading and retries setup when layers become available
- **Purpose**: Prevents event handler chaos, memory leaks, and inconsistent behavior

### Debugging Patterns
- **Rocket Logging**: `🚀 Component-->[action]: description` format
- **Critical Debug Points**:
  - Authentication: `HtWAppAuth-->[getIdToken]`
  - Socket Creation: `HtWSocketService-->[createSocket]`
  - Connection State: `HtWuseSocket-->[connect]`
  - Component Flow: `HtWRenderX-->[useEffect connectionState]`

### Code Organization
- **Component Structure**: Logical separation by functionality
- **Hook Patterns**: Custom hooks for complex logic
- **Service Layer**: Centralized API and socket services
- **Context Management**: AppStateContext for global state

## Learnings and Project Insights

### Socket.io Lessons Learned
1. **Multiple instances cause chaos**: Single socket instance is critical
2. **Event name mismatches break communication**: Consistency between client/server is essential
3. **Centralized management ensures stability**: Home.js as socket coordinator
4. **Comprehensive logging is essential**: Rocket pattern for debugging
5. **Props-based architecture prevents state confusion**: Avoid multiple useSocket calls

### Development Patterns
- **Conditional Rendering**: Show components only when `isConnected === true`
- **Error Recovery**: Automatic reconnection and graceful failure handling
- **Performance Optimization**: Single instance reduces resource usage
- **Memory Management**: Proper cleanup prevents memory leaks

### React Hooks Circular Dependency Rule
**Critical Learning**: When functions are defined in the same component, they don't need to be in each other's dependency arrays. The ESLint rule often incorrectly suggests adding them, but this creates circular dependencies that cause "can't access lexical declaration" errors.

**Rule**: Only include dependencies that:
- Are defined BEFORE the current hook
- Are from outside the component (props, context, etc.)
- Are stable references (useRef, useState setters)

**Example Problem**:
```javascript
// ❌ WRONG - creates circular dependency
const setupEventHandlers = useCallback((mode, handlers = {}) => {
  // ... logic using setupNormalModeHandlers, setupEditModeHandlers, etc.
}, [getMap, clearAllEventHandlers, setupNormalModeHandlers, setupEditModeHandlers, setupAutoSegmentHandlers]);
//                                  ↑ These functions don't exist yet when setupEventHandlers is created

// ✅ CORRECT - only include functions that exist at creation time
const setupEventHandlers = useCallback((mode, handlers = {}) => {
  // ... logic using setupNormalModeHandlers, setupEditModeHandlers, etc.
}, [getMap, clearAllEventHandlers]);
// Only include functions defined BEFORE setupEventHandlers
```

**Key Insight**: Functions defined in the same component are available through closure and don't need to be in dependency arrays. Adding them creates circular references that break JavaScript hoisting.

## Current Challenges

### Critical Functionality Issues
- **Hover Functionality Broken**: No hover effects on segments (sentieri), crossroads (incroci), or destinations (destinazioni) in NORMAL mode
- **Edit Mode Completely Non-functional**: Entire EDIT MODE system not working, affecting path creation and editing
- **Destinations/Crossroad Update Broken**: Since hover doesn't work, the update functionality for destinations and crossroads is also broken

### Root Causes Identified
- **Function Hoisting Issues**: Hover handlers defined after they're referenced in setupNormalModeHandlers
- **Event Handler Registration**: setupNormalModeHandlers may not be called properly due to timing issues
- **Layer Availability Coordination**: Coordinated effect system may not be triggering correctly
- **Dependency Issues**: Missing dependencies in useCallback hooks causing stale closures
- **React Hooks Circular Dependencies**: Functions defined in same component incorrectly added to dependency arrays, causing "can't access lexical declaration" errors

### Technical Debt
- **Incomplete Implementation**: Some components and features not fully implemented
- **Mixed JavaScript/TypeScript**: Gradual TypeScript adoption needed
- **Dependency Updates**: Some packages may need version updates
- **Testing Coverage**: Limited test implementation

### Architecture Gaps
- **Error Handling**: Need comprehensive error boundary implementation
- **Loading States**: Better user feedback during operations
- **Offline Support**: Handling connection loss scenarios
- **Data Validation**: Input validation and error reporting

## Next Steps

### Immediate Actions
1. **Complete Memory Bank**: Finish all core documentation files
2. **Code Review**: Systematic analysis of current implementation
3. **Socket Architecture Verification**: Ensure single instance pattern is followed
4. **Component Completion**: Identify and complete unfinished components

### Short-term Goals
- **Modernize Codebase**: Update to current React patterns
- **Enhance Error Handling**: Implement comprehensive error boundaries
- **Improve User Experience**: Better loading states and feedback
- **Add Testing**: Implement unit and integration tests

### Long-term Vision
- **Feature Completion**: Full path network management capabilities
- **Performance Optimization**: Enhanced map rendering and data handling
- **Mobile Responsive**: Improved mobile administration experience
- **Advanced Features**: Bulk operations, import/export, analytics

# Reference Context

## Reference Version
Working backup available at `../htwadmin.bck/`
- Documented in `memory-bank/referenceImplementation.md`
- Use for behavior reference, not structure
- Current project is structural revision of this backup
- Core functionalities should match backup behavior
