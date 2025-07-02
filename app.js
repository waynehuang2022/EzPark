// 停車位管理系統
class ParkingManagementSystem {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.parkingSlots = [];
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.showPage('login-page');
    }

    // 載入預設資料或從 localStorage 載入
    loadData() {
        const defaultUsers = [
            {"id": 1, "name": "系統管理員", "employee_no": "dedustb46", "password": "test0000", "role": "super"},
            {"id": 2, "name": "張三", "employee_no": "EMP001", "password": "password123", "role": "user"},
            {"id": 3, "name": "李四", "employee_no": "EMP002", "password": "password123", "role": "user"},
            {"id": 4, "name": "王五", "employee_no": "EMP005", "password": "password123", "role": "user"}
        ];

        const defaultParkingSlots = [
            {"id": 1, "slot_no": "A001", "type": "汽車", "building": "A", "owner_id": 2, "status": "關閉", "reserved_by": null},
            {"id": 2, "slot_no": "A002", "type": "機車", "building": "A", "owner_id": 3, "status": "開放", "reserved_by": null},
            {"id": 3, "slot_no": "B001", "type": "汽車", "building": "B", "owner_id": 2, "status": "開放", "reserved_by": null},
            {"id": 4, "slot_no": "B002", "type": "機車", "building": "B", "owner_id": null, "status": "開放", "reserved_by": null},
            {"id": 5, "slot_no": "C001", "type": "汽車", "building": "C", "owner_id": null, "status": "開放", "reserved_by": null}
        ];

        // 載入或初始化用戶資料
        const savedUsers = localStorage.getItem('parkingUsers');
        this.users = savedUsers ? JSON.parse(savedUsers) : defaultUsers;

        // 載入或初始化車位資料
        const savedSlots = localStorage.getItem('parkingSlots');
        this.parkingSlots = savedSlots ? JSON.parse(savedSlots) : defaultParkingSlots;

        this.saveData();
    }

    // 儲存資料到 localStorage
    saveData() {
        localStorage.setItem('parkingUsers', JSON.stringify(this.users));
        localStorage.setItem('parkingSlots', JSON.stringify(this.parkingSlots));
    }

    // 綁定所有事件監聽器
    bindEvents() {
        // 登入/註冊頁面
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('register-page');
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('login-page');
        });

        // 登出按鈕
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('admin-logout-btn').addEventListener('click', () => this.logout());

        // 主頁面篩選器
        document.getElementById('building-filter').addEventListener('change', () => this.filterParkingSlots());
        document.getElementById('type-filter').addEventListener('change', () => this.filterParkingSlots());
        document.getElementById('status-filter').addEventListener('change', () => this.filterParkingSlots());

        // 管理後台導航
        document.getElementById('back-to-main').addEventListener('click', () => this.showMainPage());
        document.getElementById('show-member-mgmt').addEventListener('click', () => this.showMemberManagement());
        document.getElementById('show-parking-mgmt').addEventListener('click', () => this.showParkingManagement());

        // 新增按鈕
        document.getElementById('add-member-btn').addEventListener('click', () => this.showAddMemberModal());
        document.getElementById('add-parking-btn').addEventListener('click', () => this.showAddParkingModal());

        // 模態視窗
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });
    }

    // 頁面切換
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    // 顯示訊息
    showMessage(message, type = 'success') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message message--${type}`;
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }

    // 登入處理
    handleLogin(e) {
        e.preventDefault();
        const employeeNo = document.getElementById('login-employee-no').value;
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => u.employee_no === employeeNo && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.showMessage(`歡迎，${user.name}！`, 'success');
            
            if (user.role === 'super') {
                this.showAdminPage();
            } else {
                this.showMainPage();
            }
        } else {
            this.showMessage('工號或密碼錯誤', 'error');
        }
    }

    // 註冊處理
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const employeeNo = document.getElementById('register-employee-no').value;
        const password = document.getElementById('register-password').value;

        // 檢查工號是否已存在
        if (this.users.find(u => u.employee_no === employeeNo)) {
            this.showMessage('工號已存在', 'error');
            return;
        }

        // 建立新用戶
        const newUser = {
            id: Math.max(...this.users.map(u => u.id)) + 1,
            name,
            employee_no: employeeNo,
            password,
            role: 'user'
        };

        this.users.push(newUser);
        this.saveData();
        this.showMessage('註冊成功！請登入', 'success');
        this.showPage('login-page');
        document.getElementById('register-form').reset();
    }

    // 登出
    logout() {
        this.currentUser = null;
        this.showPage('login-page');
        document.getElementById('login-form').reset();
        this.showMessage('已成功登出', 'success');
    }

    // 顯示主頁面
    showMainPage() {
        this.showPage('main-page');
        document.getElementById('current-user-info').textContent = `${this.currentUser.name} (${this.currentUser.employee_no})`;
        this.renderParkingSlots();
    }

    // 顯示管理後台
    showAdminPage() {
        this.showPage('admin-page');
        document.getElementById('admin-user-info').textContent = `${this.currentUser.name} (${this.currentUser.employee_no})`;
        this.showMemberManagement();
    }

    // 渲染車位列表
    renderParkingSlots() {
        const tbody = document.getElementById('parking-slots-table');
        tbody.innerHTML = '';

        const filteredSlots = this.getFilteredParkingSlots();

        filteredSlots.forEach(slot => {
            const owner = slot.owner_id ? this.users.find(u => u.id === slot.owner_id) : null;
            const reservedBy = slot.reserved_by ? this.users.find(u => u.id === slot.reserved_by) : null;
            
            const row = document.createElement('tr');
            if (slot.owner_id === this.currentUser.id) {
                row.classList.add('owner-slot');
            }
            if (slot.reserved_by) {
                row.classList.add('reserved-slot');
            }

            row.innerHTML = `
                <td>${slot.slot_no}</td>
                <td>${slot.building}棟</td>
                <td>${slot.type}</td>
                <td>${owner ? owner.name : '無'}</td>
                <td><span class="status-badge status-badge--${slot.status === '開放' ? 'open' : 'closed'}">${slot.status}</span></td>
                <td>${reservedBy ? reservedBy.name : '無'}</td>
                <td>
                    <div class="action-buttons">
                        ${this.renderSlotActions(slot)}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 渲染車位操作按鈕
    renderSlotActions(slot) {
        const isOwner = slot.owner_id === this.currentUser.id;
        const isReservedByUser = slot.reserved_by === this.currentUser.id;
        const canReserve = !slot.owner_id || (slot.owner_id !== this.currentUser.id && slot.status === '開放' && !slot.reserved_by);

        let actions = [];

        if (isOwner) {
            actions.push(`<button class="btn btn--sm btn--primary" onclick="app.toggleSlotStatus(${slot.id})">${slot.status === '開放' ? '關閉' : '開放'}</button>`);
        }

        if (canReserve) {
            actions.push(`<button class="btn btn--sm btn--success" onclick="app.reserveSlot(${slot.id})">預約</button>`);
        }

        if (isReservedByUser) {
            actions.push(`<button class="btn btn--sm btn--warning" onclick="app.cancelReservation(${slot.id})">取消預約</button>`);
        }

        return actions.join('');
    }

    // 篩選車位
    getFilteredParkingSlots() {
        const buildingFilter = document.getElementById('building-filter').value;
        const typeFilter = document.getElementById('type-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        return this.parkingSlots.filter(slot => {
            return (!buildingFilter || slot.building === buildingFilter) &&
                   (!typeFilter || slot.type === typeFilter) &&
                   (!statusFilter || slot.status === statusFilter);
        });
    }

    filterParkingSlots() {
        this.renderParkingSlots();
    }

    // 切換車位狀態
    toggleSlotStatus(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        if (slot && slot.owner_id === this.currentUser.id) {
            slot.status = slot.status === '開放' ? '關閉' : '開放';
            if (slot.status === '關閉' && slot.reserved_by) {
                slot.reserved_by = null;
            }
            this.saveData();
            this.renderParkingSlots();
            this.showMessage(`車位 ${slot.slot_no} 已${slot.status}`, 'success');
        }
    }

    // 預約車位
    reserveSlot(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        if (slot && slot.status === '開放' && !slot.reserved_by && slot.owner_id !== this.currentUser.id) {
            slot.reserved_by = this.currentUser.id;
            this.saveData();
            this.renderParkingSlots();
            this.showMessage(`已預約車位 ${slot.slot_no}`, 'success');
        }
    }

    // 取消預約
    cancelReservation(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        if (slot && slot.reserved_by === this.currentUser.id) {
            slot.reserved_by = null;
            this.saveData();
            this.renderParkingSlots();
            this.showMessage(`已取消預約車位 ${slot.slot_no}`, 'success');
        }
    }

    // 顯示會員管理
    showMemberManagement() {
        document.getElementById('show-member-mgmt').className = 'btn btn--primary';
        document.getElementById('show-parking-mgmt').className = 'btn btn--secondary';
        document.getElementById('member-management').classList.add('active');
        document.getElementById('parking-management').classList.remove('active');
        this.renderMembersTable();
    }

    // 顯示車位管理
    showParkingManagement() {
        document.getElementById('show-member-mgmt').className = 'btn btn--secondary';
        document.getElementById('show-parking-mgmt').className = 'btn btn--primary';
        document.getElementById('member-management').classList.remove('active');
        document.getElementById('parking-management').classList.add('active');
        this.renderAdminParkingTable();
    }

    // 渲染會員表格
    renderMembersTable() {
        const tbody = document.getElementById('members-table');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const ownedSlots = this.parkingSlots.filter(s => s.owner_id === user.id).length;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.employee_no}</td>
                <td>${user.role === 'super' ? '管理員' : '一般用戶'}</td>
                <td>${ownedSlots}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn--sm btn--primary" onclick="app.editMember(${user.id})">編輯</button>
                        ${user.role !== 'super' ? `<button class="btn btn--sm btn--danger" onclick="app.deleteMember(${user.id})">刪除</button>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 渲染管理員車位表格
    renderAdminParkingTable() {
        const tbody = document.getElementById('admin-parking-table');
        tbody.innerHTML = '';

        this.parkingSlots.forEach(slot => {
            const owner = slot.owner_id ? this.users.find(u => u.id === slot.owner_id) : null;
            const reservedBy = slot.reserved_by ? this.users.find(u => u.id === slot.reserved_by) : null;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${slot.slot_no}</td>
                <td>${slot.building}棟</td>
                <td>${slot.type}</td>
                <td>${owner ? owner.name : '無'}</td>
                <td><span class="status-badge status-badge--${slot.status === '開放' ? 'open' : 'closed'}">${slot.status}</span></td>
                <td>${reservedBy ? reservedBy.name : '無'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn--sm btn--primary" onclick="app.editParking(${slot.id})">編輯</button>
                        <button class="btn btn--sm btn--danger" onclick="app.deleteParking(${slot.id})">刪除</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 顯示新增會員模態視窗
    showAddMemberModal() {
        const availableSlots = this.parkingSlots.filter(s => !s.owner_id);
        const slotsOptions = availableSlots.map(s => `<option value="${s.id}">${s.slot_no} (${s.building}棟 ${s.type})</option>`).join('');

        this.showModal('新增會員', `
            <form id="add-member-form" class="modal-form">
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="member-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">工號</label>
                    <input type="text" id="member-employee-no" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">密碼</label>
                    <input type="password" id="member-password" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">角色</label>
                    <select id="member-role" class="form-control">
                        <option value="user">一般用戶</option>
                        <option value="super">管理員</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">分配車位（可選）</label>
                    <select id="member-parking" class="form-control">
                        <option value="">無</option>
                        ${slotsOptions}
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn--secondary" onclick="app.closeModal()">取消</button>
                    <button type="submit" class="btn btn--primary">新增</button>
                </div>
            </form>
        `);

        document.getElementById('add-member-form').addEventListener('submit', (e) => this.handleAddMember(e));
    }

    // 處理新增會員
    handleAddMember(e) {
        e.preventDefault();
        const name = document.getElementById('member-name').value;
        const employeeNo = document.getElementById('member-employee-no').value;
        const password = document.getElementById('member-password').value;
        const role = document.getElementById('member-role').value;
        const parkingId = document.getElementById('member-parking').value;

        // 檢查工號是否已存在
        if (this.users.find(u => u.employee_no === employeeNo)) {
            this.showMessage('工號已存在', 'error');
            return;
        }

        const newUser = {
            id: Math.max(...this.users.map(u => u.id)) + 1,
            name,
            employee_no: employeeNo,
            password,
            role
        };

        this.users.push(newUser);

        // 如果選擇了車位，分配給新用戶
        if (parkingId) {
            const slot = this.parkingSlots.find(s => s.id === parseInt(parkingId));
            if (slot) {
                slot.owner_id = newUser.id;
            }
        }

        this.saveData();
        this.closeModal();
        this.renderMembersTable();
        this.showMessage('會員新增成功', 'success');
    }

    // 編輯會員
    editMember(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const userSlots = this.parkingSlots.filter(s => s.owner_id === userId);
        const availableSlots = this.parkingSlots.filter(s => !s.owner_id);
        const allAvailableSlots = [...userSlots, ...availableSlots];
        
        const slotsOptions = allAvailableSlots.map(s => {
            const selected = s.owner_id === userId ? 'selected' : '';
            return `<option value="${s.id}" ${selected}>${s.slot_no} (${s.building}棟 ${s.type})</option>`;
        }).join('');

        const userSlotsCheckboxes = userSlots.map(s => `
            <div class="checkbox-group">
                <input type="checkbox" id="slot-${s.id}" checked data-slot-id="${s.id}">
                <label for="slot-${s.id}">${s.slot_no} (${s.building}棟 ${s.type})</label>
            </div>
        `).join('');

        this.showModal('編輯會員', `
            <form id="edit-member-form" class="modal-form">
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="edit-member-name" class="form-control" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">工號</label>
                    <input type="text" id="edit-member-employee-no" class="form-control" value="${user.employee_no}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">密碼</label>
                    <input type="password" id="edit-member-password" class="form-control" value="${user.password}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">角色</label>
                    <select id="edit-member-role" class="form-control">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>一般用戶</option>
                        <option value="super" ${user.role === 'super' ? 'selected' : ''}>管理員</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">目前擁有的車位</label>
                    <div id="user-slots">
                        ${userSlotsCheckboxes || '<p>無擁有車位</p>'}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">新增車位</label>
                    <select id="add-parking-to-user" class="form-control">
                        <option value="">選擇車位</option>
                        ${availableSlots.map(s => `<option value="${s.id}">${s.slot_no} (${s.building}棟 ${s.type})</option>`).join('')}
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn--secondary" onclick="app.closeModal()">取消</button>
                    <button type="submit" class="btn btn--primary">更新</button>
                </div>
            </form>
        `);

        document.getElementById('edit-member-form').addEventListener('submit', (e) => this.handleEditMember(e, userId));
    }

    // 處理編輯會員
    handleEditMember(e, userId) {
        e.preventDefault();
        const user = this.users.find(u => u.id === userId);
        const name = document.getElementById('edit-member-name').value;
        const employeeNo = document.getElementById('edit-member-employee-no').value;
        const password = document.getElementById('edit-member-password').value;
        const role = document.getElementById('edit-member-role').value;
        const addParkingId = document.getElementById('add-parking-to-user').value;

        // 檢查工號是否被其他用戶使用
        const existingUser = this.users.find(u => u.employee_no === employeeNo && u.id !== userId);
        if (existingUser) {
            this.showMessage('工號已被其他用戶使用', 'error');
            return;
        }

        // 更新用戶資料
        user.name = name;
        user.employee_no = employeeNo;
        user.password = password;
        user.role = role;

        // 處理車位移除
        const checkedSlots = document.querySelectorAll('#user-slots input[type="checkbox"]:checked');
        const keepSlotIds = Array.from(checkedSlots).map(cb => parseInt(cb.dataset.slotId));
        
        this.parkingSlots.forEach(slot => {
            if (slot.owner_id === userId && !keepSlotIds.includes(slot.id)) {
                slot.owner_id = null;
                slot.reserved_by = null;
                slot.status = '開放';
            }
        });

        // 新增車位
        if (addParkingId) {
            const slot = this.parkingSlots.find(s => s.id === parseInt(addParkingId));
            if (slot) {
                slot.owner_id = userId;
            }
        }

        this.saveData();
        this.closeModal();
        this.renderMembersTable();
        this.showMessage('會員資料更新成功', 'success');
    }

    // 刪除會員
    deleteMember(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user || user.role === 'super') return;

        const userSlots = this.parkingSlots.filter(s => s.owner_id === userId);
        
        if (userSlots.length > 0) {
            this.showModal('刪除會員', `
                <p>會員 ${user.name} 擁有 ${userSlots.length} 個車位，請選擇處理方式：</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn--secondary" onclick="app.closeModal()">取消</button>
                    <button type="button" class="btn btn--warning" onclick="app.confirmDeleteMember(${userId}, true)">保留車位但釋放主人</button>
                    <button type="button" class="btn btn--danger" onclick="app.confirmDeleteMember(${userId}, false)">同時刪除車位</button>
                </div>
            `);
        } else {
            this.confirmDeleteMember(userId, true);
        }
    }

    // 確認刪除會員
    confirmDeleteMember(userId, keepSlots) {
        const user = this.users.find(u => u.id === userId);
        
        if (keepSlots) {
            // 釋放車位主人但保留車位
            this.parkingSlots.forEach(slot => {
                if (slot.owner_id === userId) {
                    slot.owner_id = null;
                    slot.reserved_by = null;
                    slot.status = '開放';
                }
            });
        } else {
            // 刪除該用戶擁有的所有車位
            this.parkingSlots = this.parkingSlots.filter(s => s.owner_id !== userId);
        }

        // 刪除用戶
        this.users = this.users.filter(u => u.id !== userId);
        
        this.saveData();
        this.closeModal();
        this.renderMembersTable();
        this.showMessage(`會員 ${user.name} 已刪除`, 'success');
    }

    // 顯示新增車位模態視窗
    showAddParkingModal() {
        const users = this.users.filter(u => u.role !== 'super');
        const usersOptions = users.map(u => `<option value="${u.id}">${u.name} (${u.employee_no})</option>`).join('');

        this.showModal('新增車位', `
            <form id="add-parking-form" class="modal-form">
                <div class="form-group">
                    <label class="form-label">車位號碼</label>
                    <input type="text" id="parking-slot-no" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">棟別</label>
                    <select id="parking-building" class="form-control" required>
                        <option value="">選擇棟別</option>
                        <option value="A">A棟</option>
                        <option value="B">B棟</option>
                        <option value="C">C棟</option>
                        <option value="D">D棟</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">車位種類</label>
                    <select id="parking-type" class="form-control" required>
                        <option value="">選擇種類</option>
                        <option value="汽車">汽車</option>
                        <option value="機車">機車</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">指派主人（可選）</label>
                    <select id="parking-owner" class="form-control">
                        <option value="">無</option>
                        ${usersOptions}
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn--secondary" onclick="app.closeModal()">取消</button>
                    <button type="submit" class="btn btn--primary">新增</button>
                </div>
            </form>
        `);

        document.getElementById('add-parking-form').addEventListener('submit', (e) => this.handleAddParking(e));
    }

    // 處理新增車位
    handleAddParking(e) {
        e.preventDefault();
        const slotNo = document.getElementById('parking-slot-no').value;
        const building = document.getElementById('parking-building').value;
        const type = document.getElementById('parking-type').value;
        const ownerId = document.getElementById('parking-owner').value;

        // 檢查車位號碼是否已存在
        if (this.parkingSlots.find(s => s.slot_no === slotNo)) {
            this.showMessage('車位號碼已存在', 'error');
            return;
        }

        const newSlot = {
            id: Math.max(...this.parkingSlots.map(s => s.id)) + 1,
            slot_no: slotNo,
            type,
            building,
            owner_id: ownerId ? parseInt(ownerId) : null,
            status: '開放',
            reserved_by: null
        };

        this.parkingSlots.push(newSlot);
        this.saveData();
        this.closeModal();
        this.renderAdminParkingTable();
        this.showMessage('車位新增成功', 'success');
    }

    // 編輯車位
    editParking(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        if (!slot) return;

        const users = this.users.filter(u => u.role !== 'super');
        const usersOptions = users.map(u => {
            const selected = u.id === slot.owner_id ? 'selected' : '';
            return `<option value="${u.id}" ${selected}>${u.name} (${u.employee_no})</option>`;
        }).join('');

        this.showModal('編輯車位', `
            <form id="edit-parking-form" class="modal-form">
                <div class="form-group">
                    <label class="form-label">車位號碼</label>
                    <input type="text" id="edit-parking-slot-no" class="form-control" value="${slot.slot_no}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">棟別</label>
                    <select id="edit-parking-building" class="form-control" required>
                        <option value="A" ${slot.building === 'A' ? 'selected' : ''}>A棟</option>
                        <option value="B" ${slot.building === 'B' ? 'selected' : ''}>B棟</option>
                        <option value="C" ${slot.building === 'C' ? 'selected' : ''}>C棟</option>
                        <option value="D" ${slot.building === 'D' ? 'selected' : ''}>D棟</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">車位種類</label>
                    <select id="edit-parking-type" class="form-control" required>
                        <option value="汽車" ${slot.type === '汽車' ? 'selected' : ''}>汽車</option>
                        <option value="機車" ${slot.type === '機車' ? 'selected' : ''}>機車</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">主人</label>
                    <select id="edit-parking-owner" class="form-control">
                        <option value="" ${!slot.owner_id ? 'selected' : ''}>無</option>
                        ${usersOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">狀態</label>
                    <select id="edit-parking-status" class="form-control">
                        <option value="開放" ${slot.status === '開放' ? 'selected' : ''}>開放</option>
                        <option value="關閉" ${slot.status === '關閉' ? 'selected' : ''}>關閉</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn--secondary" onclick="app.closeModal()">取消</button>
                    <button type="submit" class="btn btn--primary">更新</button>
                </div>
            </form>
        `);

        document.getElementById('edit-parking-form').addEventListener('submit', (e) => this.handleEditParking(e, slotId));
    }

    // 處理編輯車位
    handleEditParking(e, slotId) {
        e.preventDefault();
        const slot = this.parkingSlots.find(s => s.id === slotId);
        const slotNo = document.getElementById('edit-parking-slot-no').value;
        const building = document.getElementById('edit-parking-building').value;
        const type = document.getElementById('edit-parking-type').value;
        const ownerId = document.getElementById('edit-parking-owner').value;
        const status = document.getElementById('edit-parking-status').value;

        // 檢查車位號碼是否被其他車位使用
        const existingSlot = this.parkingSlots.find(s => s.slot_no === slotNo && s.id !== slotId);
        if (existingSlot) {
            this.showMessage('車位號碼已被其他車位使用', 'error');
            return;
        }

        // 更新車位資料
        slot.slot_no = slotNo;
        slot.building = building;
        slot.type = type;
        slot.owner_id = ownerId ? parseInt(ownerId) : null;
        slot.status = status;

        // 如果狀態變為關閉，取消預約
        if (status === '關閉') {
            slot.reserved_by = null;
        }

        this.saveData();
        this.closeModal();
        this.renderAdminParkingTable();
        this.showMessage('車位資料更新成功', 'success');
    }

    // 刪除車位
    deleteParking(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        if (!slot) return;

        if (confirm(`確定要刪除車位 ${slot.slot_no} 嗎？`)) {
            this.parkingSlots = this.parkingSlots.filter(s => s.id !== slotId);
            this.saveData();
            this.renderAdminParkingTable();
            this.showMessage(`車位 ${slot.slot_no} 已刪除`, 'success');
        }
    }

    // 顯示模態視窗
    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    }

    // 關閉模態視窗
    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }
}

// 初始化應用程式
const app = new ParkingManagementSystem();