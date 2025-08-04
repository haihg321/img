let currentTab = null;
let allImages = [];
let selectedImages = new Set();

// Get current tab and load images immediately
async function init() {
  [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (currentTab?.id) {
    loadImages();
  }
}

// Load images from current tab
async function loadImages() {
  try {
    const imageList = document.getElementById('imageList');
    imageList.innerHTML = '<div class="p-4 text-center text-gray-500">Loading images...</div>';
    
    const { images } = await chrome.tabs.sendMessage(currentTab.id, { action: "getImages" });
    allImages = images || [];
    renderImages();
  } catch (error) {
    document.getElementById('imageList').innerHTML = `
      <div class="p-4 text-center text-red-500">
        Error loading images. Please refresh the page.
      </div>
    `;
  }
}

// Filter and render images based on selected resolution
function renderImages() {
  const resolutionFilter = document.getElementById('resolutionFilter').value;
  const imageList = document.getElementById('imageList');
  
  let filteredImages = [...allImages];
  
  // Apply resolution filter
  if (resolutionFilter === 'high') {
    filteredImages = filteredImages.filter(img => img.area >= 1000000); // 1000x1000
  } else if (resolutionFilter === 'medium') {
    filteredImages = filteredImages.filter(img => img.area >= 250000 && img.area < 1000000); // 500x500 to 999x999
  } else if (resolutionFilter === 'low') {
    filteredImages = filteredImages.filter(img => img.area < 250000); // <500x500
  }
  
  if (filteredImages.length === 0) {
    imageList.innerHTML = '<div class="p-4 text-center text-gray-500">No images found</div>';
    return;
  }
  
  imageList.innerHTML = '';
  filteredImages.forEach((img, index) => {
    const isSelected = selectedImages.has(img.src);
    const imgElement = document.createElement('div');
    imgElement.className = `image-item p-2 rounded flex items-center space-x-2 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`;
    imgElement.innerHTML = `
      <input 
        type="checkbox" 
        id="img-${index}" 
        class="form-checkbox h-4 w-4 text-blue-600" 
        ${isSelected ? 'checked' : ''}
        data-src="${img.src}"
      >
      <img 
        src="${img.src}" 
        class="w-16 h-16 object-cover rounded border"
        onerror="this.style.display='none'"
      >
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900 truncate">${img.alt || 'No description'}</div>
        <div class="text-xs text-gray-500">${img.width}×${img.height}px</div>
      </div>
    `;
    
    imgElement.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = imgElement.querySelector('input');
        checkbox.checked = !checkbox.checked;
        updateSelection(checkbox);
      }
    });
    
    const checkbox = imgElement.querySelector('input');
    checkbox.addEventListener('change', (e) => updateSelection(e.target));
    
    imageList.appendChild(imgElement);
  });
  
  updateDownloadButton();
}

// Update selected images set
function updateSelection(checkbox) {
  const src = checkbox.dataset.src;
  if (checkbox.checked) {
    selectedImages.add(src);
  } else {
    selectedImages.delete(src);
  }
  updateDownloadButton();
}

// Update download button state
function updateDownloadButton() {
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.disabled = selectedImages.size === 0;
}

// Download selected images
document.getElementById('downloadBtn').addEventListener('click', () => {
  const format = document.getElementById('format').value;
  
  selectedImages.forEach(src => {
    const filename = src.split('/').pop().split('?')[0];
    const ext = filename.split('.').pop();
    const newFilename = filename.replace(`.${ext}`, `.${format}`);
    
    chrome.downloads.download({
      url: src,
      filename: newFilename
    });
  });
  
  // Close popup after download starts
  window.close();
});

// Handle resolution filter change
document.getElementById('resolutionFilter').addEventListener('change', renderImages);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Listen for page changes in SPA
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "pageChanged" && currentTab?.id) {
    loadImages();
  }
});