// Background script for better message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pageChanged") {
    // Handle SPA navigation changes
    chrome.tabs.sendMessage(sender.tab.id, { action: "getImages" })
      .then(sendResponse)
      .catch(error => {
        console.error("Background error:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});