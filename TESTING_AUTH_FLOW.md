# Testing Authentication Flow - Digital Coffee

## Complete Auth Testing Guide

This guide will help you test the complete authentication flow including signup, login, and password reset functionality.

## Prerequisites

### Backend Deployment
Make sure your backend is deployed and running on the VPS:
- URL: https://digitalcoffee.cafe
- Health check: https://digitalcoffee.cafe/health

### Mobile App Setup
```bash
cd mobile
npm install
npm start
```

## Testing Steps

### 1. Test Signup (Registration)

**Steps:**
1. Launch the mobile app
2. You should see the AuthScreen (Login/Signup)
3. Tap on "Sign Up" at the bottom
4. Fill in the form:
   - **Full Name**: Test User
   - **Email**: test@example.com (use a real email you can access)
   - **Password**: test123 (at least 6 characters)
5. Tap "SIGN UP"

**Expected Results:**
- Loading state: "PLEASE WAIT..."
- Success: Navigate to MoodCheck screen
- Error: Show error message (e.g., "User already exists")

**Backend Endpoint:** `POST https://digitalcoffee.cafe/api/auth/register`

**Verify:**
- Check backend logs: `pm2 logs digitalcoffee-v2`
- Verify user created in database:
  ```sql
  psql -h localhost -U digitalcoffee_user digitalcoffee
  SELECT * FROM users WHERE email = 'test@example.com';
  ```

---

### 2. Test Login

**Steps:**
1. If you're logged in, log out first
2. On AuthScreen, ensure you're on "Login" mode
3. Fill in credentials:
   - **Email**: test@example.com
   - **Password**: test123
4. Tap "LOGIN"

**Expected Results:**
- Loading state: "PLEASE WAIT..."
- Success: Navigate to MoodCheck screen
- Invalid credentials: Show error "Invalid email or password"

**Backend Endpoint:** `POST https://digitalcoffee.cafe/api/auth/login`

**Verify:**
- JWT token is returned
- User data is stored in AsyncStorage
- User is authenticated in app

---

### 3. Test Forgot Password Flow

#### 3.1 Request Password Reset

**Steps:**
1. On the Login screen (AuthScreen)
2. Tap "Forgot Password?" link (appears only in login mode)
3. You should navigate to ForgotPasswordScreen
4. Enter your email: test@example.com
5. Tap "SEND RESET LINK"

**Expected Results:**
- Loading state: "SENDING..."
- Success message: "If an account exists with this email, you will receive password reset instructions."
- Button changes to: "EMAIL SENT"
- Alert appears, tap OK to return to login

**Backend Endpoint:** `POST https://digitalcoffee.cafe/api/auth/forgot-password`

**Verify Email:**
- Check your email inbox for: test@example.com
- Email should be from: info@digitalcoffee.cafe
- Subject: "Reset Your Password - Digital Coffee"
- Email should contain:
  - Digital Coffee branding
  - "RESET PASSWORD" button
  - Reset link with token
  - Security notice about 1-hour expiration

**Backend Logs:**
```bash
pm2 logs digitalcoffee-v2 | grep -i email
```

Should show email sending confirmation.

#### 3.2 Reset Password

**IMPORTANT:** Currently, the reset password link in the email is for web. For mobile testing, you need to manually extract the token and navigate to the ResetPassword screen.

**Manual Testing Steps:**

1. **Extract Token from Email:**
   - Open the password reset email
   - Find the reset URL, it looks like:
     `https://digitalcoffee.cafe/reset-password?token=abc123...`
   - Copy the token value (everything after `token=`)

2. **Test via API (Recommended for now):**
   ```bash
   # First, verify token is valid
   curl https://digitalcoffee.cafe/api/auth/verify-reset-token/YOUR_TOKEN_HERE

   # Should return: {"success": true, "message": "Token is valid"}
   ```

3. **Reset the password via API:**
   ```bash
   curl -X POST https://digitalcoffee.cafe/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "token": "YOUR_TOKEN_HERE",
       "newPassword": "newpass123"
     }'
   ```

4. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Password has been reset successfully. You can now login with your new password."
   }
   ```

5. **Verify by Logging In:**
   - Go back to AuthScreen in the app
   - Try logging in with:
     - Email: test@example.com
     - Password: newpass123
   - Should successfully log in

**Future Enhancement:**
For production, you should implement deep linking in the mobile app to handle the reset password URL from the email. The email link would open the app directly to the ResetPassword screen with the token.

---

### 4. Test Password Reset Screen (Direct Navigation)

For testing the ResetPassword screen UI:

**Steps:**
1. Modify the App.js temporarily to test:
   ```javascript
   // In App.js, change initial route to:
   initialRouteName="ResetPassword"

   // And pass a test token:
   <Stack.Screen
     name="ResetPassword"
     component={ResetPasswordScreen}
     initialParams={{ token: 'test-token-here' }}
   />
   ```

2. The screen will verify the token
3. If valid, shows password reset form
4. Fill in:
   - **New Password**: newpass123
   - **Confirm Password**: newpass123
5. Tap "RESET PASSWORD"

**Expected Results:**
- Token verification loading state
- If token invalid/expired: Alert and navigate back to Auth
- If valid: Show password form
- On submit: Success message and navigate to Auth
- Password validation errors if passwords don't match or too short

---

## Complete Test Checklist

### Signup Tests
- [ ] Successful signup with valid data
- [ ] Error when email already exists
- [ ] Error with invalid email format
- [ ] Error with password less than 6 characters
- [ ] Error with missing name
- [ ] Navigation to MoodCheck after successful signup

### Login Tests
- [ ] Successful login with correct credentials
- [ ] Error with wrong password
- [ ] Error with non-existent email
- [ ] Error with invalid email format
- [ ] Navigation to MoodCheck after successful login
- [ ] "Forgot Password?" link visible only in login mode

### Forgot Password Tests
- [ ] Forgot password link navigates to ForgotPasswordScreen
- [ ] Success message shown (even for non-existent email - security)
- [ ] Email sent to valid email address
- [ ] Email contains reset link with token
- [ ] Email has correct branding and formatting
- [ ] Email sent from info@digitalcoffee.cafe
- [ ] "Back to Login" returns to AuthScreen

### Reset Password Tests
- [ ] Token verification works correctly
- [ ] Expired token shows error and redirects
- [ ] Invalid token shows error and redirects
- [ ] Valid token shows password reset form
- [ ] Password must be at least 6 characters
- [ ] Passwords must match
- [ ] Success message after reset
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] "Back to Login" returns to AuthScreen

### Security Tests
- [ ] JWT token stored securely
- [ ] Password is not visible (secureTextEntry works)
- [ ] Email enumeration protection (same message for valid/invalid emails)
- [ ] Reset tokens expire after 1 hour
- [ ] Reset tokens can only be used once
- [ ] Passwords are hashed in database (never plain text)

---

## Testing Email Configuration

### Verify Email Settings on VPS

```bash
ssh root@76.13.41.99
cd /var/www/Digitalcoffee2.0/backend
cat .env | grep EMAIL
```

Should show:
```
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=abbaabdouraman@digitalcoffee.cafe
EMAIL_PASSWORD=Abba1@@@@
EMAIL_FROM=info@digitalcoffee.cafe
```

### Test Email Sending from VPS

```bash
# Test forgot password API directly
curl -X POST https://digitalcoffee.cafe/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

Check logs:
```bash
pm2 logs digitalcoffee-v2 --lines 50
```

---

## Common Issues & Solutions

### Issue: Email not received

**Check:**
1. Spam/junk folder
2. Backend logs for errors: `pm2 logs digitalcoffee-v2 | grep -i error`
3. Email credentials are correct in .env
4. DNS records (MX, SPF, TXT) are properly configured
5. Port 587 is not blocked by firewall

**Solution:**
```bash
# Check if email service is reachable
telnet mail.privateemail.com 587
```

### Issue: Token expired

**Check:**
- Tokens expire in 1 hour
- Request a new reset email

### Issue: Can't connect to backend

**Check:**
1. Backend is running: `pm2 status`
2. Nginx is running: `sudo systemctl status nginx`
3. SSL certificate is valid: `sudo certbot certificates`
4. Firewall allows HTTPS: `sudo ufw status`

### Issue: API returns 500 error

**Check:**
1. Database is running: `sudo systemctl status postgresql`
2. Database migrations ran: Check for password_reset_tokens table
3. Backend logs: `pm2 logs digitalcoffee-v2`

---

## API Endpoints Reference

All endpoints are prefixed with: `https://digitalcoffee.cafe/api`

| Endpoint | Method | Purpose | Body |
|----------|--------|---------|------|
| `/auth/register` | POST | Create new account | `{email, password, name}` |
| `/auth/login` | POST | Login user | `{email, password}` |
| `/auth/forgot-password` | POST | Request password reset | `{email}` |
| `/auth/reset-password` | POST | Reset password | `{token, newPassword}` |
| `/auth/verify-reset-token/:token` | GET | Verify token validity | - |

---

## Next Steps After Testing

1. ✅ Verify all auth endpoints work
2. ✅ Test email delivery
3. ✅ Confirm password reset flow
4. 🔄 Implement deep linking for password reset (optional)
5. 🔄 Add biometric authentication (optional)
6. 🔄 Add social auth (Google, Apple) (optional)
7. ✅ Deploy to production
8. ✅ Test on real devices

---

**Ready to test!** Start the mobile app and follow the testing steps above. 🚀
