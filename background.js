/**
 * Tệp: background.js
 * Chức năng: Xử lý logic fetch dữ liệu từ Investing.com dựa trên path động.
 */

const BASE_URL = "https://vn.investing.com/";

async function fetchIndexData(path, sendResponse) {
    const url = `${BASE_URL}${path}`;
    
    try {
        const response = await fetch(url, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        
        // 1. Regex lấy giá hiện tại
        const priceMatch = html.match(/instrument-price-last">([\d,]+\.?\d*)</);        
        
        // 2. Regex lấy giá trị thay đổi (+/-)
        let changeMatch = html.match(/instrument-price-change">([-+]?(?:)?[\d,]+\.?\d*)</);                
        const changeStr = changeMatch ? changeMatch[1].replace('', '') : null;        
        
        // 3. Regex lấy biên độ ngày (Range) - hỗ trợ cả tiếng Anh và tiếng Việt
        const rangeMatch = html.match(/(?:Biên độ ngày|Day&#x27;s Range)<\/div>\s*<div.*?>\s*<span>([\d,]+\.?\d*)<\/span>\s*<span>([\d,]+\.?\d*)<\/span>/);

        if (priceMatch && changeStr) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ""));
            const change = parseFloat(changeStr.replace(/,/g, ""));            
            
            // Tính toán % thay đổi dựa trên giá trị gốc
            const percent = ((change / (price - change)) * 100).toFixed(2);
            
            // Định dạng Range
            const range = rangeMatch ? `${rangeMatch[1]} - ${rangeMatch[2]}` : "Không tìm thấy";

            sendResponse({ 
                price, 
                change, 
                percent, 
                range,
                path 
            });
        } else {
            console.error(`[${path}] Không tìm thấy các selectors dữ liệu trên trang.`);
            sendResponse({ error: "Không tìm thấy dữ liệu trên trang!" });
        }
    } catch (error) {
        console.error(`[${path}] Lỗi khi fetch dữ liệu:`, error);
        sendResponse({ error: "Lỗi kết nối hoặc ID không tồn tại!" });
    }
}

/**
 * Lắng nghe thông điệp từ popup.js
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_data") {
        fetchIndexData(request.path, sendResponse);
        // Trả về true để thông báo hàm fetchIndexData sẽ gửi response bất đồng bộ
        return true;
    }
});