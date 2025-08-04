let currentTab = null;
let allImages = [];
let selectedImages = new Set();

async function init() {
  try {
    [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!currentTab?.id) {
      showError("No active tab found");
      return;
    }
    await loadImages();
  } catch (error) {
    showError("Failed to initialize: " + error.message);
  }
}

async function loadImages() {
  const imageList = document.getElementById('imageList');
  try {
    imageList.innerHTML = '<div class="p-4 text-center text-gray-500">Loading images...</div>';
    
    // Inject content script if not already injected
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ['content.js']
    });

    // Give content script time to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = await chrome.tabs.sendMessage(currentTab.id, { action: "getImages" });
    if (!response?.images) {
      throw new Error("No images received");
    }
    
    allImages = response.images;
    renderImages();
  } catch (error) {
    console.error("Load images error:", error);
    showError("Failed to load images. Please refresh the page and try again.");
  }
}

function showError(message) {
  document.getElementById('imageList').innerHTML = `
    <div class="p-4 text-center text-red-500">
      ${message}
    </div>
  `;
}

// ... (giữ nguyên các hàm renderImages, updateSelection, updateDownloadButton)

// Download selected images
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const format = document.getElementById('format').value;
  const downloadBtn = document.getElementById('downloadBtn');
  
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Downloading...';
  
  try {
    for (const src of selectedImages) {
      try {
        await downloadImage(src, format);
      } catch (error) {
        console.error(`Failed to download ${src}:`, error);
      }
    }
  } finally {
    window.close();
  }
});

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
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          
          const filename = src.split('/').pop().split('?')[0];
          const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
          const newFilename = `${nameWithoutExt}.${format}`;
          
          const blobUrl = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: blobUrl,
            filename: newFilename,
            conflictAction: 'uniquify'
          }, () => {
            URL.revokeObjectURL(blobUrl);
            resolve();
          });
        }, `image/${format}`, 0.92);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// ... (phần còn lại giữ nguyên)