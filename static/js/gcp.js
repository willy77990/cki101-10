document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('gcp-form');
    const projectIdInput = document.getElementById('project-id');
    const searchBtn = document.getElementById('search-btn');
    const tbody = document.getElementById('buckets-tbody');
    const spinner = document.getElementById('loading-spinner');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const projectId = projectIdInput.value.trim();
        if (!projectId) return;

        // UI 狀態：載入中
        searchBtn.disabled = true;
        searchBtn.textContent = '搜尋中...';
        spinner.style.display = 'inline-block';
        tbody.innerHTML = `<tr><td colspan="3" class="loading">正在向 GCP 請求資料...</td></tr>`;

        try {
            const response = await fetch('/api/gcp/buckets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: projectId })
            });
            
            const data = await response.json();

            if (response.ok) {
                renderBuckets(data.buckets);
            } else {
                tbody.innerHTML = `<tr><td colspan="3" class="empty" style="color: var(--danger-color)">錯誤：${escapeHTML(data.error)}</td></tr>`;
            }
        } catch (error) {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="3" class="empty" style="color: var(--danger-color)">網路發生錯誤，請稍後再試</td></tr>`;
        } finally {
            // 還原 UI 狀態
            searchBtn.disabled = false;
            searchBtn.textContent = '搜尋 Buckets';
            spinner.style.display = 'none';
        }
    });

    function renderBuckets(buckets) {
        if (!buckets || buckets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="empty">這個 Project 中沒有任何 Bucket，或您沒有權限存取。</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        buckets.forEach(bucket => {
            const tr = document.createElement('tr');
            tr.className = 'new-row';
            tr.innerHTML = `
                <td><strong>${escapeHTML(bucket.name)}</strong></td>
                <td><span class="badge">${escapeHTML(bucket.location)}</span></td>
                <td>${escapeHTML(bucket.created)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
