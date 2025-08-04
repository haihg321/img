// Auto-inject content script when page loads
function collectImages() {
  return Array.from(document.images)
    .filter(img => img.src && img.src.startsWith('http'))
    .map(img => ({
      src: img.src,
      alt: img.alt || '',
      width: img.naturalWidth,
      height: img.naturalHeight,
      area: img.naturalWidth * img.naturalHeight
    }));
}

// Send images when popup requests them
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImages") {
    sendResponse({ images: collectImages() });
  }
  return true;
});

// Auto-refresh when page changes (SPA support)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "pageChanged" });
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });