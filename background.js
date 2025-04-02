const VN_INDEX_URL = "https://www.investing.com/indices/vn";
const VN30_INDEX_URL = "https://www.investing.com/indices/vn-30";
const DOW_JONES_URL = "https://www.investing.com/indices/us-30";
const SP500_INDEX_URL = "https://www.investing.com/indices/us-spx-500";
const NASDAQ_INDEX_URL = "https://www.investing.com/indices/nasdaq-composite";

async function fetchIndexData(url, sendResponse) {
    // Giữ nguyên hàm này
    try {
        let response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        let html = await response.text();
        
        let priceMatch = html.match(/instrument-price-last">([\d,]+\.?\d*)</);        
        let changeMatch = html.match(/instrument-price-change">([-+]?(?:<!-- -->)?[\d,]+\.?\d*)</);                
        changeMatch = changeMatch ? changeMatch[1].replace('<!-- -->', '') : null;        
        let rangeMatch = html.match(/Day&#x27;s Range<\/div>\s*<div.*?>\s*<span>([\d,]+\.\d+)<\/span>\s*<span>([\d,]+\.\d+)<\/span>/);

        if (priceMatch && changeMatch) {
            let price = parseFloat(priceMatch[1].replace(/,/g, ""));
            let change = parseFloat(changeMatch.replace(/,/g, ""));            
            let percent = ((change / (price - change)) * 100).toFixed(2);
            let range = rangeMatch ? `${rangeMatch[1]} - ${rangeMatch[2]}` : "Không tìm thấy";

            sendResponse({ price, change, percent, range });
        } else {
            console.error("Không tìm thấy dữ liệu trên trang!");
            sendResponse({ price: "Không tìm thấy dữ liệu", change: "", range: "Không tìm thấy" });
        }
    } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
        sendResponse({ price: "Lỗi kết nối!", change: "", range: "Không tìm thấy" });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_vnindex") {
        fetchIndexData(VN_INDEX_URL, sendResponse);
        return true;
    }
    if (request.action === "get_vn30index") {
        fetchIndexData(VN30_INDEX_URL, sendResponse);
        return true;
    }
    if (request.action === "get_dowjones") {
        fetchIndexData(DOW_JONES_URL, sendResponse);
        return true;
    }
    if (request.action === "get_sp500") {
        fetchIndexData(SP500_INDEX_URL, sendResponse);
        return true;
    }
    if (request.action === "get_nasdaq") {
        fetchIndexData(NASDAQ_INDEX_URL, sendResponse);
        return true;
    }
});