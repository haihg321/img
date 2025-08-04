let currentTab = null;
let allImages = [];
let selectedImages = new Set();

document.addEventListener('DOMContentLoaded', init);

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
    
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ['js/content.js']
    });

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

function renderImages() {
  const imageList = document.getElementById('imageList');
  const resolutionFilter = document.getElementById('resolutionFilter').value;
  
  let filteredImages = allImages;
  if (resolutionFilter !== 'all') {
    filteredImages = allImages.filter(img => {
      const minDimension = Math.min(img.width, img.height);
      if (resolutionFilter === 'high') return minDimension >= 1000;
      if (resolutionFilter === 'medium') return minDimension >= 500 && minDimension < 1000;
      if (resolutionFilter === 'low') return minDimension < 500;
      return true;
    });
  }

  imageList.innerHTML = filteredImages.length > 0 
    ? filteredImages.map(img => `
        <div class="image-item p-2 border-b flex items-center">
          <input 
            type="checkbox" 
            class="mr-2" 
            data-src="${img.src}"
            ${selectedImages.has(img.src) ? 'checked' : ''}
            onchange="updateSelection(this)"
          >
          <img src="${img.src}" class="w-12 h-12 object-cover mr-2">
          <div class="text-sm">
            <div>${img.width}×${img.height}</div>
            <div class="text-gray-500 truncate">${img.src.split('/').pop()}</div>
          </div>
        </div>
      `).join('')
    : '<div class="p-4 text-center text-gray-500">No images found matching filter</div>';
  
  updateDownloadButton();
}

function updateSelection(checkbox) {
  const src = checkbox.dataset.src;
  if (checkbox.checked) {
    selectedImages.add(src);
  } else {
    selectedImages.delete(src);
  }
  updateDownloadButton();
}

function updateDownloadButton() {
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.disabled = selectedImages.size === 0;
}

function showError(message) {
  document.getElementById('imageList').innerHTML = `
    <div class="p-4 text-center text-red-500">
      ${message}
    </div>
  `;
}

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

document.getElementById('resolutionFilter').addEventListener('change', renderImages);