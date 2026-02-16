# OTP Authentication Guide

## Overview
Poemvy now uses **OTP (One-Time Password) passwordless authentication**. Users receive a 6-digit verification code via email instead of using passwords.

## How It Works

### 1. User Login Flow
1. User enters their email
2. Backend generates 6-digit code and sends via email
3. User enters code
4. Backend verifies code and issues JWT tokens
5. User is logged in

### 2. New User Flow
- When a user verifies OTP with an email that doesn't exist:
  - System automatically creates account
  - Username generated from email prefix
  - No password needed
  - User is instantly logged in

## Backend Setup

### Dependencies Installed
- `nodemailer` - Email sending
- `jsonwebtoken` - Already installed
- `crypto` - Built-in Node.js module

### Files Created

#### 1. OTP Model (`backend/src/models/Otp.js`)
```javascript
{
  email: String,
  code: String (6 digits),
  expiresAt: Date (5 minutes),
  used: Boolean,
  attempts: Number
}
```
- TTL Index: Auto-deletes expired OTPs
- Validates email format
- Tracks usage to prevent reuse

#### 2. Email Mailer (`backend/src/utils/mailer.js`)
- Sends beautifully formatted OTP emails
- Supports Gmail, Mailtrap, and custom SMTP
- Production-ready error handling
- Branded email template matching Poemvy design

#### 3. Auth Controllers (`backend/src/controllers/auth.controller.js`)
**New Methods:**
- `requestOTP(email)` - Generates and sends OTP
- `verifyOTP(email, code)` - Verifies code and logs in user

#### 4. Auth Routes (`backend/src/routes/auth.routes.js`)
**New Endpoints:**
- `POST /api/auth/request-otp` - Request OTP code
- `POST /api/auth/verify-otp` - Verify code and login

## Email Configuration

### Required Environment Variables
Add to your `.env` file:

```env
# For Gmail (Recommended for Development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM="Poemvy <noreply@poemvy.com>"
```

### Getting Gmail App Password
1. Go to [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification → Enable
3. Search "App passwords"
4. Generate password for "Mail"
5. Copy 16-character password to `.env`

### Alternative: Mailtrap (Development Only)
```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_password
```
Get credentials from [Mailtrap.io](https://mailtrap.io/)

## Frontend Changes

### Login Page (`frontend/login.html`)
**New Flow:**
1. Email input → "Send verification code" button
2. OTP input → "Verify & Sign in" button
3. "Resend code" option
4. "Back" link to change email

**Features:**
- Auto-formats OTP input (numbers only)
- 6-digit validation
- Success/error messages
- Maintains Poemvy design system

### Signup Page (`frontend/signup.html`)
- Simplified to redirect to login
- Same OTP flow for new and existing users
- No separate signup needed (auto-created on first OTP verify)

## Security Features

### ✅ Implemented
- **OTP Expiration**: 5 minutes
- **Single Use**: OTP marked as used after verification
- **Email Validation**: Validates email format
- **Auto Cleanup**: MongoDB TTL index deletes expired OTPs
- **JWT Tokens**: 7-day access token, 30-day refresh token
- **No Password Storage**: Eliminates password-related vulnerabilities

### 🔄 Recommended (Future)
- **Rate Limiting**: Limit OTP requests (5 per 15 minutes)
- **OTP Hashing**: Hash codes before storing in DB
- **Failed Attempts Tracking**: Lock after 3 failed verifications
- **IP Monitoring**: Detect suspicious patterns

## Testing

### 1. Start Servers
```bash
# Backend
cd backend
npm start

# Frontend
python -m http.server 3000
```

### 2. Configure Email
- Add email credentials to `backend/.env`
- Test with your own email first

### 3. Test Flow
1. Go to `http://localhost:3000/login.html`
2. Enter your email
3. Check inbox for OTP (check spam folder)
4. Enter 6-digit code
5. Should login and redirect to home page

### 4. Check Developer Console
- Watch Network tab for API calls
- Check Console for any errors
- Verify tokens stored in localStorage

## API Endpoints

### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "...",
    "username": "user",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## Database Collections

### OTPs Collection
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "code": "123456",
  "expiresAt": ISODate("2026-02-16T12:30:00Z"),
  "used": false,
  "attempts": 0,
  "createdAt": ISODate("2026-02-16T12:25:00Z"),
  "updatedAt": ISODate("2026-02-16T12:25:00Z")
}
```

### User Auto-Creation
If email doesn't exist:
```javascript
{
  "email": "newuser@example.com",
  "username": "newuser", // or "newuser1" if taken
  "isVerified": true,
  "password": "<random_hash>", // Never used
  "createdAt": ISODate,
  "lastLogin": ISODate
}
```

## Troubleshooting

### Email Not Sending
1. Check `.env` configuration
2. Verify Gmail App Password (not regular password)
3. Check firewall/antivirus blocking port 587
4. Try Mailtrap for testing
5. Check backend console for errors

### "Unable to connect to server"
- Backend not running
- Check `http://localhost:5000` is accessible
- Check CORS configuration in `backend/src/app.js`

### "Invalid verification code"
- Code expired (5 minutes)
- Code already used
- Typo in code entry
- Check database for OTP entry

### "Failed to save draft"
- User not authenticated
- Check localStorage for `authToken`
- Token might be expired
- Re-login required

## What This Enables

With OTP authentication working:
- ✅ **Draft autosave** - Works with user authentication
- ✅ **Publish poems** - Identity-based publishing
- ✅ **Like/unlike** - User-specific interactions
- ✅ **Comments** - Authenticated commenting
- ✅ **Collections** - Personal collections
- ✅ **Profile management** - User-specific content
- ✅ **Follow users** - Social features

## Migration Notes

### From Password to OTP
- Old users with passwords can still use password login
- New users automatically use OTP
- Both systems coexist
- Consider migrating all users to OTP eventually

### Backward Compatibility
- Keep `/api/auth/login` (password-based)
- Keep `/api/auth/register` (password-based)
- Add `/api/auth/request-otp` (OTP-based)
- Add `/api/auth/verify-otp` (OTP-based)

## Production Considerations

### Email Service
- Use dedicated email service (SendGrid, AWS SES, Postmark)
- Set up SPF, DKIM, DMARC records
- Monitor send rates and bounce rates
- Have fallback SMTP server

### Security
- Add rate limiting (express-rate-limit)
- Hash OTPs before storage
- Log authentication attempts
- Monitor for abuse patterns
- Add CAPTCHA for high-volume requests

### Monitoring
- Track OTP send success rate
- Monitor failed verification attempts
- Alert on unusual patterns
- Dashboard for auth metrics

## Support

If you encounter issues:
1. Check this guide
2. Review backend console logs
3. Check frontend console errors
4. Verify environment variables
5. Test email configuration separately

---

**Authentication is now passwordless and secure!** 🎉
