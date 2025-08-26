(function() {
  // Only run in iframe (dashboard preview)
  if (window.self === window.top) return;
  
  const logs = [];
  const MAX_LOGS = 500;
  
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };
  
  function captureLog(level, args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Error) return value.toString();
            return value;
          }, 2);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');
    
    const logEntry = {
      timestamp,
      level,
      message,
      url: window.location.href
    };
    
    logs.push(logEntry);
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    // Send to parent dashboard
    try {
      window.parent.postMessage({
        type: 'console-log',
        log: logEntry
      }, '*');
    } catch (e) {
      // Silent fail
    }
    
    // Call original console method
    originalConsole[level].apply(console, args);
  }
  
  // Override console methods
  console.log = function() { captureLog('log', Array.from(arguments)); };
  console.warn = function() { captureLog('warn', Array.from(arguments)); };
  console.error = function() { captureLog('error', Array.from(arguments)); };
  console.info = function() { captureLog('info', Array.from(arguments)); };
  console.debug = function() { captureLog('debug', Array.from(arguments)); };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    captureLog('error', ['Unhandled Error:', event.error || event.message]);
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    captureLog('error', ['Unhandled Promise Rejection:', event.reason]);
  });
  
  // Send ready message to dashboard
  function sendReady() {
    try {
      window.parent.postMessage({
        type: 'console-capture-ready',
        url: window.location.href,
        timestamp: new Date().toISOString()
      }, '*');
    } catch (e) {
      // Silent fail
    }
  }
  
  // Send route change message
  function sendRouteChange() {
    try {
      window.parent.postMessage({
        type: 'route-change',
        route: {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          href: window.location.href
        },
        timestamp: new Date().toISOString()
      }, '*');
    } catch (e) {
      // Silent fail
    }
  }
  
  // Monitor route changes
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(sendRouteChange, 0);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(sendRouteChange, 0);
  };
  
  window.addEventListener('popstate', sendRouteChange);
  window.addEventListener('hashchange', sendRouteChange);
  
  // Send ready message when loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      sendReady();
      sendRouteChange();
    });
  } else {
    sendReady();
    sendRouteChange();
  }
  
  // Also send on window load for safety
  window.addEventListener('load', function() {
    sendReady();
    sendRouteChange();
  });
})();