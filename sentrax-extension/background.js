/**
 * SentraX Browser Extension - Background Service Worker
 * Handles URL checking, token management, and cross-component communication
 */

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';
const CHECK_URL_ENDPOINT = '/api/check-url/';

/**
 * Get stored device ID from chrome storage
 */
async function getStoredDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get('sentrax_device_id', (result) => {
      const deviceId = result.sentrax_device_id || null;
      console.log('[SentraX BG] getStoredDeviceId:', deviceId ? `${deviceId}` : 'not found');
      resolve(deviceId);
    });
  });
}

/**
 * Store device ID in chrome storage
 */
async function storeDeviceId(deviceId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ sentrax_device_id: deviceId }, () => {
      console.log('[SentraX BG] Device ID stored:', deviceId);
      resolve();
    });
  });
}

/**
 * Register device with SentraX backend
 */
async function registerDevice(token) {
  try {
    const response = await fetch(API_BASE_URL + '/api/devices/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Chrome Browser (${new Date().toLocaleString()})`,
        device_type: 'browser',
      }),
    });

    if (!response.ok) {
      console.error('[SentraX BG] Device registration failed:', response.status);
      return null;
    }

    const data = await response.json();
    const deviceId = data.device?.id;
    
    if (deviceId) {
      console.log('[SentraX BG] ✅ Device registered successfully:', deviceId);
      await storeDeviceId(deviceId);
      return deviceId;
    }
    
    return null;
  } catch (error) {
    console.error('[SentraX BG] Error registering device:', error);
    return null;
  }
}

/**
 * Initialize extension - register device on startup
 */
async function initializeExtension() {
  try {
    console.log('[SentraX BG] Initializing extension...');
    
    const token = await getStoredToken();
    if (!token) {
      console.log('[SentraX BG] No token available for device registration');
      return;
    }

    const existingDeviceId = await getStoredDeviceId();
    if (existingDeviceId) {
      console.log('[SentraX BG] Device already registered:', existingDeviceId);
      return;
    }

    // Register new device
    const deviceId = await registerDevice(token);
    if (deviceId) {
      console.log('[SentraX BG] Device initialization complete');
    }
  } catch (error) {
    console.error('[SentraX BG] Error initializing extension:', error);
  }
}

// Initialize extension on service worker startup
console.log('[SentraX BG] Service worker loaded, initializing...');
initializeExtension();

/**
 * Get stored JWT token from chrome storage
 */
async function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get('sentrax_token', (result) => {
      const token = result.sentrax_token || null;
      console.log('[SentraX BG] getStoredToken:', token ? 'found' : 'not found');
      resolve(token);
    });
  });
}

/**
 * Store JWT token in chrome storage
 */
async function storeToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ sentrax_token: token }, () => {
      console.log('[SentraX BG] Token stored in chrome.storage.local');
      resolve();
    });
  });
}

/**
 * Clear stored token
 */
async function clearToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove('sentrax_token', () => {
      resolve();
    });
  });
}

/**
 * Check URL against SentraX backend
 * @param {string} url - URL to check
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - { status, risk_score, threat_type, message }
 */
