let selectionActive = false;
let selectionBox = null;
let selectedElements = new Set();

// Toggle selection mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleSelection") {
    selectionActive = !selectionActive;
    
    if (selectionActive) {
      startSelectionMode();
    } else {
      endSelectionMode();
    }
    
    sendResponse({ status: selectionActive });
  }
  return true;
});

function startSelectionMode() {
  document.body.style.cursor = 'crosshair';
  
  // Create selection box
  selectionBox = document.createElement('div');
  selectionBox.style.position = 'fixed';
  selectionBox.style.border = '2px dashed #3b82f6';
  selectionBox.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
  selectionBox.style.pointerEvents = 'none';
  selectionBox.style.display = 'none';
  document.body.appendChild(selectionBox);
  
  // Mouse events
  let startX, startY;
  
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  
  function onMouseDown(e) {
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
    selectionBox.style.display = 'block';
  }
  
  function onMouseMove(e) {
    if (!startX || !startY) return;
    
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
    selectionBox.style.left = `${width > 0 ? startX : e.clientX}px`;
    selectionBox.style.top = `${height > 0 ? startY : e.clientY}px`;
  }
  
  function onMouseUp() {
    if (!startX || !startY) return;
    
    // Get elements in selection box
    const rect = selectionBox.getBoundingClientRect();
    const elements = document.elementsFromPoint(
      rect.left + rect.width/2,
      rect.top + rect.height/2
    );
    
    // Find and select images
    elements.forEach(el => {
      const img = el.closest('img');
      if (img) {
        img.classList.add('image-selector-selected');
        selectedElements.add(img);
      }
    });
    
    // Reset selection
    startX = null;
    startY = null;
    selectionBox.style.display = 'none';
  }
}

function endSelectionMode() {
  document.body.style.cursor = '';
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

// Get high-res image URLs
function getSelectedImages() {
  return Array.from(selectedElements).map(img => {
    // Try to find high-res version
    let src = img.src;
    if (img.dataset.src) src = img.dataset.src;
    if (img.srcset) {
      const sources = img.srcset.split(',')
        .map(s => s.trim().split(' '))
        .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
      if (sources.length) src = sources[0][0];
    }
    return {
      src: src,
      alt: img.alt,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    };
  });
}