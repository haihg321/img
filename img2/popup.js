async function downloadImages(imagesToDownload) {
  const format = document.getElementById('format').value;
  
  if (imagesToDownload.length === 0) {
    alert('No images selected to download');
    return;
  }
  
  for (const img of imagesToDownload) {
    try {
      let url = img.src;
      
      // If format conversion is needed
      if (format !== 'original') {
        const response = await chrome.runtime.sendMessage({
          action: "convertImage",
          url: img.src,
          format: format
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        url = response.convertedUrl;
      }
      
      // Download the image
      chrome.downloads.download({
        url: url,
        filename: generateFilename(url, format),
        saveAs: false
      });
    } catch (error) {
      console.error(`Failed to download ${img.src}:`, error);
      // Fallback to original image if conversion fails
      if (format !== 'original') {
        chrome.downloads.download({
          url: img.src,
          filename: generateFilename(img.src, 'original'),
          saveAs: false
        });
      }
    }
  }
}