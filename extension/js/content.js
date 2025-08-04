// Selection mode
let selectionActive = false;
let selectedElements = [];

// Toggle selection mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleSelection") {
    selectionActive = !selectionActive;
    document.body.style.cursor = selectionActive ? "crosshair" : "";
    if (!selectionActive) {
      highlightSelectedElements();
    }
    sendResponse({ status: selectionActive });
  }
  return true;
});

// Element selection logic
document.addEventListener('click', (e) => {
  if (!selectionActive) return;
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target.closest('img');
  if (element) {
    element.classList.toggle('image-selector-selected');
    const index = selectedElements.indexOf(element);
    if (index === -1) {
      selectedElements.push(element);
    } else {
      selectedElements.splice(index, 1);
    }
  }
}, true);

// Get high-res image URLs
function getSelectedImages() {
  return selectedElements.map(img => {
    // Try to find high-res version
    let src = img.src;
    if (img.dataset.src) src = img.dataset.src; // For lazy-loaded images
    if (img.srcset) {
      // Get largest image from srcset
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