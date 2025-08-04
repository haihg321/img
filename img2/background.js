// Background script for image conversion
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "convertImage") {
    convertImage(message.url, message.format)
      .then(convertedUrl => sendResponse({ convertedUrl }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

async function convertImage(url, format) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        let mimeType, quality;
        switch(format) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            quality = 0.92;
            break;
          case 'webp':
            mimeType = 'image/webp';
            quality = 0.80;
            break;
          case 'png':
          default:
            mimeType = 'image/png';
        }
        
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}