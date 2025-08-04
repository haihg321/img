let selectedImages = [];

document.getElementById('selectBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Toggle selection mode
  const { status } = await chrome.tabs.sendMessage(tab.id, { 
    action: "toggleSelection" 
  });
  
  if (status) {
    // Get selected images when selection mode is turned off
    const images = await chrome.tabs.sendMessage(tab.id, {
      action: "getSelectedImages"
    });
    
    selectedImages = images;
    renderPreview(images);
  }
});

function renderPreview(images) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = images.map(img => `
    <div class="border p-2">
      <img src="${img.src}" class="w-full h-24 object-contain">
      <div class="text-xs mt-1">
        ${img.naturalWidth}×${img.naturalHeight}
      </div>
    </div>
  `).join('');
  
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.classList.toggle('hidden', !images.length);
  downloadBtn.textContent = `Download Selected (${images.length})`;
}