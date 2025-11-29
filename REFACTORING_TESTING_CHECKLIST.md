# Testing Checklist for Refactored TracklessVideoEditor

## Pre-Testing Setup
- [ ] All 4 custom hooks are present in `src/hooks/`:
  - [ ] `useDialogManager.js`
  - [ ] `useTemplateManagement.js`
  - [ ] `useVideoHandling.js`
  - [ ] `useChillinAPI.js`
- [ ] Environment variables are set:
  - [ ] `REACT_APP_CHILLIN`
  - [ ] `REACT_APP_API_VIDEO_KEY` (if needed)
- [ ] All dependencies are installed (`npm install`)

## Tab 1: Templates Tab

### Custom Template Creation
- [ ] Click "Create Custom Template" button
- [ ] Enter template name
- [ ] Set number of required videos
- [ ] Template is saved and appears in the list
- [ ] Template persists after page reload (localStorage)

### Create from Current
- [ ] Select a template
- [ ] Add videos
- [ ] Click "Create from Current"
- [ ] Enter name
- [ ] New template is created with current video configuration

### Template Editing
- [ ] Click "Edit" on a template
- [ ] Change template name
- [ ] Save changes
- [ ] Verify changes are reflected
- [ ] Verify changes persist after reload

### Template Deletion
- [ ] Click "Delete" on a template
- [ ] Confirm deletion
- [ ] Template is removed from list
- [ ] Deletion persists after reload

## Tab 2: Videos Tab

### Video Selection
- [ ] Click "Add Video"
- [ ] Select video file from device
- [ ] Video appears in the list
- [ ] Video details are displayed (name, duration)

### In/Out Points
- [ ] Click "Set In/Out Points" on a video
- [ ] Dialog opens with sliders
- [ ] Adjust in and out points
- [ ] Save points
- [ ] Verify points are reflected in video list

### Audio Management
- [ ] Click "Add Audio" on a video
- [ ] Select audio file
- [ ] Audio is attached to video
- [ ] "Remove Audio" button appears
- [ ] Click "Remove Audio"
- [ ] Audio is removed successfully

### Video Replacement
- [ ] Click "Replace" on a video
- [ ] Select new video file
- [ ] Original video is replaced
- [ ] Video order is maintained

### Video Removal
- [ ] Click "Remove" on a video
- [ ] Video is removed from list
- [ ] Remaining videos maintain correct order

### Preview Generation
- [ ] Add required number of videos for template
- [ ] Click "Preview" button
- [ ] Preview dialog opens
- [ ] Video preview plays correctly
- [ ] All videos are sequenced correctly

## Tab 3: Render Jobs Tab

### Send to Renderer
- [ ] Add videos
- [ ] Click "Send to Renderer"
- [ ] Confirmation dialog appears
- [ ] Confirm submission
- [ ] Render job is created
- [ ] Job appears in render jobs list
- [ ] Job persists after reload

### Test Job
- [ ] Click "Send Test Job"
- [ ] Test job is submitted
- [ ] Success message is shown
- [ ] Test job appears in render jobs list (if tracked)

### Check Render Status
- [ ] Click "Check Status" on a render job
- [ ] Status is fetched from API
- [ ] Correct status is displayed:
  - [ ] "Pending" for in-progress renders
  - [ ] "Success" with download URL for completed renders
  - [ ] "Failed" for failed renders

### Download Completed Render
- [ ] Wait for render to complete (or use completed render)
- [ ] Click "Check Status"
- [ ] Download URL is displayed
- [ ] Click download link
- [ ] Video downloads successfully

## Tab 4: Management Tab

### Project Statistics
- [ ] Navigate to Management tab
- [ ] Verify correct template is displayed
- [ ] Verify correct video count is displayed
- [ ] Verify correct custom template count is displayed

### Clear All Videos
- [ ] Click "Clear All Videos"
- [ ] Confirm action
- [ ] All videos are removed
- [ ] Navigate to Videos tab
- [ ] Verify videos list is empty

### Clear All Templates
- [ ] Click "Clear All Templates"
- [ ] Confirm action
- [ ] All custom templates are removed
- [ ] Navigate to Templates tab
- [ ] Verify templates list is empty

### Clear Render History
- [ ] Click "Clear Render History"
- [ ] Confirm action
- [ ] All render jobs are removed
- [ ] Navigate to Renders tab
- [ ] Verify render jobs list is empty

## Dialog Testing

### Create Template Dialog
- [ ] Dialog opens correctly
- [ ] Template name input works
- [ ] Number of videos input works
- [ ] Cancel button closes dialog
- [ ] Create button creates template

### Create from Current Dialog
- [ ] Dialog opens correctly
- [ ] Template name input works
- [ ] Cancel button closes dialog
- [ ] Create button creates template

### Edit Template Dialog
- [ ] Dialog opens with current template data
- [ ] Name field is pre-filled
- [ ] Changes can be saved
- [ ] Cancel button discards changes

### Delete Template Dialog
- [ ] Dialog shows confirmation message
- [ ] Cancel button preserves template
- [ ] Delete button removes template

### In/Out Points Dialog
- [ ] Dialog opens with current points
- [ ] Sliders work correctly
- [ ] Number inputs work correctly
- [ ] Values sync between slider and input
- [ ] Save button applies changes
- [ ] Cancel button discards changes

## Error Handling

### Template Validation
- [ ] Empty template name shows error
- [ ] Duplicate template name shows error
- [ ] Invalid number of videos shows error

### Video Validation
- [ ] Adding too many videos shows error
- [ ] Invalid video file shows error

### API Errors
- [ ] Network errors are handled gracefully
- [ ] API errors show meaningful messages
- [ ] User can retry failed operations

## Performance

### Load Time
- [ ] Component loads quickly
- [ ] No noticeable lag when switching tabs
- [ ] Video list renders smoothly with many videos

### Memory Management
- [ ] Object URLs are cleaned up properly
- [ ] No memory leaks when adding/removing videos
- [ ] Browser memory usage remains stable

## Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Accessibility
- [ ] All buttons are keyboard accessible
- [ ] Tab navigation works correctly
- [ ] Dialogs can be closed with Escape key
- [ ] Screen reader announcements are appropriate

## Edge Cases

### Empty States
- [ ] Empty video list shows appropriate message
- [ ] Empty template list shows appropriate message
- [ ] Empty render jobs list shows appropriate message

### Boundary Conditions
- [ ] Maximum number of videos (10) works correctly
- [ ] Minimum number of videos (1) works correctly
- [ ] Very long template names are handled
- [ ] Very long video names are handled

### LocalStorage
- [ ] Works when localStorage is available
- [ ] Handles localStorage quota exceeded
- [ ] Handles corrupted localStorage data

## Notes Section
Use this section to record any bugs or issues found during testing:

```
Date: ___________
Tester: ___________

Issues Found:
1.
2.
3.

Additional Comments:


```
