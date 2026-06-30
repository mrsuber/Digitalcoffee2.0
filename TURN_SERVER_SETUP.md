# TURN Server Setup Guide for Digital Coffee

## Current Configuration

The application is currently using **publicly available TURN servers** from openrelay.metered.ca. These work for testing but are shared and may have reliability/performance limitations in production.

### Current TURN Servers (in use):
- `turn:openrelay.metered.ca:80`
- `turn:openrelay.metered.ca:443`
- `turn:openrelay.metered.ca:443?transport=tcp`

**Credentials:**
- Username: `openrelayproject`
- Password: `openrelayproject`

---

## Why TURN Servers Matter

**STUN servers** help peers discover their public IP addresses, but they don't work when both users are behind restrictive NATs or corporate firewalls.

**TURN servers** relay media when direct peer-to-peer connections fail. They act as intermediaries, ensuring calls connect even in challenging network conditions.

**Connection Success Rate:**
- STUN only: ~70-80% success rate
- STUN + TURN: ~95-99% success rate

---

## Setting Up Your Own TURN Server (Recommended for Production)

### Option 1: Coturn (Open Source, Self-Hosted)

**Best for:** Full control, cost-effective at scale

#### Installation on Ubuntu/Debian

```bash
# Install coturn
sudo apt update
sudo apt install coturn

# Enable coturn service
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn

# Edit configuration
sudo nano /etc/turnserver.conf
```

#### Coturn Configuration (`/etc/turnserver.conf`)

```conf
# Listening ports
listening-port=3478
tls-listening-port=5349

# External IP (your server's public IP)
external-ip=YOUR_SERVER_PUBLIC_IP

# Relay IP (usually same as external IP)
relay-ip=YOUR_SERVER_PUBLIC_IP

# Realm (your domain)
realm=digitalcoffee.cafe
server-name=digitalcoffee.cafe

# Authentication
lt-cred-mech
user=digitalcoffee:YOUR_SECURE_PASSWORD_HERE

# SSL/TLS certificates (use Let's Encrypt)
cert=/etc/letsencrypt/live/digitalcoffee.cafe/fullchain.pem
pkey=/etc/letsencrypt/live/digitalcoffee.cafe/privkey.pem

# Security
fingerprint
no-multicast-peers

# Logging
log-file=/var/log/turnserver.log
verbose

# Relay settings
min-port=49152
max-port=65535
```

#### Start Coturn

```bash
# Start the service
sudo systemctl start coturn

# Enable on boot
sudo systemctl enable coturn

# Check status
sudo systemctl status coturn

# View logs
sudo tail -f /var/log/turnserver.log
```

#### Firewall Configuration

```bash
# Allow TURN server ports
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# Allow relay port range
sudo ufw allow 49152:65535/tcp
sudo ufw allow 49152:65535/udp

# Reload firewall
sudo ufw reload
```

#### Update Application Configuration

**Mobile (`mobile/src/services/webrtc.js`):**
```javascript
const ICE_SERVERS = [
  // STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:digitalcoffee.cafe:3478' }, // Your STUN

  // Your TURN servers
  {
    urls: 'turn:digitalcoffee.cafe:3478',
    username: 'digitalcoffee',
    credential: 'YOUR_SECURE_PASSWORD_HERE'
  },
  {
    urls: 'turn:digitalcoffee.cafe:3478?transport=tcp',
    username: 'digitalcoffee',
    credential: 'YOUR_SECURE_PASSWORD_HERE'
  },
  {
    urls: 'turns:digitalcoffee.cafe:5349',
    username: 'digitalcoffee',
    credential: 'YOUR_SECURE_PASSWORD_HERE'
  }
];
```

**Admin Portal (`admin/src/pages/CoachVideoCall.jsx`):**
```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:digitalcoffee.cafe:3478' },
    {
      urls: 'turn:digitalcoffee.cafe:3478',
      username: 'digitalcoffee',
      credential: 'YOUR_SECURE_PASSWORD_HERE'
    },
    {
      urls: 'turns:digitalcoffee.cafe:5349',
      username: 'digitalcoffee',
      credential: 'YOUR_SECURE_PASSWORD_HERE'
    }
  ],
  iceCandidatePoolSize: 10
};
```

---

### Option 2: Managed TURN Services (Commercial)

**Best for:** Quick setup, guaranteed uptime, no server management

#### Twilio Network Traversal Service (NTS)

**Pricing:** $0.0004/minute

