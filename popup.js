document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("watchlist-container");
    const input = document.getElementById("id-input");
    const addBtn = document.getElementById("add-btn");

    const COLOR_MAP = {
        'bg-white': '⚪',
        'bg-blue': '🔵',
        'bg-green': '🟢',
        'bg-yellow': '🟡'
    };

    const COLORS = Object.keys(COLOR_MAP);

    // 1. Khởi tạo
    chrome.storage.local.get({ 
        watchlist: [
            { path: "indices/vn", color: "bg-white" },
            { path: "indices/vn-30", color: "bg-white" }
        ] 
    }, (data) => {
        data.watchlist.forEach(item => createAndFetch(item.path, item.color));
    });

    // 2. Thêm mới
    addBtn.addEventListener("click", () => {
        let path = input.value.trim().toLowerCase().replace(/^\/+/, '');
        if (!path) return;

        chrome.storage.local.get({ watchlist: [] }, (data) => {
            if (data.watchlist.some(i => i.path === path)) return;
            const newItem = { path: path, color: "bg-white" };
            const newList = [...data.watchlist, newItem];
            chrome.storage.local.set({ watchlist: newList }, () => {
                createAndFetch(path, "bg-white");
                input.value = "";
            });
        });
    });

    function createAndFetch(path, savedColor) {
        const container = document.getElementById("watchlist-container");
        const safeId = path.replace(/\//g, "-");
        const displayName = path.split('/').pop().toUpperCase();
        
        // URL gốc từ Investing.com
        const originalUrl = `https://vn.investing.com/${path}`;

        const section = document.createElement("div");
        section.className = `index-section ${savedColor || 'bg-white'} loading-shimmer`;
        section.id = `section-${safeId}`;
        section.setAttribute("draggable", "true");
        section.dataset.path = path;

        section.innerHTML = `
            <div class="header-row">
                <a href="${originalUrl}" target="_blank" style="text-decoration: none; display: flex; align-items: center;">
                    <span class="title" title="Mở trên Investing.com" style="cursor: pointer;">☰ ${displayName}</span>
                </a>
                <span class="price-main">--</span>
            </div>
            <div class="data-row">
                <div class="change-sub">Đang tải...</div>
                <div class="action-group">
                    <select class="color-select">
                        <option value="bg-white">⚪</option>
                        <option value="bg-blue">🔵</option>
                        <option value="bg-green">🟢</option>
                        <option value="bg-yellow">🟡</option>
                    </select>
                    <button class="remove-btn" title="Xóa">✕</button>
                </div>
            </div>
            <div class="range-container">
                <div class="range-bar-wrapper">
                    <div class="range-bar"></div>
                    <div class="price-marker" style="display:none"></div>
                </div>
                <div class="range-labels">
                    <span class="low">--</span>
                    <span class="high">--</span>
                </div>
            </div>
        `;
        
        container.appendChild(section);
    
        // 2. Thiết lập các sự kiện tương tác
        const colorSelect = section.querySelector('.color-select');
        colorSelect.value = savedColor || 'bg-white';
        
        colorSelect.onchange = (e) => {
            const newColor = e.target.value;
            // Xóa các class màu cũ và thêm màu mới
            ['bg-white', 'bg-blue', 'bg-green', 'bg-yellow'].forEach(c => section.classList.remove(c));
            section.classList.add(newColor);
            saveCurrentState(); // Hàm lưu lại thứ tự và màu sắc vào storage
        };
    
        section.querySelector(".remove-btn").onclick = () => {
            section.remove();
            saveCurrentState();
        };
    
        // Kích hoạt tính năng Drag & Drop cho thẻ mới
        if (typeof addDragEvents === "function") {
            addDragEvents(section);
        }
    
        // 3. Gọi dữ liệu từ background script
        chrome.runtime.sendMessage({ action: "get_data", path: path }, (response) => {
            // Tắt hiệu ứng quét shimmer khi có dữ liệu hoặc lỗi
            section.classList.remove("loading-shimmer");
            
            if (response && !response.error) {
                updateUI(safeId, response);
            } else {
                section.querySelector(".price-main").textContent = "Lỗi";
                section.querySelector(".change-sub").textContent = response?.error || "Không có dữ liệu";
            }
        });
    }

    function saveCurrentState() {
        const sections = [...container.querySelectorAll('.index-section')];
        const newState = sections.map(s => ({
            path: s.dataset.path,
            color: COLORS.find(c => s.classList.contains(c)) || "bg-white"
        }));
        chrome.storage.local.set({ watchlist: newState });
    }

    // Các hàm addDragEvents, getDragAfterElement, updateUI (Giữ nguyên như cũ)
    function addDragEvents(el) {
        el.addEventListener('dragstart', () => el.classList.add('dragging'));
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            saveCurrentState();
        });
    }

    container.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = (y => {
            const els = [...container.querySelectorAll('.index-section:not(.dragging)')];
            return els.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        })(e.clientY);
        if (afterElement == null) container.appendChild(dragging);
        else container.insertBefore(dragging, afterElement);
    });

    function updateUI(safeId, response) {
        const section = document.getElementById(`section-${safeId}`);
        if (!section || response.error) return;
        
        const { price, change, percent, range } = response;
        const isUp = change >= 0;
        const symbol = isUp ? "▲" : "▼";
        const colorCode = isUp ? "#198754" : "#dc3545"; // Màu xanh/đỏ chuẩn Flat
    
        // 1. Cập nhật giá chính và màu sắc theo yêu cầu
        const priceEl = section.querySelector(".price-main");
        priceEl.textContent = price.toLocaleString();
        priceEl.style.color = colorCode;
    
        // 2. Cập nhật phần trăm thay đổi
        const changeSub = section.querySelector(".change-sub");
        changeSub.innerHTML = `${symbol} ${Math.abs(change).toLocaleString()} (${percent}%)`;
        changeSub.style.color = colorCode;
    
        // 3. Cập nhật Range (Thấp/Cao)
        if (range && range.includes(" - ")) {
            const [l, h] = range.split(" - ").map(v => parseFloat(v.replace(/,/g, "")));
            section.querySelector(".low").textContent = l.toLocaleString();
            section.querySelector(".high").textContent = h.toLocaleString();
            
            const marker = section.querySelector(".price-marker");
            const position = ((price - l) / (h - l)) * 100;
            marker.style.left = `${Math.max(0, Math.min(100, position))}%`;
            marker.style.display = "block";
        }
    }
});