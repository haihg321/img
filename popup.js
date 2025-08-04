// ... (phần trên giữ nguyên)

async function loadImages() {
  const imageList = document.getElementById('imageList');
  try {
    imageList.innerHTML = '<div class="p-4 text-center text-gray-500">Scanning images...</div>';
    
    // First try to execute content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content.js']
      });
    } catch (e) {
      console.log('Content script injection error:', e);
    }

    // Wait for content script to initialize
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Try to get images with timeout
    const response = await Promise.race([
      chrome.tabs.sendMessage(currentTab.id, { action: "getImages" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
    
    if (!response?.images?.length) {
      throw new Error(response?.error || 'No images found on this page');
    }
    
    allImages = response.images;
    renderImages();
    
  } catch (error) {
    console.error("Image load error:", error);
    showError(`Error: ${error.message}. Try refreshing the page.`);
  }
}

// ... (phần dưới giữ nguyên)