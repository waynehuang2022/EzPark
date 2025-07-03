/* 完整版 app.js - 包含 Super User 功能 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, where, onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/* Firebase 配置 */
const firebaseConfig = {
  apiKey: 'AIzaSyDdERse0mjGpwlHSZGo2WA8tFGSE235Bz8',
  authDomain: 'mypark-42e1d.firebaseapp.com',
  projectId: 'mypark-42e1d',
  storageBucket: 'mypark-42e1d.appspot.com',
  messagingSenderId: '893866513050',
  appId: '1:893866513050:web:f52586fd9eea28aa354523'
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM 元素快捷 */
const $ = id => document.getElementById(id);
const el = {
  loginPage: $('loginPage'),
  registerPage: $('registerPage'),
  mainApp: $('mainApp'),
  loginForm: $('loginForm'),
  registerForm: $('registerForm'),
  showRegister: $('showRegister'),
  showLogin: $('showLogin'),
  loginError: $('loginError'),
  registerError: $('registerError'),
  employeeNo: $('employeeNo'),
  password: $('password'),
  regName: $('regName'),
  regEmployeeNo: $('regEmployeeNo'),
  regPassword: $('regPassword'),
  currentUser: $('currentUser'),
  logoutBtn: $('logoutBtn'),
  adminNav: $('adminNav'),
  showParkingView: $('showParkingView'),
  showUserManagement: $('showUserManagement'),
  showParkingManagement: $('showParkingManagement'),
  parkingView: $('parkingView'),
  userManagement: $('userManagement'),
  parkingManagement: $('parkingManagement'),
  parkingSlots: $('parkingSlots'),
  usersList: $('usersList'),
  parkingManagementList: $('parkingManagementList'),
  modal: $('modal'),
  modalTitle: $('modalTitle'),
  modalBody: $('modalBody'),
  modalClose: $('modalClose'),
  addUserBtn: $('addUserBtn'),
  addParkingBtn: $('addParkingBtn')
};

/* 應用狀態 */
let currentUser = null;
let parking = [];
let users = [];

/* 初始測試資料 */
const initData = {
  users: [
    {
      name: "系統管理員",
      employeeNo: "dedustb46", 
      password: "test0000",
      role: "super"
    },
    {
      name: "張三",
      employeeNo: "EMP001",
      password: "password123", 
      role: "user"
    }
  ],
  parking: [
    {
      slotNo: "A001",
      type: "汽車",
      building: "A",
      ownerId: "EMP001",
      ownerName: "張三",
      status: "open",
      reservedBy: null
    }
  ]
};

/* 工具函數 */
const showPage = p => {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  el[p].classList.add('active');
};

const showView = v => {
  document.querySelectorAll('.content-view').forEach(x => x.classList.remove('active'));
  el[v].classList.add('active');
  
  // 更新按鈕樣式
  document.querySelectorAll('#adminNav .btn').forEach(btn => {
    btn.classList.remove('btn--primary');
    btn.classList.add('btn--outline');
  });
  
  if (v === 'parkingView') el.showParkingView.classList.replace('btn--outline', 'btn--primary');
  if (v === 'userManagement') el.showUserManagement.classList.replace('btn--outline', 'btn--primary');
  if (v === 'parkingManagement') el.showParkingManagement.classList.replace('btn--outline', 'btn--primary');
};

const showError = (id, msg) => {
  const e = el[id];
  e.textContent = msg;
  e.classList.remove('hidden');
  setTimeout(() => e.classList.add('hidden'), 4000);
};

const showModal = (title, content) => {
  el.modalTitle.textContent = title;
  el.modalBody.innerHTML = content;
  el.modal.classList.remove('hidden');
};

const hideModal = () => {
  el.modal.classList.add('hidden');
};

/* 認證功能 */
async function login(emp, pwd) {
  const q = query(collection(db, 'users'), where('employeeNo', '==', emp));
  const rs = await getDocs(q);
  if (rs.empty) throw new Error('找不到此工號');
  const u = { id: rs.docs[0].id, ...rs.docs[0].data() };
  if (u.password !== pwd) throw new Error('密碼錯誤');
  return u;
}

async function register(name, emp, pwd) {
  const q = query(collection(db, 'users'), where('employeeNo', '==', emp));
  if (!(await getDocs(q)).empty) throw new Error('工號已存在');
  await addDoc(collection(db, 'users'), { name, employeeNo: emp, password: pwd, role: 'user' });
}

/* 初始化測試資料 */
async function initializeTestData() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (usersSnapshot.empty) {
      console.log('初始化測試資料...');
      for (const user of initData.users) {
        await addDoc(collection(db, 'users'), user);
      }
      for (const slot of initData.parking) {
        await addDoc(collection(db, 'parking'), slot);
      }
      console.log('測試資料初始化完成');
    }
  } catch (error) {
    console.error('初始化失敗:', error);
  }
}

