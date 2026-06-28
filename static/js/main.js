document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('user-form');
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const userIdInput = document.getElementById('user-id');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    const tbody = document.getElementById('users-tbody');

    // 初始載入使用者列表
    fetchUsers();

    // 處理表單送出 (新增或更新)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const age = parseInt(ageInput.value, 10);
        const userId = userIdInput.value;
        
        if (!name || isNaN(age)) return;

        const userData = { name, age };
        
        try {
            if (userId) {
                // 更新模式
                const response = await fetch(`/user/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    resetForm();
                    fetchUsers();
                } else {
                    const err = await response.json();
                    alert(`更新失敗: ${err.error}`);
                }
            } else {
                // 新增模式
                const response = await fetch('/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    resetForm();
                    fetchUsers();
                } else {
                    const err = await response.json();
                    alert(`新增失敗: ${err.error}`);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('發生網路錯誤！');
        }
    });

    // 取消編輯
    cancelBtn.addEventListener('click', resetForm);

    // 取得所有使用者並渲染到表格
    async function fetchUsers() {
        try {
            const response = await fetch('/user');
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            tbody.innerHTML = `<tr><td colspan="4" class="empty" style="color: var(--danger-color)">載入失敗，請檢查後端連線</td></tr>`;
        }
    }

    // 渲染表格內容
    function renderUsers(users) {
        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty">目前還沒有任何使用者，請在上方新增！</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.className = 'new-row';
            tr.innerHTML = `
                <td>#${user.id}</td>
                <td>${escapeHTML(user.name)}</td>
                <td>${user.age}</td>
                <td>
                    <button class="btn btn-edit" onclick="editUser(${user.id}, '${escapeHTML(user.name)}', ${user.age})">編輯</button>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">刪除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 將編輯功能暴露到全域 (供 onclick 使用)
    window.editUser = (id, name, age) => {
        userIdInput.value = id;
        nameInput.value = name;
        ageInput.value = age;
        
        formTitle.textContent = '編輯使用者';
        submitBtn.textContent = '儲存更新';
        cancelBtn.style.display = 'inline-block';
        
        // 平滑捲動回表單
        formTitle.scrollIntoView({ behavior: 'smooth' });
    };

    // 刪除使用者
    window.deleteUser = async (id) => {
        if (!confirm('確定要刪除這位使用者嗎？此動作無法復原。')) return;

        try {
            const response = await fetch(`/user/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // 若正在編輯該位使用者，順便清空表單
                if (userIdInput.value == id) {
                    resetForm();
                }
                fetchUsers();
            } else {
                const err = await response.json();
                alert(`刪除失敗: ${err.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('發生網路錯誤！');
        }
    };

    // 重設表單為新增模式
    function resetForm() {
        form.reset();
        userIdInput.value = '';
        formTitle.textContent = '新增使用者';
        submitBtn.textContent = '新增';
        cancelBtn.style.display = 'none';
    }

    // 簡單防範 XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
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
