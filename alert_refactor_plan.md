# Alert Refactor Plan: Converting Native Alerts to Callback-Based Radix UI Dialogs

## Problem Statement
The current implementation of `showAlert()` in `TracklessVideoEditor.js` does not replicate the synchronous behavior of native `alert()` calls. Native `alert()` pausing execution until the user clicks "OK" is critical for the proper flow of many functions, but the current Radix UI implementation allows code to continue running immediately after the dialog is displayed.

## Goal
Refactor all `showAlert()` calls to properly implement a callback-based pattern that mimics the pause-and-resume behavior of native alerts:
- Action start chunk executes
- Show dialog appears
- Action continue chunk executes only when user closes dialog (via onClick callback)

## Implementation Approach

### Step 1: Identify Critical Functions
Functions where the flow is critical - those that had `alert()` calls in the middle of execution logic, particularly where validation, error handling, or sequential operations depend on user acknowledging the message.

### Step 2: Split Functions Using Callback Pattern
Convert functions from this pattern:
```javascript
// BEFORE (with native alert)
const exampleFunction = () => {
  // Action start chunk
  console.log("Before alert");
  
  alert("This is a message"); // Pauses execution
  
  // Action continue chunk - only runs after user closes alert
  console.log("After alert");
};
```

To this pattern:
```javascript
// AFTER (with callback-based showAlert)
const exampleFunction = () => {
  // Action start chunk
  console.log("Before alert");
  
  // Show dialog with callback for remaining code
  showAlert("This is a message", "Title", () => {
    // Action continue chunk - only executes when user closes dialog
    console.log("After alert");
  });
};
```

### Step 3: Function-Specific Refactors

#### A. Validation-Based Alerts
Functions that validate conditions and then continue:
- Currently: Check condition → Show alert → Continue if condition met
- Should become: Check condition → Show alert with callback → Continue in callback if condition is still valid

#### B. Sequential Operation Alerts
Functions that perform operations in sequence:
- Currently: Op 1 → Alert message → Op 2
- Should become: Op 1 → Alert with callback → Op 2 in callback

#### C. Error Handling Alerts
Functions that show error messages before cleanup or return:
- Currently: Try operation → Catch error → Show alert → Return/Continue
- Should become: Try operation → Catch error → Show alert with callback → Return/Continue in callback

### Step 4: Update Affected Functions

#### Priority 1: Core Video Operations
- `handlePickFromDevice()` - Contains alerts that affect the flow of video selection
- `createChillinProject()` - Contains alerts that affect render job flow  
- `handleAddAudioToVideo()` - Contains alerts affecting audio track flow

#### Priority 2: Template Management
- `createCustomTemplate()` - Has alerts that affect template creation flow
- `handleCreateCustomTemplate()` - Validation flow depends on alerts
- `editCustomTemplate()` - Edit flow validation depends on alerts

#### Priority 3: Rendering & Project Creation
- `sendTestJobToChillin()` - Critical render job flow
- `handleGetRenderResult()` - Result handling flow
- `showChillinPreview()` - Preview generation flow

#### Priority 4: User Interactions
- `handleVideoSelectionFlow()` - Video selection flow
- `handleInOutPoints()` - In/out point flow
- `openVolumeDialog()` - Volume adjustment flow

### Step 5: Maintain Consistency
- Update all functions to use the same callback pattern
- Ensure that no execution continues past an alert when it previously would have paused
- Test that user interactions properly chain through the callbacks

### Step 6: Testing Strategy
- Verify that each refactored function waits for user to close dialog before continuing
- Ensure that all user flows still work as expected
- Confirm no race conditions or unexpected behaviors are introduced

## Risks & Considerations
1. **Breaking Change Risk**: Changing execution flow can affect dependent functions
2. **Complex Nesting**: Multiple sequential alerts may lead to deeply nested callbacks
3. **Async Behavior**: Need to ensure proper state management across callback boundaries
4. **UX Consistency**: Maintain intuitive user experience despite pattern changes

## Timeline
- Phase 1: Refactor Priority 1 functions (Day 1)
- Phase 2: Refactor Priority 2 functions (Day 2)  
- Phase 3: Refactor Priority 3 & 4 functions (Day 3)
- Phase 4: Integration testing (Day 4)

## Success Criteria
- All functions properly pause execution until user acknowledges dialog
- No code executes prematurely before user confirms dialog
- User experience remains intuitive and predictable
- All existing functionality preserved with proper execution flow