document.getElementById('capture').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const format = document.getElementById('format').value;
  
  // Lấy hình ảnh từ trang
  const {images} = await chrome.tabs.sendMessage(tab.id, {action: "getImages"});
  
  // Hiển thị hình ảnh để chọn
  const imageList = document.getElementById('imageList');
  imageList.innerHTML = '';
  
  images.forEach((img, index) => {
    const container = document.createElement('div');
    container.style.margin = '10px 0';
    
    const imgElement = document.createElement('img');
    imgElement.src = img.src;
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '150px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `img-${index}`;
    checkbox.dataset.src = img.src;
    
    const label = document.createElement('label');
    label.htmlFor = `img-${index}`;
    label.textContent = ` ${img.width}x${img.height}`;
    
    container.appendChild(checkbox);
    container.appendChild(imgElement);
    container.appendChild(label);
    imageList.appendChild(container);
  });
  
  // Thêm nút lưu
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Lưu hình đã chọn';
  saveBtn.onclick = () => {
    const checkboxes = document.querySelectorAll('#imageList input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      const imgUrl = checkbox.dataset.src;
      const filename = imgUrl.split('/').pop().split('?')[0];
      const ext = filename.split('.').pop();
      const newFilename = filename.replace(`.${ext}`, `.${format}`);
      
      chrome.downloads.download({
        url: imgUrl,
        filename: newFilename
      });
    });
  };
  imageList.appendChild(saveBtn);
});