/**
 * SentraX Browser Extension - Popup Script
 * Handles UI interactions and messaging with background service worker
 */

// DOM Elements
const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');
const loginState = document.getElementById('loginState');
const mainState = document.getElementById('mainState');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const checkNowButton = document.getElementById('checkNowButton');
const copyButton = document.getElementById('copyButton');
const urlText = document.getElementById('urlText');
const statusSection = document.getElementById('statusSection');
const safeStatus = document.getElementById('safeStatus');
const suspiciousStatus = document.getElementById('suspiciousStatus');
const dangerousStatus = document.getElementById('dangerousStatus');
const threatDetails = document.getElementById('threatDetails');
const threatType = document.getElementById('threatType');
const errorMessage = document.getElementById('errorMessage');
const noAnalysis = document.getElementById('noAnalysis');

/**
 * Initialize popup on open
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[SentraX Popup] Initialized');
  console.log('[SentraX Popup] DOM elements loaded:', {
    loadingState: !!loadingState,
    loginState: !!loginState,
    successState: !!successState,
    mainState: !!mainState
  });
  
  // Ensure all states are hidden initially (except one)
  loadingState.classList.add('hidden');
  successState.classList.add('hidden');
  mainState.classList.add('hidden');
  
  // Check if user is authenticated
  checkAuthenticationStatus();
  
  // Also poll for token changes while popup is open
  const pollInterval = setInterval(() => {
    console.log('[SentraX Popup] Polling for token changes...');
    checkAuthenticationStatus();
  }, 500);
  
  // Clear interval when popup closes
  window.addEventListener('beforeunload', () => {
    clearInterval(pollInterval);
  });
});

/**
 * Listen for storage changes (token sync from background)
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log('[SentraX Popup] Storage changed:', areaName, 'keys:', Object.keys(changes));
  
  if (areaName === 'local' && changes.sentrax_token) {
    console.log('[SentraX Popup] Token changed in storage!', changes.sentrax_token.newValue ? 'NEW TOKEN' : 'TOKEN CLEARED');
    
    // Immediately re-check authentication
    setTimeout(() => {
      console.log('[SentraX Popup] Storage listener detected token change, checking auth...');
      checkAuthenticationStatus();
    }, 100);
  }
});

/**
 * Check authentication status
 */
function checkAuthenticationStatus() {
  chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[SentraX Popup] Error getting token:', chrome.runtime.lastError);
      console.log('[SentraX Popup] Background not ready, showing login view');
      showLoginView();
      return;
    }
    
    const hasToken = response?.token;
    console.log('[SentraX Popup] Token check result:', hasToken ? 'TOKEN EXISTS ✅' : 'NO TOKEN ❌', 'Response:', response);
    
    // Get current UI state
    const loginHidden = loginState.classList.contains('hidden');
    const mainHidden = mainState.classList.contains('hidden');
    const successHidden = successState.classList.contains('hidden');
    
    console.log('[SentraX Popup] Current UI state - login:', !loginHidden, 'main:', !mainHidden, 'success:', !successHidden);
    
    if (hasToken) {
      // User is logged in, show main view
      console.log('[SentraX Popup] User authenticated, showing main view');
      if (!mainHidden) {
        // Already showing main, just refresh analysis
        loadCurrentUrlAnalysis();
      } else {
        showMainView();
        loadCurrentUrlAnalysis();
      }
    } else {
      // No token, show login
      console.log('[SentraX Popup] No token found, showing login view');
      showLoginView();
    }
  });
}

/**
 * Show login state
 */
function showLoginView() {
  loadingState.classList.add('hidden');
  mainState.classList.add('hidden');
  successState.classList.add('hidden');
  loginState.classList.remove('hidden');
}

/**
 * Show success state
 */
function showLoginSuccessMessage() {
  loadingState.classList.add('hidden');
  mainState.classList.add('hidden');
  loginState.classList.add('hidden');
  successState.classList.remove('hidden');
}

/**
 * Show main state
 */
function showMainView() {
  loadingState.classList.add('hidden');
  loginState.classList.add('hidden');
  successState.classList.add('hidden');
  mainState.classList.remove('hidden');
}