/* 渲染函數 */
const renderParking = () => {
  const html = parking.map(s => `
    <div class="parking-slot">
      <div class="parking-slot-header">
        <span>${s.slotNo}</span>
        <span class="status-${s.status}">${getStatusText(s.status)}</span>
      </div>
      <p>棟別：${s.building}棟</p>
      <p>種類：${s.type}</p>
      <p>主人：${s.ownerName || '未分配'}</p>
      ${s.reservedBy ? `<p>預約人：${getUserName(s.reservedBy)}</p>` : ''}
      <div class="parking-slot-actions">
        ${renderParkingActions(s)}
      </div>
    </div>
  `).join('');
  el.parkingSlots.innerHTML = html || '<p>目前沒有車位資料</p>';
};

const renderUsers = () => {
  if (currentUser?.role !== 'super') return;
  
  const html = users.map(u => `
    <div class="user-card">
      <div class="user-card-header">
        <span class="user-name">${u.name}</span>
        <span class="user-role">${u.role === 'super' ? '管理員' : '一般用戶'}</span>
      </div>
      <p>工號：${u.employeeNo}</p>
      <div class="user-card-actions">
        <button class="btn btn--outline btn--sm" onclick="editUser('${u.id}')">編輯</button>
        ${u.role !== 'super' ? `<button class="btn btn--outline btn--sm" onclick="deleteUser('${u.id}')">刪除</button>` : ''}
      </div>
    </div>
  `).join('');
  el.usersList.innerHTML = html || '<p>目前沒有會員資料</p>';
};

const renderParkingManagement = () => {
  if (currentUser?.role !== 'super') return;
  
  const html = parking.map(s => `
    <div class="parking-card">
      <div class="parking-slot-header">
        <span>${s.slotNo}</span>
        <span class="status-${s.status}">${getStatusText(s.status)}</span>
      </div>
      <p>棟別：${s.building}棟</p>
      <p>種類：${s.type}</p>
      <p>主人：${s.ownerName || '未分配'}</p>
      <div class="parking-card-actions">
        <button class="btn btn--outline btn--sm" onclick="editParking('${s.id}')">編輯</button>
        <button class="btn btn--outline btn--sm" onclick="assignOwner('${s.id}')">分配主人</button>
        <button class="btn btn--outline btn--sm" onclick="deleteParking('${s.id}')">刪除</button>
      </div>
    </div>
  `).join('');
  el.parkingManagementList.innerHTML = html || '<p>目前沒有車位資料</p>';
};

/* 車位操作按鈕渲染 */
const renderParkingActions = (slot) => {
  const isOwner = currentUser && slot.ownerId === currentUser.employeeNo;
  const canReserve = slot.status === 'open' && !isOwner;
  const canOpen = isOwner && slot.status === 'closed';
  const canClose = isOwner && slot.status === 'open';
  const canCancel = slot.reservedBy === currentUser?.employeeNo;
  
  let actions = [];
  if (canReserve) actions.push(`<button class="btn btn--primary btn--sm" onclick="reserveSlot('${slot.id}')">預約</button>`);
  if (canOpen) actions.push(`<button class="btn btn--success btn--sm" onclick="openSlot('${slot.id}')">開放</button>`);
  if (canClose) actions.push(`<button class="btn btn--warning btn--sm" onclick="closeSlot('${slot.id}')">關閉</button>`);
  if (canCancel) actions.push(`<button class="btn btn--outline btn--sm" onclick="cancelReservation('${slot.id}')">取消預約</button>`);
  
  return actions.join(' ');
};

/* 車位操作函數 */
async function reserveSlot(slotId) {
  await updateDoc(doc(db, 'parking', slotId), {
    status: 'reserved',
    reservedBy: currentUser.employeeNo
  });
}

async function openSlot(slotId) {
  await updateDoc(doc(db, 'parking', slotId), {
    status: 'open',
    reservedBy: null
  });
}

async function closeSlot(slotId) {
  await updateDoc(doc(db, 'parking', slotId), {
    status: 'closed',
    reservedBy: null
  });
}

async function cancelReservation(slotId) {
  await updateDoc(doc(db, 'parking', slotId), {
    status: 'open',
    reservedBy: null
  });
}

