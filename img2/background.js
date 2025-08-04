// Background script for handling messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "convertImage") {
    // In a real extension, you would handle image conversion here
    // For now, we'll just pass through the original URL
    sendResponse({ convertedUrl: message.url });
  }
  return true;
});