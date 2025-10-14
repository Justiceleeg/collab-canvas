# PR #5 Testing Guide: Firestore Sync Infrastructure

This guide provides comprehensive testing instructions for PR #5 - Firestore Sync Infrastructure.

## 🎯 What We're Testing

This PR implements real-time bidirectional sync between the canvas and Firestore with:
- ✅ Real-time onSnapshot listeners
- ✅ Optimistic updates
- ✅ Error handling and reconnection
- ✅ Loading and error states
- ✅ Persistence on reload
- ✅ Batch operations
- ✅ Transaction support for locking

---

## 📋 Pre-Testing Checklist

Before you begin testing, ensure:

- [ ] Firebase project is created and configured
- [ ] Firestore is enabled in Firebase console
- [ ] `.env.local` file has all required Firebase config variables
- [ ] Firestore rules are deployed (`firebase deploy --only firestore:rules`)
- [ ] Application runs without errors (`pnpm dev`)
- [ ] You can log in successfully

---

## 🧪 Test Scenarios

### Test 1: Initial Load & Empty Canvas

**Purpose:** Verify canvas loads correctly and handles empty state

**Steps:**
1. Start the app: `pnpm dev`
2. Log in with your credentials
3. Navigate to `/canvas`

**Expected Results:**
- ✅ Loading spinner appears briefly
- ✅ Canvas loads successfully
- ✅ "Canvas is ready!" message appears (if no objects)
- ✅ Sync indicator shows green dot (connected)
- ✅ No console errors

**Console Check:**
```
Look for: "Setting up Firestore subscription..."
Look for: "Received X objects from Firestore"
```

---

### Test 2: Create Objects (Using Test Panel)

**Purpose:** Verify objects can be created and synced to Firestore

**Steps:**
1. On the canvas page, click "🧪 Test Tools" button (bottom-right)
2. Click "+ 5 Rectangles"
3. Wait for confirmation message
4. Check the canvas

**Expected Results:**
- ✅ "✅ Created 5 test rectangles" message appears
- ✅ Object count increases in viewport info panel
- ✅ Console shows Firestore writes

**Console Check:**
```
No errors should appear
```

**Firebase Console Check:**
1. Go to Firebase Console → Firestore Database
2. Open `canvasObjects` collection
3. Verify 5 documents were created
4. Check document structure has all required fields:
   - `id`, `type`, `x`, `y`, `width`, `height`, `color`, `zIndex`
   - `createdAt`, `updatedAt`, `lastUpdatedBy`
   - `lockedBy` (should be null), `lockedAt` (should be null)

---

### Test 3: Real-Time Sync (Multi-Tab)

**Purpose:** Verify changes sync in real-time across multiple clients

**Steps:**
1. Open the canvas page in Tab A
2. Open the canvas page in Tab B (or incognito window)
3. Log in with the SAME user in both tabs
4. In Tab A, click "+ 10 Mixed Objects" in test panel
5. Watch Tab B

**Expected Results:**
- ✅ Objects appear in Tab B within 1-2 seconds
- ✅ Object count updates in both tabs
- ✅ No console errors in either tab

**Timing Check:**
- Sync latency should be < 2 seconds
- Ideally < 500ms on good connection

---

### Test 4: Persistence on Reload

**Purpose:** Verify canvas state persists after page reload

**Steps:**
1. Create 10+ objects using test panel
2. Note the object count
3. Refresh the page (Cmd+R or F5)
4. Wait for canvas to load

**Expected Results:**
- ✅ Loading spinner appears
- ✅ All objects reappear after load
- ✅ Object count matches pre-refresh count
- ✅ No duplicate objects

**Console Check:**
```
Look for: "Setting up Firestore subscription..."
Look for: "Received X objects from Firestore"
```

---

### Test 5: Error Handling (Network Disconnect)

**Purpose:** Verify app handles network disconnection gracefully

**Steps:**
1. Load canvas with some objects
2. Open Chrome DevTools → Network tab
3. Check "Offline" to simulate network loss
4. Wait 2-3 seconds
5. Uncheck "Offline" to restore connection

**Expected Results:**
- ✅ When offline: Yellow "Reconnecting..." banner appears
- ✅ Sync indicator turns yellow
- ✅ Console shows "Network connection lost"
- ✅ When online: Banner disappears
- ✅ Sync indicator turns green
- ✅ Console shows "Network connection restored, reconnecting to Firestore..."
- ✅ Canvas re-syncs automatically

---

### Test 6: Optimistic Updates

**Purpose:** Verify optimistic updates provide instant feedback

