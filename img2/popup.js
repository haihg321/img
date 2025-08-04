let images = [];
let selectedImages = new Set();

document.getElementById('scanBtn').addEventListener('click', scanPage);
document.getElementById('downloadAllBtn').addEventListener('click', downloadAll);
document.getElementById('downloadSelectedBtn').addEventListener('click', downloadSelected);

async function scanPage() {
  const resolution = document.getElementById('resolution').value;
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  
  loading.classList.remove('hidden');
  results.classList.add('hidden');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Get images from page
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getImages' });
    
    if (response && response.images) {
      images = filterImages(response.images, resolution);
      displayImages(images);
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } else {
      throw new Error('No images found on this page');
    }
  } catch (error) {
    loading.classList.add('hidden');
    alert(`Error: ${error.message}`);
  }
}

function filterImages(images, resolution) {
  return images.filter(img => {
    const size = Math.max(img.width, img.height);
    
    switch (resolution) {
      case 'high': return size >= 1000;
      case 'medium': return size >= 500 && size < 1000;
      case 'low': return size < 500;
      default: return true;
    }
  });
}

function displayImages(images) {
  const imageList = document.getElementById('imageList');
  const imageCount = document.getElementById('imageCount');
  const totalSize = document.getElementById('totalSize');
  
  imageList.innerHTML = '';
  selectedImages.clear();
  
  if (images.length === 0) {
    imageList.innerHTML = '<p class="no-images">No images found matching your criteria</p>';
    imageCount.textContent = '0 images found';
    totalSize.textContent = '0 MB';
    return;
  }
  
  // Calculate total size (estimate)
  let totalBytes = 0;
  
  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'image-item';
    item.dataset.index = index;
    
    // Estimate size based on resolution (very rough estimate)
    const sizeEstimate = img.width * img.height * 4; // 4 bytes per pixel (RGBA)
    totalBytes += sizeEstimate;
    
    item.innerHTML = `
      <img src="${img.src}" class="image-preview" onerror="this.src='${chrome.runtime.getURL('icons/image-error.png')}'">
      <div class="image-info">
        <div>${img.src.substring(0, 30)}${img.src.length > 30 ? '...' : ''}</div>
        <div class="image-resolution">${img.width} × ${img.height} px</div>
        <div class="image-size">~${formatFileSize(sizeEstimate)}</div>
      </div>
    `;
    
    item.addEventListener('click', () => toggleSelection(index));
    imageList.appendChild(item);
  });
  
  imageCount.textContent = `${images.length} image${images.length !== 1 ? 's' : ''} found`;
  totalSize.textContent = formatFileSize(totalBytes);
}

function toggleSelection(index) {
  const item = document.querySelector(`.image-item[data-index="${index}"]`);
  
  if (selectedImages.has(index)) {
    selectedImages.delete(index);
    item.classList.remove('selected');
  } else {
    selectedImages.add(index);
    item.classList.add('selected');
  }
  
  document.getElementById('downloadSelectedBtn').textContent = 
    `Download Selected (${selectedImages.size})`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadAll() {
  await downloadImages(images);
}

async function downloadSelected() {
  const selected = Array.from(selectedImages).map(i => images[i]);
  await downloadImages(selected);
}

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
        url = await convertImageFormat(url, format);
      }
      
      // Download the image
      chrome.downloads.download({
        url: url,
        filename: generateFilename(url, format),
        saveAs: false
      });
    } catch (error) {
      console.error(`Failed to download ${img.src}:`, error);
    }
  }
}

function generateFilename(url, format) {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const originalName = pathParts[pathParts.length - 1] || 'image';
  const nameWithoutExt = originalName.split('.')[0];
  
  return `${nameWithoutExt}.${format}`;
}

async function convertImageFormat(url, format) {
  // In a real extension, you would use a service worker or external API for conversion
  // This is a simplified version that just changes the extension
  return url;
}