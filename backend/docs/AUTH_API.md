# Authentication API Documentation

## Overview
The Digital Coffee authentication system provides secure user registration, login, and password reset functionality using JWT tokens and bcrypt password hashing.

## Endpoints

### 1. Register New User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe" // optional
}
```

**Validation:**
- `email`: Must be a valid email format
- `password`: Minimum 6 characters
- `name`: Optional, minimum 1 character if provided

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2026-05-06T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `409`: User already exists with this email
- `500`: Server error

---

### 2. Login
**POST** `/api/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation:**
- `email`: Must be a valid email format
- `password`: Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `401`: Invalid email or password
- `500`: Server error

---

### 3. Forgot Password
**POST** `/api/auth/forgot-password`

Request a password reset link via email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Validation:**
- `email`: Must be a valid email format

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Notes:**
- Always returns success to prevent email enumeration attacks
- Reset token expires in 1 hour
- Previous tokens for the user are invalidated

**Error Responses:**
- `400`: Validation errors
- `500`: Server error

---

### 4. Reset Password
**POST** `/api/auth/reset-password`

Set a new password using a reset token.

**Request Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "newsecurepassword123"
}
```

**Validation:**
- `token`: Required, non-empty string
- `newPassword`: Minimum 6 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**
- `400`: Invalid or expired reset token, or validation errors
- `500`: Server error

---

### 5. Verify Reset Token
**GET** `/api/auth/verify-reset-token/:token`

Check if a reset token is valid before showing the reset form.

**URL Parameters:**
- `token`: The reset token to verify

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid"
}
```

**Error Responses:**
- `400`: Invalid or expired reset token
- `500`: Server error

---

## Authentication Flow

### Registration Flow
1. User submits email, password, and optional name
2. Server validates input
3. Server checks if email already exists
4. Password is hashed using bcrypt (10 rounds)
5. User record is created in database
6. User profile is automatically created
7. JWT token is generated and returned

### Login Flow
1. User submits email and password
2. Server validates input
3. Server retrieves user by email
4. Password is compared with stored hash using bcrypt
5. If valid, JWT token is generated and returned

### Password Reset Flow
1. User requests password reset with email
2. Server generates secure random token (32 bytes)
3. Token is hashed using SHA256 before storage
4. Token is stored with 1-hour expiration
5. Email with reset link is sent to user
6. User clicks link and submits new password
7. Token is validated (not expired, not used)
8. Password is hashed and updated
9. Token is marked as used

---

## Security Features

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Length**: 6 characters
- **Storage**: Only hashed passwords stored, never plaintext

### Token Security
- **JWT Tokens**: Signed with secret key
- **Expiration**: 7 days (configurable)
- **Reset Tokens**:
  - Cryptographically secure random generation
  - SHA256 hashed before storage
  - 1-hour expiration
  - Single-use only

### API Security
- **Email Enumeration Prevention**: Same response for existing/non-existing emails
- **Input Validation**: express-validator on all endpoints
- **Email Normalization**: Lowercase and trimmed
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers
- **Rate Limiting**: Recommended (not yet implemented)

---

## Usage Examples

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Forgot Password:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Reset Password:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"your-reset-token","newPassword":"newpassword123"}'
```

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Register
const register = async (email, password, name) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    email,
    password,
    name
  });
  return response.data;
};

// Login
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  return response.data;
};

// Forgot Password
const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, {
    email
  });
  return response.data;
};

// Reset Password
const resetPassword = async (token, newPassword) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, {
    token,
    newPassword
  });
  return response.data;
};
```

---

## Environment Configuration

Required environment variables for password reset:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@digitalcoffee.cafe

# App Configuration
APP_NAME=Digital Coffee
APP_URL=https://digitalcoffee.cafe
```

---

## Database Setup

Run the password reset migration:

```bash
npm run db:migrate add_password_reset.sql
```

Or manually:

```bash
node scripts/runMigration.js add_password_reset.sql
```

---

## Testing

### Development Mode
In development, password reset emails are logged to console instead of being sent:

```
📧 Password reset email sent (DEV MODE)
Preview URL: https://ethereal.email/message/xxx
Reset URL: http://localhost:19006/reset-password?token=abc123
```

### Production Mode
Set `NODE_ENV=production` to enable real email sending via configured SMTP server.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ // Optional, for validation errors
    {
      "msg": "Invalid value",
      "param": "email",
      "location": "body"
    }
  ]
}
```

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store JWT token securely** (e.g., secure httpOnly cookies or encrypted storage)
3. **Implement rate limiting** on auth endpoints
4. **Use strong JWT secrets** (32+ random characters)
5. **Configure email service properly** with app-specific passwords
6. **Monitor failed login attempts** for security
7. **Implement account lockout** after multiple failed attempts (recommended)
8. **Add 2FA** for enhanced security (future enhancement)

---

## Troubleshooting

### Email not sending
- Check EMAIL_* environment variables
- Verify SMTP credentials
- Check firewall/network settings
- Review server logs for errors

### Token expired
- Reset tokens expire after 1 hour
- Request a new reset link

### Invalid credentials
- Verify email and password are correct
- Check if account exists
- Review server logs for details

---

## Future Enhancements

- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Apple, etc.)
- [ ] Email verification on registration
- [ ] Refresh tokens
- [ ] Session management
- [ ] Login history tracking
