function collectImages() {
  const images = Array.from(document.images);
  const results = [];
  
  for (const img of images) {
    try {
      if (img.src && img.src.startsWith('http')) {
        // Try to get natural dimensions first, fall back to displayed dimensions
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        
        if (width > 0 && height > 0) { // Only include valid images
          results.push({
            src: img.src,
            width: width,
            height: height
          });
        }
      }
    } catch (e) {
      console.warn('Error processing image:', e);
    }
  }
  
  return results;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImages") {
    sendResponse({ images: collectImages() });
  }
});