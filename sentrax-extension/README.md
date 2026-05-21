# SentraX Chrome Browser Extension

Real-time URL scanning and threat detection powered by the SentraX cybersecurity platform.

## 📦 Installation

### Prerequisites
- Chrome/Chromium browser (v90+)
- SentraX backend running at `http://127.0.0.1:8000`
- A valid SentraX account

### Setup Steps

1. **Copy the extension folder to your desired location:**
   ```bash
   cp -r sentrax-extension ~/Extensions/
   # or on Windows
   copy sentrax-extension C:\Extensions\
   ```

2. **Open Chrome and go to:**
   ```
   chrome://extensions/
   ```

3. **Enable "Developer mode"** in the top right corner

4. **Click "Load unpacked"** and select the `sentrax-extension` folder

5. **The extension should now appear in your extensions list**

6. **Click the SentraX icon** to open the popup

---

## 🔐 Authentication

1. **Click the SentraX extension icon**
2. **Click "Open Login"** - this will open the SentraX frontend login page
3. **Log in with your credentials** (parent or child account)
4. **The extension automatically stores your JWT token** securely in Chrome storage
5. **Close the login tab** - you're now authenticated

---

## ⚙️ How It Works

### URL Scanning Flow

1. **User visits a website** → Extension detects the URL
2. **Background worker sends request** to backend API with JWT token
3. **Backend analyzes URL** and returns status (safe/suspicious/dangerous)
4. **Extension caches result** for 1 hour
5. **Popup displays result** when clicked
6. **Notifications shown** for dangerous sites

### API Integration

The extension communicates with your backend at:
```
POST http://127.0.0.1:8000/api/check-url/
```

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "status": "safe|suspicious|dangerous",
  "risk_score": 0-100,
  "threat_type": "phishing|malware|adult|scam",
  "message": "Status message"
}
```

---

## 📊 Popup Display

### Safe ✅
- Green status indicator
- Low risk score
- No warnings

### Suspicious ⚠️
- Yellow status indicator  
- Medium risk score
- Shows threat type
- Proceed with caution message

### Dangerous 🚨
- Red status indicator
- High risk score
- Shows threat type
- Strong warning message
- Desktop notification sent

---

## 📁 File Structure

```
sentrax-extension/
├── manifest.json         # Extension configuration (Manifest v3)
├── background.js         # Service worker (URL checking, token management)
├── popup.html            # Popup UI
├── popup.js              # Popup logic & interactions
├── styles.css            # Styling
└── icons/
    ├── icon-16.png       # 16x16 icon (favicon size)
    ├── icon-48.png       # 48x48 icon
    └── icon-128.png      # 128x128 icon (store display)
```

---

## 🔧 Configuration

### Backend URL

To change the backend URL, edit `background.js`:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';  // Change this
const CHECK_URL_ENDPOINT = '/api/check-url/';
```

### Cache Duration

To change how long results are cached (default: 1 hour):

```javascript
// In background.js, line ~100
if (existing && Date.now() - existing.timestamp < 3600000) {  // Change 3600000 (ms)
```

### API Timeout

Adjust timeout in `background.js` fetch call if needed:

```javascript
const response = await fetch(API_BASE_URL + CHECK_URL_ENDPOINT, {
  method: 'POST',
  headers: {...},
  body: JSON.stringify({ url }),
  // Add timeout: 5000 if needed
});
```

---

## 🔒 Security Features

✅ **JWT Token Security**
- Tokens stored in Chrome's encrypted `chrome.storage.local`
- Automatically attached to all API requests
- Cleared on logout

✅ **URL Filtering**
- Skips system URLs (chrome://, about:, edge://)
- Never sends sensitive URLs to backend
- Hostname extracted for display

✅ **Permission Scoping**
- Only accesses active tab URL
- No content script injection
- Limited to necessary permissions

✅ **API Authentication**
- All requests include Bearer token
- Automatic token refresh on 401 error
- Graceful logout if token invalid

---

## 📝 Permissions Explanation

- `tabs` - Read current tab URL
- `storage` - Store JWT token securely  
- `activeTab` - Access active tab when popup opened
- `host_permissions` - Connect to backend API

---

## 🐛 Troubleshooting

### "Not authenticated" message
- Click "Open Login" button
- Log in to SentraX frontend
- Token should auto-store
- Refresh extension popup

### Extension not detecting URLs
- Ensure backend is running: `python manage.py runserver`
- Check console for errors: `chrome://extensions → Details → Errors`
- Verify token is stored: Right-click extension → Storage → chrome.storage

### API connection errors
- Backend URL in `background.js` is wrong (default: `http://127.0.0.1:8000`)
- CORS might block requests (backend should allow it)
- Check backend console for detailed errors

### Popup shows blank/loading forever
- Open browser console: F12
- Check for JavaScript errors
- Reload extension: Toggle off/on

---

## 🚀 Development

### Local Testing

1. Make changes to extension files
2. Go to `chrome://extensions`
3. Click the refresh icon on SentraX extension
4. Test the popup

### Debug Mode

Add console logs to `background.js`:
```javascript
console.log('URL being checked:', url);
console.log('API Response:', data);
```

View logs in:
```
chrome://extensions → SentraX → Details → Errors
```

---

## 📦 Building for Production

### Generate Icons

Create 16x16, 48x48, and 128x128 PNG icons and place in `icons/` folder.

### Update Manifest

Change in `manifest.json`:
```json
"host_permissions": [
  "https://your-production-domain.com/*"
]
```

### Package Extension

1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click "Pack extension"
4. Select extension folder
5. Creates `.crx` file for distribution

---

## 📞 Support

For issues or feature requests:
- Check backend logs: `python manage.py runserver`
- Check extension console: `chrome://extensions → SentraX → Errors`
- Review `popup.js` and `background.js` for debug logs

---

## 📄 License

SentraX Browser Extension © 2024

---

## ✅ Checklist Before Production

- [ ] Backend running and tested
- [ ] JWT token generation working
- [ ] Icons created (16x, 48x, 128x)
- [ ] Backend URL configured correctly
- [ ] No console errors in extension
- [ ] All three status types tested (safe, suspicious, dangerous)
- [ ] Logout functionality working
- [ ] Token refresh on 401 error working
- [ ] Desktop notifications displaying correctly
- [ ] Caching working (URLs checked only once per hour)
