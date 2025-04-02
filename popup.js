document.addEventListener("DOMContentLoaded", () => {
    // Khởi tạo giao diện ban đầu
    document.getElementById("range-low").textContent = "";
    document.getElementById("range-high").textContent = "";
    document.getElementById("vn30-range-low").textContent = "";
    document.getElementById("vn30-range-high").textContent = "";
    document.getElementById("dowjones-range-low").textContent = "";
    document.getElementById("dowjones-range-high").textContent = "";
    document.getElementById("sp500-range-low").textContent = "";
    document.getElementById("sp500-range-high").textContent = "";
    document.getElementById("nasdaq-range-low").textContent = "";
    document.getElementById("nasdaq-range-high").textContent = "";
  
    // Hàm xử lý dữ liệu và hiển thị
    function displayIndexData(elementIds, response) {
        const dataElement = document.getElementById(elementIds.dataId);
        const sectionElement = dataElement.closest('.index-section');
  
        // Gỡ class loading từ index-data và index-section
        dataElement.classList.remove("loading");
        sectionElement.classList.remove("loading");
  
        if (!response || !response.price) {
            dataElement.textContent = "Lỗi kết nối!";
            return;
        }
  
        if (isNaN(response.price) || isNaN(response.change) || isNaN(response.percent)) {
            dataElement.textContent = "Dữ liệu lỗi!";
            return;
        }
  
        let price = response.price;
        let change = response.change;
        let percent = response.percent;
        let range = response.range;
  
        let color = change > 0 ? "green" : change < 0 ? "red" : "black";
  
        // Cập nhật toàn bộ dữ liệu trong một span duy nhất
        dataElement.innerHTML = `
            <span style="color: ${color};">${price.toLocaleString("en-US")} | ${change.toLocaleString("en-US")} (${percent}%)</span>
        `;
  
        if (range && range.includes(" - ")) {
            let [low, high] = range.split(" - ").map(val => parseFloat(val.replace(/,/g, "")));
            document.getElementById(elementIds.rangeLow).textContent = low.toLocaleString("en-US", { minimumFractionDigits: 2 });
            document.getElementById(elementIds.rangeHigh).textContent = high.toLocaleString("en-US", { minimumFractionDigits: 2 });
  
            let rangeWidth = high - low;
            let pricePosition = ((price - low) / rangeWidth) * 100;
            pricePosition = Math.max(0, Math.min(100, pricePosition));
            document.getElementById(elementIds.priceMarker).style.left = `${pricePosition}%`;
        } else {
            document.getElementById(elementIds.rangeLow).textContent = "Không tìm thấy";
            document.getElementById(elementIds.rangeHigh).textContent = "";
        }
    }
  
    // Comment các dòng gửi message để test loading
    chrome.runtime.sendMessage({ action: "get_vnindex" }, (response) => {
        console.log('response: ', response);
        displayIndexData({
            dataId: "index-data",
            rangeLow: "range-low",
            rangeHigh: "range-high",
            priceMarker: "price-marker"
        }, response);
    });
  
    chrome.runtime.sendMessage({ action: "get_vn30index" }, (response) => {
        displayIndexData({
            dataId: "vn30-index-data",
            rangeLow: "vn30-range-low",
            rangeHigh: "vn30-range-high",
            priceMarker: "vn30-price-marker"
        }, response);
    });
  
    chrome.runtime.sendMessage({ action: "get_dowjones" }, (response) => {
        displayIndexData({
            dataId: "dowjones-index-data",
            rangeLow: "dowjones-range-low",
            rangeHigh: "dowjones-range-high",
            priceMarker: "dowjones-price-marker"
        }, response);
    });
  
    chrome.runtime.sendMessage({ action: "get_sp500" }, (response) => {
        displayIndexData({
            dataId: "sp500-index-data",
            rangeLow: "sp500-range-low",
            rangeHigh: "sp500-range-high",
            priceMarker: "sp500-price-marker"
        }, response);
    });
  
    chrome.runtime.sendMessage({ action: "get_nasdaq" }, (response) => {
        displayIndexData({
            dataId: "nasdaq-index-data",
            rangeLow: "nasdaq-range-low",
            rangeHigh: "nasdaq-range-high",
            priceMarker: "nasdaq-price-marker"
        }, response);
    });
  });