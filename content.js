// Gửi tất cả hình ảnh về popup khi được yêu cầu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImages") {
    const images = Array.from(document.images).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
    sendResponse({images});
  }
});