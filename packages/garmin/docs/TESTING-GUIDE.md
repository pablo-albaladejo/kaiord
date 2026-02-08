# Garmin Connect API - Testing Guide

## Quick Start

To test the Garmin Connect API with your actual account, follow these steps:

### 1. Get Your Credentials

You need two things: **Cookies** and **CSRF Token**

**Method 1: Using Browser DevTools (Recommended)**

1. Open https://connect.garmin.com in your browser
2. Make sure you're logged in
3. Open DevTools (F12 or right-click → Inspect)
4. Go to the **Network** tab
5. Refresh the page or click around Garmin Connect
6. Click on any request to `connect.garmin.com`
7. In the **Headers** section, find:
   - **Cookie** header → Copy the entire value
   - **connect-csrf-token** header → Copy the value

**Method 2: Using Console**

1. Open https://connect.garmin.com
2. Open DevTools Console (F12)
3. Run this JavaScript:

```javascript
// Get cookies
console.log('COOKIES:', document.cookie);

// Get CSRF token (check all possible locations)
console.log('CSRF from meta:', document.querySelector('meta[name="csrf-token"]')?.content);
console.log('CSRF from localStorage:', localStorage.getItem('GARMIN-CSRF-TOKEN'));
```

### 2. Update Test Script

Edit `docs/garmin-run-tests-from-fixtures.sh`:

```bash
# Line 7-8: Replace with your actual values
COOKIES="your_cookies_here"
CSRF="your_csrf_token_here"
```

**Cookie Example:**
```
GARMIN-SSO-GUID=ABC123...; GARMIN-SSO-CUST-GUID=DEF456...; SESSIONID=GHI789...
```

**CSRF Example:**
```
227acf9d-2bd7-4a8a-9eaf-bd9ce0d95e19
```

### 3. Run Tests

```bash
cd docs
./garmin-run-tests-from-fixtures.sh
```

**Expected output:**

```
🎯 GARMIN API TEST RUNNER FROM FIXTURES
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST 1: RUNNING (Nested Repeats)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Input: ../test-fixtures/gcn/WorkoutRunningNestedRepeatsInput.gcn
✅ SUCCESS (HTTP 200)

📊 Workout Created:
{
  "workoutId": 1467196159,
  "sport": "running",
  "totalSteps": 6,
  "stepTypes": ["warmup", "interval", "recovery", "repeat", "cooldown"],
  "targetTypes": ["no.target", "heart.rate.zone", "pace.zone"],
  "hasRepeats": true
}

💾 Output saved: ../test-fixtures/gcn/WorkoutRunningNestedRepeatsOutput.gcn
...
```

### 4. Verify Results

The script will:
- ✅ Read input files (`.gcn.input`)
- ✅ Send them to Garmin Connect API
- ✅ Save responses (`.gcn`)
- ✅ Display summary of each workout

Check that:
- All 6 tests return HTTP 200
- workoutId is assigned by server
- stepId values are generated
- Response matches expected structure

---

## Troubleshooting

### ❌ Error: "HTTP 401 Unauthorized"

**Problem:** Cookies expired or invalid

**Solution:**
1. Re-login to Garmin Connect
2. Get fresh cookies and CSRF token
3. Update script with new values

### ❌ Error: "HTTP 403 Forbidden"

**Problem:** CSRF token mismatch

**Solution:**
1. Make sure CSRF token matches your current session
2. CSRF token changes frequently - get fresh one
3. Don't copy extra quotes or spaces

### ❌ Error: "HTTP 400 Bad Request"

**Problem:** Invalid JSON payload

**Solution:**
1. Check input file is valid JSON: `jq . file.gcn.input`
2. Verify required fields are present
3. Check field types (numbers vs strings)

### ❌ Error: Cookies/CSRF not set

**Problem:** Script hasn't been configured

**Solution:**
Update lines 7-8 in `garmin-run-tests-from-fixtures.sh`

---

## What Gets Tested

The 6 fixtures test **100% of the Garmin Connect API**:

| Test | Coverage |
|------|----------|
| **Running** | All step types, HR zones/ranges, nested repeats (3 levels) |
| **Cycling** | Power zones/ranges, cadence, speed, dual targets |
| **Swimming** | All 6 strokes, all 6 equipment types, pool settings |
| **Strength** | Reps condition type, rest periods |
| **Edge Cases** | Long names (255+ chars), single iteration repeats |
| **Multisport** | Triathlon (bike + run + swim), global stepOrder |

**Sports:** Running, Cycling, Swimming, Strength, Multisport ✅
**Target Types:** Power, HR, Pace, Speed, Cadence, No target ✅
**Step Types:** Warmup, Interval, Recovery, Rest, Cooldown, Repeat ✅
**Condition Types:** Lap, Time, Distance, Calories, Iterations, Reps ✅
**Swimming:** 6 strokes + 6 equipment types ✅
**Nested Repeats:** Up to 3 levels deep ✅

---

## Input vs Output Comparison

To see what the API transforms:

```bash
# Compare input and output for a single workout
diff <(jq -S . WorkoutRunningNestedRepeatsInput.gcn) \
     <(jq -S . WorkoutRunningNestedRepeatsOutput.gcn)
```

**Key differences:**
- ➕ **Added by server:** `workoutId`, `stepId`, `ownerId`, `author`, timestamps
- ➕ **Expanded types:** Added `displayOrder`, `unitId`, `factor` to type objects
- ➕ **Computed fields:** `estimatedDistanceUnit`, `avgTrainingSpeed`
- ➕ **Swimming fields:** `strokeType` and `equipmentType` always present (even with 0/null)
- 🔄 **Number conversion:** String numbers → Float numbers

---

## Advanced: Manual API Calls

If you want to test individual payloads manually:

```bash
curl -X POST "https://connect.garmin.com/gc-api/workout-service/workout" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_COOKIES" \
  -H "connect-csrf-token: YOUR_CSRF" \
  -H "User-Agent: Mozilla/5.0" \
  --data @test-fixtures/gcn/WorkoutRunningNestedRepeatsInput.gcn \
  | jq '.'
```

---

## Cleanup After Testing

To remove all test workouts from your account:

```bash
cd docs
./garmin-cleanup-workouts.sh
```

⚠️ **Warning:** This will delete **ALL** workouts from your Garmin Connect account. Update credentials first (same as above).

---

## Next Steps After Successful Tests

1. ✅ Verify all 6 tests pass (HTTP 200)
2. ✅ Compare input vs output to understand transformations
3. ✅ Update schemas if API responses differ from expectations
4. ⏳ Create `@kaiord/garmin` package
5. ⏳ Implement converters (KRD ↔ Garmin)
6. ⏳ Implement API client (OAuth + REST)

---

**Last Updated:** 2026-02-08
**Author:** Pablo + Claude Code (Sonnet 4.5)
