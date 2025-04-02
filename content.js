(() => {
    let indexElement = document.querySelector('[data-test="instrument-price-last"]');
    let vnIndex = indexElement ? indexElement.textContent.trim() : "Không tìm thấy dữ liệu";

    console.log("VN-Index:", vnIndex); // Kiểm tra xem có lấy đúng dữ liệu không
    chrome.runtime.sendMessage({ action: "vnindex_data", index: vnIndex });
})();