async function checkUrl(url, token) {
  try {
    // Don't check extension/chrome URLs
    if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) {
      return null;
    }

    const deviceId = await getStoredDeviceId();
    if (!deviceId) {
      console.warn('[SentraX BG] No device ID available, attempting to register...');
      await registerDevice(token);
    }

    const requestBody = { 
      url,
      device_id: deviceId 
    };

    console.log('[SentraX BG] Checking URL with device:', deviceId);

    const response = await fetch(API_BASE_URL + CHECK_URL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('API Error:', response.status);
      if (response.status === 401) {
        // Token expired or invalid
        await clearToken();
        return { error: 'Authentication failed. Please re-login.' };
      }
      return { error: 'Failed to check URL' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking URL:', error);
    return { error: error.message };
  }
}

/**
 * Store URL analysis result in chrome storage
 */
async function storeUrlAnalysis(url, analysis) {
  return new Promise((resolve) => {
    const key = `url_analysis_${url}`;
    chrome.storage.local.set(
      { [key]: { url, analysis, timestamp: Date.now() } },
      () => resolve()
    );
  });
}

/**
 * Get URL analysis from storage
 */
async function getUrlAnalysis(url) {
  return new Promise((resolve) => {
    const key = `url_analysis_${url}`;
    chrome.storage.local.get(key, (result) => {
      const item = result[key];
      if (item) {
        resolve(item);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Listen for tab updates and check URLs
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when page finishes loading
  if (changeInfo.status !== 'complete') return;

  // Skip certain URLs
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) return;

  // Skip blocked.html pages to avoid infinite redirects
  if (tab.url.includes('blocked.html')) return;

  try {
    const token = await getStoredToken();

    if (!token) {
      console.log('[SentraX BG] No token stored. User must login first.');
      return;
    }

    console.log(`[SentraX BG] 🔍 Checking URL (on complete): ${tab.url}`);
    const analysis = await checkUrl(tab.url, token);

    if (analysis && !analysis.error) {
      // 🚨 CHECK IF BLOCKED FIRST - Enforce blocking immediately
      if (analysis.blocked === true) {
        console.log('[SentraX BG] 🚨 BLOCKED SITE DETECTED (late check):', tab.url);
        console.log('[SentraX BG] Reason:', analysis.reason);
        redirectToBlockedPage(tabId, tab.url, analysis.reason);
        return; // Don't show notification, just redirect
      }

      // 🚨 CHECK IF DANGEROUS - Also block dangerous sites
      if (analysis.status === 'dangerous') {
        console.log('[SentraX BG] 🚨 DANGEROUS SITE DETECTED (late check):', tab.url);
        console.log('[SentraX BG] Risk Score:', analysis.risk_score);
        redirectToBlockedPage(tabId, tab.url, analysis.reason || `Dangerous site detected (Risk: ${analysis.risk_score}%)`);
        return; // Block it
      }

      // Send message to popup to update UI if open
      chrome.runtime.sendMessage({
        type: 'URL_ANALYSIS_COMPLETE',
        url: tab.url,
        analysis,
      }).catch(() => {
        // Popup not open, no need to handle
      });
    }
  } catch (error) {
    console.error('[SentraX BG] Error in tab update listener:', error);
  }
});

/**
 * Check URLs EARLY - before navigation completes
 * This provides faster blocking without showing page content
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only check main frame navigations (not iframes)
  if (details.frameId !== 0) return;

  // Skip certain URLs
  if (!details.url || details.url.startsWith('chrome://') || details.url.startsWith('about:')) return;
  if (details.url.includes('blocked.html')) return;

  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('[SentraX BG] No token for early check');
      return;
    }

    console.log(`[SentraX BG] 🔍 Early check (before navigation): ${details.url}`);
    const analysis = await checkUrl(details.url, token);

    if (analysis && !analysis.error) {
      // 🚨 BLOCK IF BLOCKED BY PARENT
      if (analysis.blocked === true) {
        console.log('[SentraX BG] 🚨 BLOCKED SITE DETECTED (early):', details.url);
        console.log('[SentraX BG] Reason:', analysis.reason);
        redirectToBlockedPage(details.tabId, details.url, analysis.reason);
        return;
      }

      // 🚨 BLOCK IF DANGEROUS (malware, phishing, etc)
      if (analysis.status === 'dangerous') {
        console.log('[SentraX BG] 🚨 DANGEROUS SITE DETECTED (early):', details.url);
        console.log('[SentraX BG] Risk Score:', analysis.risk_score);
        redirectToBlockedPage(details.tabId, details.url, analysis.reason || `Dangerous site detected (Risk: ${analysis.risk_score}%)`);
        return;
      }
    }
  } catch (error) {
    console.error('[SentraX BG] Error in early check:', error);
  }
});

/**
 * Redirect to blocked page
 * @param {number} tabId - Tab ID to redirect
 * @param {string} url - Blocked URL
 * @param {string} reason - Reason for blocking
 */
function redirectToBlockedPage(tabId, url, reason) {
  const blockedPageUrl = chrome.runtime.getURL('blocked.html') + 
    '?url=' + encodeURIComponent(url) + 
    '&reason=' + encodeURIComponent(reason);
  
  console.log('[SentraX BG] Redirecting to blocked page:', blockedPageUrl);
  
  chrome.tabs.update(tabId, { url: blockedPageUrl }, () => {
    if (chrome.runtime.lastError) {
      console.error('[SentraX BG] Error redirecting:', chrome.runtime.lastError);
    }
  });
}

/**
 * Listen for messages from popup and content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    console.log('[SentraX BG] Message received:', request?.type, 'from', sender?.url || 'popup');
    
    if (!request || !request.type) {
      console.error('[SentraX BG] Invalid request:', request);
      sendResponse({ error: 'Invalid request' });
      return false;
    }
    
    if (request.type === 'SYNC_TOKEN_FROM_PAGE') {
      // Content script detected token on frontend page
      if (!request.token) {
        console.error('[SentraX BG] No token in SYNC_TOKEN_FROM_PAGE');
        sendResponse({ success: false, error: 'No token provided' });
        return true;
      }
      
      console.log('[SentraX BG] Syncing token from page:', request.token.substring(0, 20) + '...');
      storeToken(request.token).then(() => {
        console.log('[SentraX BG] Token synced and stored successfully');
        sendResponse({ success: true });
      }).catch((err) => {
        console.error('[SentraX BG] Error storing token:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    if (request.type === 'GET_CURRENT_URL_ANALYSIS') {
      // Popup is requesting current URL analysis
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
          if (tabs.length === 0) {
            sendResponse({ error: 'No active tab' });
            return;
          }

          const currentUrl = tabs[0].url;
          const analysis = await getUrlAnalysis(currentUrl);

          if (analysis) {
            sendResponse({ url: currentUrl, analysis: analysis.analysis });
          } else {
            // No analysis yet, return pending
            sendResponse({ url: currentUrl, analysis: null, pending: true });
          }
        } catch (error) {
          console.error('[SentraX BG] Error in GET_CURRENT_URL_ANALYSIS:', error);
          sendResponse({ error: error.message });
        }
      });

      return true; // Will respond asynchronously
    }

    if (request.type === 'CHECK_URL_NOW') {
      // Popup requesting immediate check
      checkUrlNow(request.url, sendResponse);
      return true; // Will respond asynchronously
    }

    if (request.type === 'STORE_TOKEN') {
      // Store token from login popup
      storeToken(request.token).then(async () => {
        // Also register device when token is stored
        const deviceId = await getStoredDeviceId();
        if (!deviceId) {
          console.log('[SentraX BG] New token stored, registering device...');
          await registerDevice(request.token);
        }
        sendResponse({ success: true });
      }).catch((err) => {
        console.error('[SentraX BG] Error storing token:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    if (request.type === 'CLEAR_TOKEN') {
      // Clear token on logout
      clearToken().then(() => {
        // Also clear device ID on logout
        chrome.storage.local.remove('sentrax_device_id', () => {
          console.log('[SentraX BG] Token and device ID cleared');
        });
        sendResponse({ success: true });
      }).catch((err) => {
        console.error('[SentraX BG] Error clearing token:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    if (request.type === 'GET_TOKEN') {
      // Popup checking if token exists
      getStoredToken().then((token) => {
        const hasToken = !!token;
        console.log('[SentraX BG] GET_TOKEN request - token exists:', hasToken);
        sendResponse({ token: hasToken });
      }).catch((err) => {
        console.error('[SentraX BG] Error getting token:', err);
        sendResponse({ error: err.message });
      });
      return true;
    }
    
    console.warn('[SentraX BG] Unknown request type:', request.type);
    sendResponse({ error: 'Unknown request type' });
    return false;
  } catch (error) {
    console.error('[SentraX BG] Uncaught error in onMessage listener:', error);
    try {
      sendResponse({ error: error.message });
    } catch (e) {
      console.error('[SentraX BG] Failed to send error response:', e);
    }
    return false;
  }
});

/**
 * Check URL immediately
 */
async function checkUrlNow(url, sendResponse) {
  try {
    const token = await getStoredToken();

    if (!token) {
      sendResponse({ error: 'Not authenticated. Please login first.' });
      return;
    }

    const analysis = await checkUrl(url, token);
    await storeUrlAnalysis(url, analysis);
    sendResponse({ analysis });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

/**
 * On install, notify user to login
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('SentraX extension installed');
});
