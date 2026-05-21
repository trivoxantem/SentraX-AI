/**
 * SentraX Extension - Content Script
 * Runs on frontend pages and bridges communication between page and extension
 * Detects JWT token in localStorage and forwards to extension storage
 */

console.log('[SentraX Content Script] Injected on page:', window.location.href);

// Function to get and sync token
function syncTokenToExtension() {
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') ||
                localStorage.getItem('sentrax_token');
  
  if (token) {
    console.log('[SentraX Content Script] Found token, syncing to extension:', token.substring(0, 20) + '...');
    
    chrome.runtime.sendMessage(
      {
        type: 'SYNC_TOKEN_FROM_PAGE',
        token: token,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[SentraX Content Script] Error syncing token:', chrome.runtime.lastError);
        } else if (response?.success) {
          console.log('[SentraX Content Script] Token synced successfully');
        }
      }
    );
  } else {
    console.log('[SentraX Content Script] No token found in localStorage');
  }
}

// Sync token on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[SentraX Content Script] Page DOMContentLoaded, checking for token');
    syncTokenToExtension();
  });
} else {
  console.log('[SentraX Content Script] Page already loaded, checking for token');
  syncTokenToExtension();
}

// Listen for storage changes
window.addEventListener('storage', (event) => {
  console.log('[SentraX Content Script] Storage event:', event.key);
  if (event.key === 'access_token' || event.key === 'token' || event.key === 'sentrax_token') {
    const token = event.newValue;
    if (token) {
      console.log('[SentraX Content Script] Token changed, syncing:', token.substring(0, 20) + '...');
      syncTokenToExtension();
    }
  }
});

// Poll for token every 500ms (helps catch rapid token updates)
let pollCount = 0;
const pollInterval = setInterval(() => {
  pollCount++;
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') ||
                localStorage.getItem('sentrax_token');
  
  if (token) {
    console.log('[SentraX Content Script] Poll #' + pollCount + ' found token, syncing');
    syncTokenToExtension();
    clearInterval(pollInterval);
  } else if (pollCount < 20) {
    // Poll for max 10 seconds
    console.log('[SentraX Content Script] Poll #' + pollCount + ' - no token yet');
  } else {
    clearInterval(pollInterval);
  }
}, 500);

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[SentraX Content Script] Received message:', request.type);
  if (request.type === 'GET_PAGE_TOKEN') {
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('sentrax_token');
    console.log('[SentraX Content Script] GET_PAGE_TOKEN - token exists:', !!token);
    sendResponse({ token: token || null });
  }
});