**Steps:**
1. Open browser DevTools → Network tab
2. Throttle network to "Slow 3G"
3. Click "+ 5 Rectangles" in test panel
4. Observe the object count

**Expected Results:**
- ✅ Object count increases immediately (optimistically)
- ✅ Canvas doesn't feel slow despite network throttle
- ✅ Objects eventually sync to Firestore

**Note:** Objects may briefly have temporary IDs starting with `temp-`

---

### Test 7: Delete Operations

**Purpose:** Verify objects can be deleted and sync properly

**Steps:**
1. Create 20 objects using test panel
2. Note the count
3. Click "🗑️ Clear All Objects"
4. Confirm the dialog
5. Watch the canvas

**Expected Results:**
- ✅ Confirmation message appears
- ✅ All objects disappear from canvas
- ✅ Object count becomes 0
- ✅ In multi-tab: Objects disappear from other tabs too

**Firebase Check:**
- `canvasObjects` collection should be empty

---

### Test 8: Batch Operations Performance

**Purpose:** Verify batch operations are efficient

**Steps:**
1. Clear all existing objects
2. Click "🔥 Stress Test (100 objects)"
3. Confirm the dialog
4. Watch the console and canvas

**Expected Results:**
- ✅ Success message shows completion time
- ✅ 100 objects appear on canvas
- ✅ Time to create should be < 5 seconds
- ✅ Canvas remains responsive (no freezing)

**Console Check:**
```
Look for: "✅ Stress test complete: 100 objects in XXXms"
```

**Performance Check:**
- Creation time < 5000ms is good
- Creation time < 2000ms is excellent
- Canvas should maintain ~60 FPS (check viewport info)

---

### Test 9: Multiple Users (Different Accounts)

**Purpose:** Verify sync works across different user accounts

**Steps:**
1. Open canvas in Browser A, log in as User A
2. Open canvas in Browser B, log in as User B
3. In Browser A, create 5 rectangles
4. Watch Browser B

**Expected Results:**
- ✅ Objects created by User A appear in Browser B
- ✅ `lastUpdatedBy` field in Firestore shows User A's UID
- ✅ Both users see the same canvas state

**Collaboration Check:**
- This verifies the foundation for multiplayer editing

---

### Test 10: Error Recovery (Manual Retry)

**Purpose:** Verify manual retry works when auto-reconnect fails

**Steps:**
1. Load canvas normally
2. Go to Firebase Console
3. Temporarily disable Firestore (or modify rules to deny reads)
4. Reload the canvas page
5. Wait for error screen to appear
6. Click "Retry Connection"

**Expected Results:**
- ✅ Error screen appears with error message
- ✅ "Retry Connection" button is visible
- ✅ Clicking retry attempts reconnection
- ✅ (After fixing Firebase): Connection succeeds

---

## 🔍 Detailed Console Monitoring

### Expected Console Logs

**On Initial Load:**
```
Setting up Firestore subscription...
Received X objects from Firestore
```

**When Objects Are Created:**
```
Creating canvas object...
(no errors)
```

**When Connection Issues Occur:**
```
Firestore subscription error: [error details]
Will retry connection in XXXms...
```

**When Connection Restored:**
```
Network connection restored, reconnecting to Firestore...
Setting up Firestore subscription...
Received X objects from Firestore
```

### Errors to Watch For

❌ **Bad:** Continuous reconnection attempts without success
- Check Firebase config
- Verify Firestore rules allow reads

❌ **Bad:** "Permission denied" errors
- Check Firestore rules
- Verify user is authenticated

❌ **Bad:** Objects duplicating on each sync
- This should NOT happen
- If it does, there's a bug in the sync logic

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Initial load time | < 2 seconds | Time from page load to canvas ready |
| Object sync latency | < 500ms | Time from create to appear in other tab |
| Batch create (100 objects) | < 5 seconds | Use stress test in test panel |
| FPS with 100+ objects | ~60 FPS | Check viewport info panel |
| Reconnection time | < 3 seconds | Time to reconnect after going offline |

### How to Measure Performance

1. **FPS:** Displayed in viewport info panel (bottom-right)
2. **Sync Latency:** Use browser DevTools → Performance tab
3. **Load Time:** Check Network tab → DOMContentLoaded

---

## 🐛 Common Issues & Solutions

### Issue: "Permission denied" errors