```javascript
// Fetch TURN credentials from Twilio
const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Tokens.json', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN').toString('base64')
  }
});

const data = await response.json();
const iceServers = data.ice_servers;
```

#### Xirsys

**Pricing:** Free tier available, then $10/month

```javascript
// Fetch TURN credentials from Xirsys
const response = await fetch('https://global.xirsys.net/_turn/YOUR_IDENT', {
  method: 'PUT',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('YOUR_USERNAME:YOUR_SECRET').toString('base64'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ format: 'urls' })
});

const data = await response.json();
const iceServers = data.v.iceServers;
```

#### Metered.ca (Upgrade from Free)

**Pricing:** $39/month for dedicated instance

Already using their free relay. Consider upgrading to paid tier for:
- Dedicated servers
- Better performance
- No usage limits
- Custom domains

---

## Testing Your TURN Server

### Test with Trickle ICE
Visit: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

1. Replace the TURN server fields with your configuration
2. Click "Gather candidates"
3. Look for candidates with type "relay" - these indicate TURN is working

### Test with Command Line

```bash
# Install turnutils
sudo apt install libnice-dev

# Test TURN server
turnutils_uclient -v -u digitalcoffee -w YOUR_PASSWORD digitalcoffee.cafe
```

Expected output should show successful TURN allocation.

---

## Monitoring & Maintenance

### Monitor Coturn

```bash
# View active sessions
sudo turnutils_stunclient -v digitalcoffee.cafe

# Check logs
sudo journalctl -u coturn -f

# Monitor bandwidth
sudo iftop -i eth0
```

### SSL Certificate Renewal (Let's Encrypt)

```bash
# Renew certificates
sudo certbot renew

# Restart coturn after renewal
sudo systemctl restart coturn
```

### Coturn Performance Tuning

Edit `/etc/turnserver.conf`:
```conf
# Limit sessions per user
max-bps=1000000

# Set session limits
user-quota=100
total-quota=1000

# Enable Redis for session persistence (optional)
redis-statsdb="ip=127.0.0.1 dbname=0 password=YOUR_REDIS_PASSWORD"
```

---

## Cost Comparison

### Self-Hosted Coturn
- **Server:** $10-20/month (DigitalOcean, AWS, etc.)
- **Bandwidth:** Variable (estimated $0.01-0.05/GB)
- **SSL:** Free (Let's Encrypt)
- **Total:** ~$10-30/month + bandwidth

### Twilio NTS
- **Per minute:** $0.0004
- **100,000 minutes/month:** $40
- **Includes:** Global infrastructure, guaranteed uptime

### Xirsys
- **Fixed:** $10/month (standard)
- **Unlimited sessions**

### Metered.ca
- **Dedicated:** $39/month
- **Unlimited usage**

---

## Recommended Approach

**For Digital Coffee 2.0:**

1. **Development/Testing:** Use openrelay.metered.ca (current setup) ✅
2. **Production (< 1000 calls/month):** Self-hosted Coturn on existing server
3. **Production (> 1000 calls/month):** Twilio NTS or Metered.ca paid

---

## Security Best Practices

1. **Rotate TURN credentials** every 90 days
2. **Use time-limited credentials** (REST API pattern)
3. **Enable SSL/TLS** (TURNS) for encrypted relay
4. **Restrict relay ports** to specific ranges
5. **Monitor for abuse** (unusual traffic patterns)
6. **Rate limit** TURN allocations per user

---

## Troubleshooting

### Common Issues

**"Failed to allocate TURN relay"**
- Check firewall allows UDP/TCP on TURN ports
- Verify external IP matches server public IP
- Ensure credentials are correct

**"ICE connection failed"**
- Test with trickle-ice (see Testing section)
- Check if relay candidates appear
- Verify TURN server is accessible from internet

**High bandwidth usage**
- Most TURN traffic only occurs when P2P fails
- Monitor with `iftop` or `vnstat`
- Consider bandwidth limits in coturn config

---

## Next Steps

1. ✅ **Current:** Using public TURN servers (testing OK)
2. 📋 **Recommended:** Set up Coturn on digitalcoffee.cafe server
3. 🔐 **Security:** Generate strong credentials
4. 🧪 **Test:** Verify with Trickle ICE
5. 📊 **Monitor:** Track TURN usage and connection success rates

---

## Questions?

Contact system administrator or refer to:
- Coturn docs: https://github.com/coturn/coturn
- WebRTC samples: https://webrtc.github.io/samples/
- Digital Coffee support: abbaabdouraman@digitalcoffee.cafe
