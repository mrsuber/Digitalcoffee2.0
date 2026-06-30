# Deployment Fixes - Socket.io Connection Issues

## Issues Fixed

### 1. CallDetailScreen - Missing Platform Import ✅
**Error**: `ReferenceError: Property 'Platform' doesn't exist`

**Fix**: Added Platform import to CallDetailScreen.js
```javascript
import { Platform } from 'react-native';
```

### 2. Socket.io Connection - Websocket Errors ✅
**Error**: `Socket connection error: [Error: websocket error]`

**Root Cause**:
- Nginx was not configured to proxy socket.io connections
- Socket.io connects to root URL (`https://digitalcoffee.cafe`)
- Root location was serving static files, not proxying to backend

**Fixes Applied**:

#### a) Nginx Configuration
Added `/socket.io/` location block to proxy websocket connections:
```nginx
location /socket.io/ {
    proxy_pass http://localhost:5000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;

    # CORS headers for socket.io
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
}
```

**Location**: `/etc/nginx/sites-available/digitalcoffee`
**Backup**: `/etc/nginx/sites-available/digitalcoffee.backup`

#### b) Mobile Socket Service
Updated socket.io client configuration:
```javascript
io(socketUrl, {
  transports: ['polling', 'websocket'], // Try polling first
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  rejectUnauthorized: false, // Handle SSL certificates
  secure: true,
})
```

Added better error handling and reconnection logic.

### 3. Database Constraint ✅
**Error**: `call_notifications_notification_type_check` constraint violation

**Fix**: Added `incoming_call` to allowed notification types
```sql
ALTER TABLE call_notifications DROP CONSTRAINT call_notifications_notification_type_check;
ALTER TABLE call_notifications ADD CONSTRAINT call_notifications_notification_type_check
CHECK (notification_type IN (
  'booking_confirmed', 'reminder_1hour', 'reminder_15min',
  'coach_joined', 'student_joined', 'call_started',
  'call_ended', 'booking_cancelled', 'call_missed',
  'incoming_call'  -- ADDED
));
```

## Deployment Status

### ✅ Completed
- [x] Backend files deployed to `/var/www/digitalcoffee/backend/`
- [x] Backend server restarted (PM2)
- [x] Database constraint updated
- [x] Nginx socket.io proxy configured
- [x] Nginx reloaded
- [x] Mobile app code updated locally

### ⏳ Pending
- [ ] Test socket.io connection from mobile app
- [ ] Test complete call flow (coach → student)

## Testing Instructions

### 1. Reload Mobile App
On your device, reload the app to pick up the new code:
- Shake device → "Reload"
- OR stop and restart: `npx expo start`

### 2. Check Logs
You should now see:
```
✅ Socket connected: <socket-id>
✅ User <userId> registered with socket server
```

Instead of:
```
❌ Socket connection error: [Error: websocket error]
```

### 3. Test Call Flow
1. **Coach Dashboard**:
   - Go to https://digitalcoffee.cafe/admin
   - Login as professional coach
   - Navigate to "My Students"
   - Click "Video Call" button on a student

2. **Mobile App (Student)**:
   - Should instantly see IncomingCallScreen
   - Phone should vibrate
   - Shows coach name
   - Accept/Decline buttons

### 4. Verify Socket Connection
Open browser console on mobile app:
```
Press ? | show all commands
```

Look for socket connection logs:
```
🔌 Connecting to socket server: https://digitalcoffee.cafe
✅ Socket connected: abc123
✅ User 28 registered with socket server: 28
```

## Troubleshooting

### If socket still won't connect:

1. **Check nginx is running**:
```bash
ssh root@76.13.41.99 "systemctl status nginx"
```

2. **Check backend logs**:
```bash
ssh root@76.13.41.99 "pm2 logs digitalcoffee-v2 --lines 50"
```

3. **Test socket.io endpoint**:
```bash
curl -i https://digitalcoffee.cafe/socket.io/
```
Should return: `{"code":0,"message":"Transport unknown"}`

4. **Check SSL certificate**:
```bash
curl -v https://digitalcoffee.cafe 2>&1 | grep -i ssl
```

### If still having issues:

Try connecting to polling transport only (temporary debug):
```javascript
// In mobile/src/services/socketService.js
io(socketUrl, {
  transports: ['polling'], // Remove websocket temporarily
  ...
})
```

## Files Modified

### Production Server
- `/var/www/digitalcoffee/backend/services/webrtcSignaling.js`
- `/var/www/digitalcoffee/backend/routes/video-calls.js`
- `/var/www/digitalcoffee/backend/index.js`
- `/etc/nginx/sites-available/digitalcoffee`
- Database: `call_notifications` table constraint

### Local Development
- `/mobile/src/services/socketService.js`
- `/mobile/src/screens/CallDetailScreen.js`
- `/mobile/src/context/AuthContext.js`
- `/mobile/App.js`

## Next Steps

1. ✅ **Reload mobile app** and check for socket connection
2. ✅ **Test call flow** from coach dashboard
3. ⏳ **Monitor logs** for any errors
4. ⏳ **Build production app** if all tests pass

---

**Date**: June 28, 2026
**Status**: Ready for Testing
