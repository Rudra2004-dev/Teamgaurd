# Authorization Testing Guide: GET /api/users/:id

## Test Setup

**Prerequisites:**
1. Server running: `npm run dev`
2. At least 2 users exist in database:
   - User #1 (any role)
   - User #2 (any role)
3. At least 1 admin user exists

**Get test users:**
```bash
# Create test users (requires admin token)
# Or use existing users from database
```

---

## TEST 1: No Token → 401 Unauthorized ❌

**Purpose:** Verify authentication is required

**Command:**
```bash
curl -X GET http://localhost:5000/api/users/1 -v
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Expected Status:** `401 Unauthorized`

**What this proves:**
- ✓ Authentication middleware works
- ✓ Unauthenticated users cannot access endpoint
- ✓ Request is rejected before authorization check

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 2: Employee Accessing Own Profile → 200 OK ✓

**Purpose:** Verify users can view their own profile

**Step 1: Login as regular user**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@example.com",
    "password": "password123"
  }'
```

**Save the response:**
- Copy `token` (JWT access token)
- Copy `userId` from decoded token or from login response
- Let's assume userId = 5

**Step 2: Access own profile**
```bash
curl -X GET http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": 5,
    "name": "Employee User",
    "email": "employee@example.com",
    "role": "EMPLOYEE",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Expected Status:** `200 OK`

**What to verify:**
- ✓ Response contains user data
- ✓ Response does NOT contain `password` field
- ✓ User can access their own profile
- ✓ Ownership check works

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 3: Employee Accessing Another User's Profile → 403 Forbidden ❌

**Purpose:** Verify non-admins cannot view other users

**Using the same token from TEST 2:**
```bash
curl -X GET http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Expected Status:** `403 Forbidden`

**What this proves:**
- ✓ Authorization check works
- ✓ Non-admins cannot view other users
- ✓ Ownership check prevents unauthorized access
- ✓ Returns 403 (not 404) - proper status code

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 4: Admin Accessing Another User's Profile → 200 OK ✓

**Purpose:** Verify admins can view any user

**Step 1: Login as admin**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpass123"
  }'
```

**Save the admin token**

**Step 2: Create admin user (if you don't have one):**
```bash
# First, you need to manually update a user's role in the database
# OR use the createUser endpoint with an existing admin token
```

**Step 3: Access another user's profile**
```bash
curl -X GET http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": 5,
    "name": "Employee User",
    "email": "employee@example.com",
    "role": "EMPLOYEE",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Expected Status:** `200 OK`

**What this proves:**
- ✓ Admin role check works
- ✓ Admins can view any user
- ✓ Role-based authorization works
- ✓ Password is still filtered from response

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 5: Authorized Request for Nonexistent User → 404 Not Found ❌

**Purpose:** Verify proper 404 handling for authorized users

**Using admin token:**
```bash
curl -X GET http://localhost:5000/api/users/99999 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Expected Status:** `404 Not Found`

**What this proves:**
- ✓ Database query happens after authorization
- ✓ Proper 404 for non-existent resources
- ✓ Authorized users get meaningful error messages

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 6: Invalid Token → 401 Unauthorized ❌

**Purpose:** Verify invalid tokens are rejected

**Command:**
```bash
curl -X GET http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer invalid-token-12345"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Expected Status:** `401 Unauthorized`

**What this proves:**
- ✓ JWT verification works
- ✓ Invalid tokens are rejected
- ✓ Returns 401 (authentication failure)

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 7: Expired Token → 401 Unauthorized ❌

**Purpose:** Verify expired tokens are rejected

**Steps:**
1. Get a token
2. Wait 15+ minutes (token expires)
3. Try to use it