/* Super User 管理功能 */
function showAddUserModal() {
  const content = `
    <form class="modal-form" onsubmit="addUser(event)">
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input type="text" id="modalUserName" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label">工號</label>
        <input type="text" id="modalUserEmployeeNo" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label">密碼</label>
        <input type="password" id="modalUserPassword" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label">角色</label>
        <select id="modalUserRole" class="form-control">
          <option value="user">一般用戶</option>
          <option value="super">管理員</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn--outline" onclick="hideModal()">取消</button>
        <button type="submit" class="btn btn--primary">新增</button>
      </div>
    </form>
  `;
  showModal('新增會員', content);
}

function showAddParkingModal() {
  const content = `
    <form class="modal-form" onsubmit="addParking(event)">
      <div class="form-group">
        <label class="form-label">車位號碼</label>
        <input type="text" id="modalSlotNo" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label">車位種類</label>
        <select id="modalSlotType" class="form-control">
          <option value="汽車">汽車</option>
          <option value="機車">機車</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">棟別</label>
        <select id="modalSlotBuilding" class="form-control">
          <option value="A">A棟</option>
          <option value="B">B棟</option>
          <option value="C">C棟</option>
          <option value="D">D棟</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn--outline" onclick="hideModal()">取消</button>
        <button type="submit" class="btn btn--primary">新增</button>
      </div>
    </form>
  `;
  showModal('新增車位', content);
}

async function addUser(event) {
  event.preventDefault();
  try {
    const name = $('modalUserName').value;
    const employeeNo = $('modalUserEmployeeNo').value;
    const password = $('modalUserPassword').value;
    const role = $('modalUserRole').value;
    
    await addDoc(collection(db, 'users'), { name, employeeNo, password, role });
    hideModal();
    alert('新增成功！');
  } catch (error) {
    alert('新增失敗：' + error.message);
  }
}

async function addParking(event) {
  event.preventDefault();
  try {
    const slotNo = $('modalSlotNo').value;
    const type = $('modalSlotType').value;
    const building = $('modalSlotBuilding').value;
    
    await addDoc(collection(db, 'parking'), {
      slotNo, type, building,
      ownerId: null,
      ownerName: '未分配',
      status: 'available',
      reservedBy: null
    });
    hideModal();
    alert('新增成功！');
  } catch (error) {
    alert('新增失敗：' + error.message);
  }
}

async function deleteUser(userId) {
  if (confirm('確定要刪除此用戶嗎？')) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('刪除成功！');
    } catch (error) {
      alert('刪除失敗：' + error.message);
    }
  }
}

async function deleteParking(parkingId) {
  if (confirm('確定要刪除此車位嗎？')) {
    try {
      await deleteDoc(doc(db, 'parking', parkingId));
      alert('刪除成功！');
    } catch (error) {
      alert('刪除失敗：' + error.message);
    }
  }
}

function editUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  const content = `
    <form class="modal-form" onsubmit="updateUser(event, '${userId}')">
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input type="text" id="editUserName" class="form-control" value="${user.name}" required>
      </div>
      <div class="form-group">
        <label class="form-label">工號</label>
        <input type="text" id="editUserEmployeeNo" class="form-control" value="${user.employeeNo}" required>
      </div>
      <div class="form-group">
        <label class="form-label">密碼</label>
        <input type="password" id="editUserPassword" class="form-control" value="${user.password}" required>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn--outline" onclick="hideModal()">取消</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  showModal('編輯會員', content);
}

async function updateUser(event, userId) {
  event.preventDefault();
  try {
    const name = $('editUserName').value;
    const employeeNo = $('editUserEmployeeNo').value;
    const password = $('editUserPassword').value;
    
    await updateDoc(doc(db, 'users', userId), { name, employeeNo, password });
    hideModal();
    alert('更新成功！');
  } catch (error) {
    alert('更新失敗：' + error.message);
  }
}

function editParking(parkingId) {
  const slot = parking.find(p => p.id === parkingId);
  if (!slot) return;
  
  const content = `
    <form class="modal-form" onsubmit="updateParking(event, '${parkingId}')">
      <div class="form-group">
        <label class="form-label">車位號碼</label>
        <input type="text" id="editSlotNo" class="form-control" value="${slot.slotNo}" required>
      </div>
      <div class="form-group">
        <label class="form-label">車位種類</label>
        <select id="editSlotType" class="form-control">
          <option value="汽車" ${slot.type === '汽車' ? 'selected' : ''}>汽車</option>
          <option value="機車" ${slot.type === '機車' ? 'selected' : ''}>機車</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">棟別</label>
        <select id="editSlotBuilding" class="form-control">
          <option value="A" ${slot.building === 'A' ? 'selected' : ''}>A棟</option>
          <option value="B" ${slot.building === 'B' ? 'selected' : ''}>B棟</option>
          <option value="C" ${slot.building === 'C' ? 'selected' : ''}>C棟</option>
          <option value="D" ${slot.building === 'D' ? 'selected' : ''}>D棟</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn--outline" onclick="hideModal()">取消</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  showModal('編輯車位', content);
}