/**
 * Load current URL analysis
 */
async function loadCurrentUrlAnalysis() {
  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      showError('No active tab found');
      return;
    }

    const currentUrl = tabs[0].url;
    urlText.textContent = extractDomain(currentUrl);

    // Request analysis from background
    chrome.runtime.sendMessage(
      { type: 'GET_CURRENT_URL_ANALYSIS' },
      (response) => {
        if (response.error) {
          showError(response.error);
          return;
        }

        if (response.analysis) {
          displayAnalysis(response.analysis);
        } else if (response.pending) {
          showPending();
        }
      }
    );
  } catch (error) {
    showError('Error loading URL: ' + error.message);
  }
}

/**
 * Display URL analysis results
 */
function displayAnalysis(analysis) {
  if (!analysis || analysis.error) {
    showError(analysis?.error || 'Analysis error');
    return;
  }

  noAnalysis.classList.add('hidden');
  statusSection.classList.remove('hidden');
  errorMessage.classList.add('hidden');

  // Clear previous status
  safeStatus.classList.add('hidden');
  suspiciousStatus.classList.add('hidden');
  dangerousStatus.classList.add('hidden');
  threatDetails.classList.add('hidden');

  const status = analysis.status?.toLowerCase();
  const risk = analysis.risk_score || 0;

  switch (status) {
    case 'safe':
      safeStatus.classList.remove('hidden');
      document.getElementById('safeRisk').textContent = risk;
      break;

    case 'suspicious':
      suspiciousStatus.classList.remove('hidden');
      document.getElementById('suspiciousRisk').textContent = risk;
      if (analysis.threat_type) {
        threatDetails.classList.remove('hidden');
        threatType.textContent = analysis.threat_type;
      }
      break;

    case 'dangerous':
      dangerousStatus.classList.remove('hidden');
      document.getElementById('dangerousRisk').textContent = risk;
      if (analysis.threat_type) {
        threatDetails.classList.remove('hidden');
        threatType.textContent = analysis.threat_type;
      }
      break;

    default:
      showError('Unknown status: ' + status);
  }
}

/**
 * Show pending state
 */
function showPending() {
  noAnalysis.classList.remove('hidden');
  statusSection.classList.add('hidden');
  errorMessage.classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
  noAnalysis.classList.add('hidden');
  statusSection.classList.add('hidden');
  errorMessage.classList.remove('hidden');
  errorMessage.textContent = '❌ ' + message;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.substring(0, 50) + (url.length > 50 ? '...' : '');
  }
}

/**
 * Copy URL to clipboard
 */
copyButton.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    const url = tabs[0].url;
    navigator.clipboard.writeText(url).then(() => {
      copyButton.textContent = '✓';
      setTimeout(() => {
        copyButton.textContent = '📋';
      }, 2000);
    });
  }
});

/**
 * Check URL now button
 */
checkNowButton.addEventListener('click', async () => {
  checkNowButton.disabled = true;
  checkNowButton.textContent = 'Checking...';

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      showError('No active tab');
      return;
    }

    const url = tabs[0].url;

    chrome.runtime.sendMessage(
      { type: 'CHECK_URL_NOW', url },
      (response) => {
        if (response.error) {
          showError(response.error);
        } else if (response.analysis) {
          displayAnalysis(response.analysis);
        }
        checkNowButton.disabled = false;
        checkNowButton.textContent = 'Check Now';
      }
    );
  } catch (error) {
    showError('Error: ' + error.message);
    checkNowButton.disabled = false;
    checkNowButton.textContent = 'Check Now';
  }
});

/**
 * Login button - open login page
 */
loginButton.addEventListener('click', () => {
  // Open frontend login in new tab
  chrome.tabs.create({
    url: 'http://localhost:5173/login',
  });
});

/**
 * Logout button
 */
logoutButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' }, () => {
      showLoginView();
    });
  }
});

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'URL_ANALYSIS_COMPLETE') {
    // Background script sent new analysis
    displayAnalysis(request.analysis);
  }
});