**Command:**
```bash
curl -X GET http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer YOUR_EXPIRED_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Expected Status:** `401 Unauthorized`

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 8: SUPER_ADMIN Can View Any User → 200 OK ✓

**Purpose:** Verify SUPER_ADMIN role works

**Using SUPER_ADMIN token:**
```bash
curl -X GET http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN"
```

**Expected Status:** `200 OK`

**What this proves:**
- ✓ SUPER_ADMIN role is recognized
- ✓ Both ADMIN and SUPER_ADMIN have admin privileges

**Result:** [ ] PASS / [ ] FAIL

---

## TEST 9: Manager Accessing Another User → 403 Forbidden ❌

**Purpose:** Verify MANAGER role doesn't have user view permissions

**Using MANAGER token:**
```bash
curl -X GET http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN"
```

**Expected Status:** `403 Forbidden`

**What this proves:**
- ✓ Only ADMIN/SUPER_ADMIN have admin privileges
- ✓ MANAGER is treated as regular user for profile viewing

**Result:** [ ] PASS / [ ] FAIL

---

## Password Field Verification Checklist

For ALL successful (200) responses, verify:

- [ ] Response contains `id`
- [ ] Response contains `name`
- [ ] Response contains `email`
- [ ] Response contains `role`
- [ ] Response contains `emailVerified`
- [ ] Response contains `createdAt`
- [ ] Response contains `updatedAt`
- [ ] Response does NOT contain `password`
- [ ] Response does NOT contain `password` field even as `null`

---

## Security Verification Summary

| Test | Purpose | Expected | Status |
|------|---------|----------|--------|
| No token | Auth required | 401 | [ ] |
| Own profile | Ownership works | 200 | [ ] |
| Other user (employee) | Authorization blocks | 403 | [ ] |
| Other user (admin) | Admin can view | 200 | [ ] |
| Non-existent user | Proper 404 | 404 | [ ] |
| Invalid token | Token validation | 401 | [ ] |
| Expired token | Expiration works | 401 | [ ] |
| SUPER_ADMIN | Role works | 200 | [ ] |
| Manager | No special access | 403 | [ ] |
| Password absent | No leaks | N/A | [ ] |

---

## Status Code Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | Success | Authorized user found |
| 401 | Unauthorized | No token / invalid token / expired token |
| 403 | Forbidden | Valid token but not allowed to view this resource |
| 404 | Not Found | Authorized user requesting non-existent resource |

---

## Testing with Postman

### Collection Setup:

1. **Create Environment Variables:**
   - `baseUrl`: `http://localhost:5000`
   - `employeeToken`: (set after employee login)
   - `adminToken`: (set after admin login)
   - `employeeUserId`: (set after employee login)

2. **Create Requests:**

**Request 1: Login as Employee**
- POST `{{baseUrl}}/api/auth/login`
- Body: `{"email": "employee@example.com", "password": "pass"}`
- Test script:
```javascript
pm.environment.set("employeeToken", pm.response.json().token);
```

**Request 2: Employee Views Own Profile**
- GET `{{baseUrl}}/api/users/{{employeeUserId}}`
- Auth: Bearer `{{employeeToken}}`

**Request 3: Employee Views Other User**
- GET `{{baseUrl}}/api/users/1`
- Auth: Bearer `{{employeeToken}}`
- Should return 403

**Request 4: Admin Views Other User**
- GET `{{baseUrl}}/api/users/{{employeeUserId}}`
- Auth: Bearer `{{adminToken}}`
- Should return 200

---

## Quick Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

echo "=== TEST 1: No Token ==="
curl -X GET $BASE_URL/api/users/1
echo -e "\n"

echo "=== TEST 2: Invalid Token ==="
curl -X GET $BASE_URL/api/users/1 -H "Authorization: Bearer invalid"
echo -e "\n"

echo "=== Login and test authorized requests ==="
# Add your email/password here
# TOKEN=$(curl -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"your@email.com","password":"yourpass"}' | jq -r '.token')

# echo "=== TEST 3: Own Profile ==="
# curl -X GET $BASE_URL/api/users/YOUR_ID -H "Authorization: Bearer $TOKEN"
```

---

## Common Issues

**Issue 1: "Cannot read property 'userId' of undefined"**
- Cause: `req.user` is undefined
- Solution: Ensure `authMiddleware` is added to route

**Issue 2: Always getting 403**
- Cause: User IDs don't match
- Solution: Verify you're using correct user ID in URL

**Issue 3: Admin still gets 403**
- Cause: User role is not exactly "ADMIN" or "SUPER_ADMIN"
- Solution: Check database - role field might be lowercase or different

**Issue 4: Password still in response**
- Cause: Destructuring not working
- Solution: Check that password filtering line exists in code