async function updateParking(event, parkingId) {
  event.preventDefault();
  try {
    const slotNo = $('editSlotNo').value;
    const type = $('editSlotType').value;
    const building = $('editSlotBuilding').value;
    
    await updateDoc(doc(db, 'parking', parkingId), { slotNo, type, building });
    hideModal();
    alert('更新成功！');
  } catch (error) {
    alert('更新失敗：' + error.message);
  }
}

function assignOwner(parkingId) {
  const userOptions = users.filter(u => u.role !== 'super')
    .map(u => `<option value="${u.employeeNo}">${u.name} (${u.employeeNo})</option>`)
    .join('');
  
  const content = `
    <form class="modal-form" onsubmit="updateParkingOwner(event, '${parkingId}')">
      <div class="form-group">
        <label class="form-label">選擇車位主人</label>
        <select id="assignOwnerSelect" class="form-control">
          <option value="">未分配</option>
          ${userOptions}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn--outline" onclick="hideModal()">取消</button>
        <button type="submit" class="btn btn--primary">分配</button>
      </div>
    </form>
  `;
  showModal('分配車位主人', content);
}

async function updateParkingOwner(event, parkingId) {
  event.preventDefault();
  try {
    const ownerId = $('assignOwnerSelect').value;
    const ownerName = ownerId ? users.find(u => u.employeeNo === ownerId)?.name || '未知' : '未分配';
    
    await updateDoc(doc(db, 'parking', parkingId), {
      ownerId: ownerId || null,
      ownerName,
      status: ownerId ? 'closed' : 'available'
    });
    hideModal();
    alert('分配成功！');
  } catch (error) {
    alert('分配失敗：' + error.message);
  }
}

/* 輔助函數 */
function getStatusText(status) {
  const statusMap = {
    'open': '開放中',
    'closed': '關閉',
    'reserved': '已預約',
    'available': '可分配'
  };
  return statusMap[status] || status;
}

function getUserName(employeeNo) {
  const user = users.find(u => u.employeeNo === employeeNo);
  return user ? user.name : employeeNo;
}

/* 即時監聽 */
onSnapshot(collection(db, 'parking'), snap => {
  parking = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderParking();
  renderParkingManagement();
});

onSnapshot(collection(db, 'users'), snap => {
  users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderUsers();
});

/* 事件綁定 */
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化測試資料
  await initializeTestData();
  
  // 頁面切換
  el.showRegister.onclick = () => showPage('registerPage');
  el.showLogin.onclick = () => showPage('loginPage');

  // 登入
  el.loginForm.onsubmit = async e => {
    e.preventDefault();
    try {
      currentUser = await login(el.employeeNo.value, el.password.value);
      el.currentUser.textContent = currentUser.name;
      
      if (currentUser.role === 'super') {
        el.adminNav.classList.remove('hidden');
      } else {
        el.adminNav.classList.add('hidden');
      }
      
      showPage('mainApp');
      showView('parkingView');
    } catch (err) {
      showError('loginError', err.message);
    }
  };

  // 註冊
  el.registerForm.onsubmit = async e => {
    e.preventDefault();
    try {
      await register(el.regName.value, el.regEmployeeNo.value, el.regPassword.value);
      alert('註冊成功！請登入。');
      showPage('loginPage');
    } catch (err) {
      showError('registerError', err.message);
    }
  };

  // 登出
  el.logoutBtn.onclick = () => {
    currentUser = null;
    showPage('loginPage');
  };

  // 管理選單
  el.showParkingView.onclick = () => showView('parkingView');
  el.showUserManagement.onclick = () => showView('userManagement');
  el.showParkingManagement.onclick = () => showView('parkingManagement');

  // 模態框
  el.modalClose.onclick = hideModal;
  el.modal.querySelector('.modal-overlay').onclick = hideModal;

  // 新增按鈕
  el.addUserBtn.onclick = showAddUserModal;
  el.addParkingBtn.onclick = showAddParkingModal;
});

/* 全域函數 */
window.reserveSlot = reserveSlot;
window.openSlot = openSlot;
window.closeSlot = closeSlot;
window.cancelReservation = cancelReservation;
window.addUser = addUser;
window.addParking = addParking;
window.updateUser = updateUser;
window.updateParking = updateParking;
window.updateParkingOwner = updateParkingOwner;
window.deleteUser = deleteUser;
window.deleteParking = deleteParking;
window.editUser = editUser;
window.editParking = editParking;
window.assignOwner = assignOwner;
window.showAddUserModal = showAddUserModal;
window.showAddParkingModal = showAddParkingModal;
window.hideModal = hideModal;
