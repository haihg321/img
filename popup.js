// ... (giữ nguyên phần code trước đó cho đến phần download)

// Download selected images
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const format = document.getElementById('format').value;
  const downloadBtn = document.getElementById('downloadBtn');
  
  // Disable button during download
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Downloading...';
  
  try {
    // Process images sequentially
    for (const src of selectedImages) {
      await downloadImage(src, format);
    }
  } catch (error) {
    console.error('Download error:', error);
  } finally {
    // Close popup after download
    window.close();
  }
});

// Function to convert and download image
async function downloadImage(src, format) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const filename = src.split('/').pop().split('?')[0];
          const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
          const newFilename = `${nameWithoutExt}.${format}`;
          
          const blobUrl = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: blobUrl,
            filename: newFilename
          }, () => {
            URL.revokeObjectURL(blobUrl);
            resolve();
          });
        }, `image/${format}`, 0.92); // 0.92 = quality
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}