**Solution:**
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Verify rules in Firebase Console
# Should allow authenticated users to read/write canvasObjects
```

### Issue: Objects not syncing between tabs

**Solution:**
1. Check both tabs are using same Firebase project
2. Verify environment variables are correct
3. Clear browser cache and reload
4. Check Firebase Console for quota limits

### Issue: Loading spinner never disappears

**Solution:**
1. Check console for errors
2. Verify Firestore is enabled in Firebase Console
3. Check network tab for failed requests
4. Verify authentication is working

### Issue: "Cannot read property of undefined" errors

**Solution:**
- User might not be authenticated
- Check AuthGuard is working
- Verify Firebase Auth is initialized

---

## ✅ Success Criteria

All tests must pass for PR #5 to be considered complete:

- [ ] Test 1: Initial load works
- [ ] Test 2: Objects can be created
- [ ] Test 3: Real-time sync works across tabs
- [ ] Test 4: State persists on reload
- [ ] Test 5: Network errors handled gracefully
- [ ] Test 6: Optimistic updates provide instant feedback
- [ ] Test 7: Delete operations work
- [ ] Test 8: Batch operations perform well (< 5s for 100 objects)
- [ ] Test 9: Multi-user sync works
- [ ] Test 10: Manual retry works

**Additional Requirements:**
- [ ] No console errors during normal operation
- [ ] No memory leaks (check DevTools → Memory)
- [ ] FPS stays above 50 during interactions
- [ ] Firestore read/write counts are reasonable (not excessive)

---

## 🚀 Quick Test Script

For rapid testing, follow this sequence:

```bash
# 1. Start app
pnpm dev

# 2. Open two browser windows side-by-side

# 3. In Window 1:
#    - Log in
#    - Go to /canvas
#    - Open test panel
#    - Click "+ 10 Mixed Objects"

# 4. In Window 2:
#    - Log in (same user)
#    - Go to /canvas
#    - Verify objects appear

# 5. In Window 1:
#    - Click "Clear All Objects"

# 6. In Window 2:
#    - Verify objects disappear

# 7. In both windows:
#    - Refresh (Cmd+R)
#    - Verify empty canvas loads

# 8. In Window 1:
#    - Create 100 objects (stress test)
#    - Check performance

# ✅ If all steps work, PR #5 is ready!
```

---

## 📝 Testing Notes Template

Use this template to document your test results:

```markdown
## PR #5 Test Results

**Tester:** [Your Name]
**Date:** [Date]
**Environment:** [Local/Staging/Production]
**Browser:** [Chrome/Firefox/Safari]
**Firebase Project:** [Project ID]

### Test Results

- [ ] Test 1: Initial Load - PASS/FAIL
- [ ] Test 2: Create Objects - PASS/FAIL
- [ ] Test 3: Real-Time Sync - PASS/FAIL
- [ ] Test 4: Persistence - PASS/FAIL
- [ ] Test 5: Error Handling - PASS/FAIL
- [ ] Test 6: Optimistic Updates - PASS/FAIL
- [ ] Test 7: Delete Operations - PASS/FAIL
- [ ] Test 8: Batch Performance - PASS/FAIL (Time: XXXms)
- [ ] Test 9: Multi-User - PASS/FAIL
- [ ] Test 10: Manual Retry - PASS/FAIL

### Performance Metrics

- Initial Load: XXX ms
- Sync Latency: XXX ms
- Batch Create (100): XXX ms
- FPS with 100 objects: XX FPS

### Issues Found

[List any issues discovered]

### Notes

[Any additional observations]
```

---

## 🔗 Related Files

Files modified/created in PR #5:
- `services/firestore.service.ts` - Firestore CRUD operations
- `hooks/useFirestore.ts` - Sync hooks
- `store/canvasStore.ts` - Enhanced with sync state
- `components/Canvas/Canvas.tsx` - Loading/error states
- `utils/testHelpers.ts` - Testing utilities
- `components/DevTools/TestPanel.tsx` - Test UI

---

## 🎓 What to Look For

### Good Signs ✅
- Objects appear instantly in UI (optimistic)
- Sync happens within 1-2 seconds
- No console errors
- Smooth reconnection on network issues
- Canvas stays responsive with 100+ objects

### Red Flags ❌
- "Permission denied" errors
- Objects duplicating
- Infinite retry loops
- Memory leaks (RAM keeps increasing)
- FPS drops below 30
- Sync takes > 5 seconds

---

## 📞 Need Help?

If tests are failing:
1. Check console for error messages
2. Verify Firebase configuration
3. Check Firestore rules
4. Review network tab for failed requests
5. Ensure authentication is working

---

**Ready to test? Start with Test 1 and work your way through!** 🚀

