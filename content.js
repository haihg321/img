// Improved image collection with better error handling
function collectImages() {
  try {
    const images = Array.from(document.images);
    const results = [];
    
    for (const img of images) {
      try {
        if (img.src && img.src.startsWith('http')) {
          results.push({
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            area: (img.naturalWidth || img.width) * (img.naturalHeight || img.height)
          });
        }
      } catch (e) {
        console.warn('Error processing image:', e);
      }
    }
    return results;
  } catch (error) {
    console.error('Collection error:', error);
    return [];
  }
}

// Enhanced message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImages") {
    sendResponse({ 
      success: true,
      images: collectImages(),
      tabId: sender.tab.id 
    });
  }
  return true; // Keep port open for async response
});

// More reliable SPA detection
let lastHref = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    chrome.runtime.sendMessage({ 
      action: "pageChanged",
      href: location.href
    });
  }
});

observer.observe(document, {
  subtree: true,
  childList: true,
  attributes: true,
  characterData: true
});