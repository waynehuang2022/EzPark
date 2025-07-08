/* 修正版 app.js - 解決命名衝突問題 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, where, onSnapshot, runTransaction, getDoc, setDoc
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

let app, db;
let currentUser = null;
let parking = [];
let users = [];

/* 初始化 Firebase */
async function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase 初始化成功');
    return true;
  } catch (error) {
    console.error('Firebase 初始化失敗:', error);
    return false;
  }
}

/* DOM 元素快捷函數 */
const $ = id => document.getElementById(id);

/* 工具函數 */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const targetPage = $(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
}

function showView(viewId) {
  document.querySelectorAll('.content-view').forEach(view => {
    view.classList.remove('active');
  });
  const targetView = $(viewId);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // 更新按鈕樣式
  const adminNavButtons = document.querySelectorAll('#adminNav .btn');
  adminNavButtons.forEach(btn => {
    btn.classList.remove('btn--primary');
    btn.classList.add('btn--outline');
  });
  
  // 設定當前活動按鈕
  if (viewId === 'parkingView' && $('showParkingView')) {
    $('showParkingView').classList.remove('btn--outline');
    $('showParkingView').classList.add('btn--primary');
  } else if (viewId === 'userManagement' && $('showUserManagement')) {
    $('showUserManagement').classList.remove('btn--outline');
    $('showUserManagement').classList.add('btn--primary');
  } else if (viewId === 'parkingManagement' && $('showParkingManagement')) {
    $('showParkingManagement').classList.remove('btn--outline');
    $('showParkingManagement').classList.add('btn--primary');
  }
}

function showError(elementId, message) {
  const errorElement = $(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
      errorElement.classList.add('hidden');
    }, 5000);
  }
}

function showModal(title, content) {
  const modal = $('modal');
  const modalTitle = $('modalTitle');
  const modalBody = $('modalBody');
  
  if (modal && modalTitle && modalBody) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }
}

function hideModal() {
  const modal = $('modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('active');
  }
}

/* 認證功能 */
async function login(employeeNo, password) {
  try {
    const q = query(collection(db, 'users'), where('employeeNo', '==', employeeNo));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('找不到此工號');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() };
    
    if (userData.password !== password) {
      throw new Error('密碼錯誤');
    }
    
    return userData;
  } catch (error) {
    throw error;
  }
}

async function register(name, employeeNo, password) {
  try {
    // 檢查工號是否已存在
    const q = query(collection(db, 'users'), where('employeeNo', '==', employeeNo));
    const existingUsers = await getDocs(q);
    
    if (!existingUsers.empty) {
      throw new Error('此工號已註冊');
    }
    
    // 新增用戶
    const newUser = {
      name,
      employeeNo,
      password,
      role: 'user'
    };
    
    await addDoc(collection(db, 'users'), newUser);
    return newUser;
  } catch (error) {
    throw error;
  }
}

/* 初始化測試資料 */
async function initializeTestData() {
  try {
    console.log('檢查是否需要初始化測試資料...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const parkingSnapshot = await getDocs(collection(db, 'parking'));
    
    if (usersSnapshot.empty) {
      console.log('初始化測試用戶資料...');
      
      const testUsers = [
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
        },
        {
          name: "李四",
          employeeNo: "EMP002",
          password: "password123",
          role: "user"
        }
      ];
      
      for (const user of testUsers) {
        await addDoc(collection(db, 'users'), user);
      }
    }
    
    if (parkingSnapshot.empty) {
      console.log('初始化測試車位資料...');
      
      const testParking = [
        {
          slotNo: "A001",
          type: "汽車",
          building: "A",
          ownerId: "EMP001",
          ownerName: "張三",
          status: "open",
          reservedBy: null
        },
        {
          slotNo: "A002",
          type: "機車",
          building: "A",
          ownerId: "EMP002",
          ownerName: "李四",
          status: "closed",
          reservedBy: null
        },
        {
          slotNo: "B001",
          type: "汽車",
          building: "B",
          ownerId: null,
          ownerName: "未分配",
          status: "available",
          reservedBy: null
        }
      ];
      
      for (const slot of testParking) {
        await addDoc(collection(db, 'parking'), slot);
      }
    }
    
    console.log('測試資料初始化完成');
  } catch (error) {
    console.error('初始化測試資料時發生錯誤:', error);
  }
}

function renderParkingSlots() {
  const container = $('parkingSlots');
  if (!container) return;
  
  // =============== 新增：用戶狀態檢查 ===============
  console.log('渲染車位列表，當前用戶:', currentUser);
  
  // 獲取篩選條件
  const buildingFilter = $('buildingFilter')?.value || '';
  const typeFilter = $('typeFilter')?.value || '';
  const statusFilter = $('statusFilter')?.value || '';
  
  console.log('篩選條件:', { buildingFilter, typeFilter, statusFilter });
  
  if (parking.length === 0) {
    container.innerHTML = '<div class="text-center"><p>目前沒有車位資料</p></div>';
    return;
  }
  
  // 應用篩選邏輯
  let filteredSlots = parking.filter(slot => {
    const buildingMatch = !buildingFilter || slot.building === buildingFilter;
    const typeMatch = !typeFilter || slot.type === typeFilter;
    const statusMatch = !statusFilter || slot.status === statusFilter;
    
    return buildingMatch && typeMatch && statusMatch;
  });
  
  console.log('篩選結果:', filteredSlots.length, '筆車位');
  
  if (filteredSlots.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>沒有找到符合條件的車位</h3>
        <p>請調整篩選條件或聯繫管理員</p>
        <button class="btn btn--outline" onclick="clearFilters()">清除篩選</button>
      </div>
    `;
    return;
  }
  // ======= 這裡插入排序邏輯 =======
  if (currentUser && currentUser.employeeNo) {
    filteredSlots.sort((a, b) => {
      // 你的車位優先
      if (a.ownerId === currentUser.employeeNo && b.ownerId !== currentUser.employeeNo) return -1;
      if (a.ownerId !== currentUser.employeeNo && b.ownerId === currentUser.employeeNo) return 1;
      return 0;
    });
  }
// ======= 排序結束 =======
  const html = filteredSlots.map(slot => {
    const statusText = getStatusText(slot.status);
    
    // =============== 增強：車主判斷邏輯 ===============
    const isOwner = currentUser && currentUser.employeeNo && slot.ownerId === currentUser.employeeNo;
    const isReservedByMe = currentUser && currentUser.employeeNo && slot.reservedBy === currentUser.employeeNo;
    
    console.log(`車位 ${slot.slotNo}: 主人=${slot.ownerId}, 當前用戶=${currentUser?.employeeNo}, 是車主=${isOwner}`);
    
    // 按鈕邏輯
    let actionButtons = '';
    
    if (isOwner) {
      console.log(`為車位 ${slot.slotNo} 生成車主按鈕，狀態: ${slot.status}`);
      if (slot.status === 'closed') {
        actionButtons += `<button class="btn btn--success btn--sm" onclick="openSlot('${slot.id}')">開放車位</button>`;
      } else if (slot.status === 'open') {
        actionButtons += `<button class="btn btn--warning btn--sm" onclick="closeSlot('${slot.id}')">關閉車位</button>`;
      } else if (slot.status === 'reserved') {
        actionButtons += `<button class="btn btn--outline btn--sm" onclick="openSlot('${slot.id}')">清除預約並開放</button>`;
      }
    } else {
      if (slot.status === 'open') {
        actionButtons += `<button class="btn btn--primary btn--sm" onclick="reserveSlot('${slot.id}')">預約車位</button>`;
      } else if (isReservedByMe) {
        actionButtons += `<button class="btn btn--outline btn--sm" onclick="cancelReservation('${slot.id}')">取消預約</button>`;
      }
    }
    
    return `
      <div class="parking-slot">
        <div class="parking-slot-header">
          <span>${slot.slotNo}</span>
          <span class="status-${slot.status}">${statusText}</span>
        </div>
        <div class="parking-slot-info">
          <p><strong>棟別：</strong>${slot.building}棟</p>
          <p><strong>種類：</strong>${slot.type}</p>
          <p><strong>主人：</strong>${slot.ownerName || '未分配'}</p>
          ${slot.reservedBy ? `<p><strong>預約人：</strong>${getUserNameByEmployeeNo(slot.reservedBy)}</p>` : ''}
          ${isOwner ? '<p class="owner-badge"><strong>✓ 您是車位主人</strong></p>' : ''}
        </div>
        <div class="parking-slot-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

function renderUsers() {
  const container = $('usersList');
  if (!container) {
    console.error('找不到 usersList 元素');
    return;
  }
  
  console.log('渲染用戶列表，當前用戶:', currentUser);
  console.log('用戶資料:', users);
  
  if (currentUser?.role !== 'super') {
    container.innerHTML = '<div class="text-center"><p>需要管理員權限才能查看</p></div>';
    return;
  }
  
  if (users.length === 0) {
    container.innerHTML = '<div class="text-center"><p>目前沒有會員資料</p></div>';
    return;
  }
  
  const html = users.map(user => `
    <div class="user-card">
      <div class="user-card-header">
        <span class="user-name">${user.name}</span>
        <span class="user-role">${user.role === 'super' ? '管理員' : '一般用戶'}</span>
      </div>
      <div class="user-info">
        <p><strong>工號：</strong>${user.employeeNo}</p>
        <p><strong>角色：</strong>${user.role === 'super' ? '管理員' : '一般用戶'}</p>
      </div>
      <div class="user-card-actions">
        <button class="btn btn--outline btn--sm" onclick="editUser('${user.id}')">編輯</button>
        ${user.role !== 'super' ? `<button class="btn btn--outline btn--sm" onclick="deleteUser('${user.id}')">刪除</button>` : ''}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}
// 清除篩選條件
function clearFilters() {
  const buildingFilter = $('buildingFilter');
  const typeFilter = $('typeFilter');
  const statusFilter = $('statusFilter');
  
  if (buildingFilter) buildingFilter.value = '';
  if (typeFilter) typeFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  
  console.log('已清除所有篩選條件');
  renderParkingSlots();
}

// 將函數暴露到全域
window.clearFilters = clearFilters;
function renderParkingManagement() {
  const container = $('parkingManagementList');
  if (!container) {
    console.error('找不到 parkingManagementList 元素');
    return;
  }
  
  console.log('渲染車位管理，當前用戶:', currentUser);
  console.log('車位資料:', parking);
  
  if (currentUser?.role !== 'super') {
    container.innerHTML = '<div class="text-center"><p>需要管理員權限才能查看</p></div>';
    return;
  }
  
  if (parking.length === 0) {
    container.innerHTML = '<div class="text-center"><p>目前沒有車位資料</p></div>';
    return;
  }
  
  const html = parking.map(slot => `
    <div class="parking-card">
      <div class="parking-slot-header">
        <span>${slot.slotNo}</span>
        <span class="status-${slot.status}">${getStatusText(slot.status)}</span>
      </div>
      <div class="parking-info">
        <p><strong>棟別：</strong>${slot.building}棟</p>
        <p><strong>種類：</strong>${slot.type}</p>
        <p><strong>主人：</strong>${slot.ownerName || '未分配'}</p>
        <p><strong>狀態：</strong>${getStatusText(slot.status)}</p>
      </div>
      <div class="parking-card-actions">
        <button class="btn btn--outline btn--sm" onclick="editParking('${slot.id}')">編輯</button>
        <button class="btn btn--outline btn--sm" onclick="assignOwner('${slot.id}')">分配主人</button>
        <button class="btn btn--outline btn--sm" onclick="deleteParking('${slot.id}')">刪除</button>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

/* 車位操作函數 */
// async function reserveSlot(slotId) {
//   try {
//     await updateDoc(doc(db, 'parking', slotId), {
//       status: 'reserved',
//       reservedBy: currentUser.employeeNo
//     });
//     console.log('預約成功');
//   } catch (error) {
//     console.error('預約車位失敗:', error);
//     alert('預約失敗，請稍後再試');
//   }
// }
async function reserveSlot(slotId) {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. 先讀取車位當前狀態
      const slotRef = doc(db, 'parking', slotId);
      const slotDoc = await transaction.get(slotRef);
      
      if (!slotDoc.exists()) {
        throw new Error('車位不存在');
      }
      
      const slotData = slotDoc.data();
      
      // 2. 檢查車位是否仍然可以預約
      if (slotData.status !== 'open') {
        if (slotData.status === 'reserved') {
          throw new Error('車位已被預約');
        } else if (slotData.status === 'closed') {
          throw new Error('車位已關閉');
        } else {
          throw new Error('車位不可預約');
        }
      }
      
      // 3. 檢查是否已有其他人預約
      if (slotData.reservedBy && slotData.reservedBy !== currentUser.employeeNo) {
        throw new Error('車位已被其他用戶預約');
      }
      
      // 4. 檢查是否是車位主人（車位主人不能預約自己的車位）
      if (slotData.ownerId === currentUser.employeeNo) {
        throw new Error('不能預約自己的車位');
      }
      
      // 5. 執行預約操作
      transaction.update(slotRef, {
        status: 'reserved',
        reservedBy: currentUser.employeeNo,
        reservedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        slotNo: slotData.slotNo,
        ownerName: slotData.ownerName
      };
    });
    
    // 6. 預約成功提示
    console.log('預約成功');
    alert(`成功預約車位 ${result.slotNo}（車主：${result.ownerName}）`);
    
  } catch (error) {
    console.error('預約車位失敗:', error);
    
    // 7. 根據不同錯誤類型給予用戶適當提示
    if (error.message.includes('已被預約')) {
      alert('預約失敗：車位已被其他用戶預約，請選擇其他車位');
    } else if (error.message.includes('已關閉')) {
      alert('預約失敗：車位已關閉，無法預約');
    } else if (error.message.includes('不能預約自己的車位')) {
      alert('預約失敗：不能預約自己的車位');
    } else if (error.code === 'aborted') {
      alert('預約失敗：系統繁忙，請稍後再試');
    } else {
      alert('預約失敗：' + error.message);
    }
  }
}
async function openSlot(slotId) {
  try {
    await updateDoc(doc(db, 'parking', slotId), {
      status: 'open',
      reservedBy: null
    });
    console.log('開放成功');
    // =============== 新增：直接發送 LINE 通知 ===============
    setTimeout(async () => {
      await sendLineNotificationDirect(slotId, 'opened');
    }, 1000);

  } catch (error) {
    console.error('開放車位失敗:', error);
    alert('開放失敗，請稍後再試');
  }
}
/* 直接發送 LINE 通知的函數 */
async function sendLineNotificationDirect(slotId, eventType) {
  try {
    // 獲取車位資料
    const slotData = parking.find(slot => slot.id === slotId);
    if (!slotData) return;
    console.log('新版本');
    // 獲取 LINE Bot 設定
    const configDoc = await getDoc(doc(db, 'system_config', 'line_bot'));
    if (!configDoc.exists()) {
      console.log('LINE Bot 設定不存在');
      return;
    }
    
    const config = configDoc.data();
    const accessToken = config.accessToken;
    const recipients = config.recipients || []; // 收件人 LINE User ID 列表
    
    // 組成訊息內容
    const taiwanTime = new Date().toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei'
    });
    
    const message = {
      type: 'text',
      text: `🅿️ 停車位開放通知\n\n車位：${slotData.slotNo}\n車主：${slotData.ownerName}\n棟別：${slotData.building}棟\n時間：${taiwanTime}\n\n現在可以預約此車位了！`
    };
    
    // 發送給每個收件人
    for (const userId of recipients) {
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: userId,
          messages: [message]
        })
      });
    }
    
    console.log(`已發送 LINE 通知給 ${recipients.length} 位收件人`);
    
  } catch (error) {
    console.error('發送 LINE 通知失敗:', error);
  }
}
async function closeSlot(slotId) {
  try {
    await updateDoc(doc(db, 'parking', slotId), {
      status: 'closed',
      reservedBy: null
    });
    console.log('關閉成功');
  } catch (error) {
    console.error('關閉車位失敗:', error);
    alert('關閉失敗，請稍後再試');
  }
}

async function cancelReservation(slotId) {
  try {
    await updateDoc(doc(db, 'parking', slotId), {
      status: 'open',
      reservedBy: null
    });
    console.log('取消預約成功');
  } catch (error) {
    console.error('取消預約失敗:', error);
    alert('取消預約失敗，請稍後再試');
  }
}

/* 管理功能 - 模態框 */
function showAddUserModal() {
  console.log('顯示新增用戶模態框');
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
  console.log('顯示新增車位模態框');
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

/* CRUD 操作 */
async function addUser(event) {
  event.preventDefault();
  console.log('執行新增用戶');
  
  try {
    const name = $('modalUserName').value;
    const employeeNo = $('modalUserEmployeeNo').value;
    const password = $('modalUserPassword').value;
    const role = $('modalUserRole').value;
    
    console.log('新增用戶資料:', { name, employeeNo, role });
    
    await addDoc(collection(db, 'users'), {
      name,
      employeeNo,
      password,
      role
    });
    
    hideModal();
    alert('新增成功！');
  } catch (error) {
    console.error('新增用戶失敗:', error);
    alert('新增失敗：' + error.message);
  }
}

async function addParking(event) {
  event.preventDefault();
  console.log('執行新增車位');
  
  try {
    const slotNo = $('modalSlotNo').value;
    const type = $('modalSlotType').value;
    const building = $('modalSlotBuilding').value;
    
    console.log('新增車位資料:', { slotNo, type, building });
    
    await addDoc(collection(db, 'parking'), {
      slotNo,
      type,
      building,
      ownerId: null,
      ownerName: '未分配',
      status: 'available',
      reservedBy: null
    });
    
    hideModal();
    alert('新增成功！');
  } catch (error) {
    console.error('新增車位失敗:', error);
    alert('新增失敗：' + error.message);
  }
}

async function deleteUser(userId) {
  if (confirm('確定要刪除此用戶嗎？')) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('刪除成功！');
    } catch (error) {
      console.error('刪除用戶失敗:', error);
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
      console.error('刪除車位失敗:', error);
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
    console.error('更新用戶失敗:', error);
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
      <div class="form-group">
        <label class="form-label">車位狀態</label>
        <select id="editSlotStatus" class="form-control">
          <option value="available" ${slot.status === 'available' ? 'selected' : ''}>可分配</option>
          <option value="open" ${slot.status === 'open' ? 'selected' : ''}>開放中</option>
          <option value="closed" ${slot.status === 'closed' ? 'selected' : ''}>關閉</option>
          <option value="reserved" ${slot.status === 'reserved' ? 'selected' : ''}>已預約</option>
        </select>
      </div>
      ${slot.status === 'reserved' ? `
        <div class="form-group">
          <label class="form-label">當前預約人</label>
          <input type="text" class="form-control" value="${getUserNameByEmployeeNo(slot.reservedBy)} (${slot.reservedBy})" readonly>
          <small class="form-text">如需清除預約，請將狀態改為「開放中」或「關閉」</small>
        </div>
      ` : ''}
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
    const status = $('editSlotStatus').value;
    
    // 準備更新資料
    const updateData = { slotNo, type, building, status };
    
    // 如果狀態改為非預約狀態，清除預約資訊
    if (status !== 'reserved') {
      updateData.reservedBy = null;
    }
    
    await updateDoc(doc(db, 'parking', parkingId), updateData);
    hideModal();
    alert('車位更新成功！');
  } catch (error) {
    console.error('更新車位失敗:', error);
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
    console.error('分配失敗:', error);
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

function getUserNameByEmployeeNo(employeeNo) {
  const user = users.find(u => u.employeeNo === employeeNo);
  return user ? user.name : employeeNo;
}

/* 即時監聽 Firestore 變更 */
function setupRealtimeListeners() {
  console.log('設定即時監聽器...');
  
  // 監聽車位變更
  onSnapshot(collection(db, 'parking'), (snapshot) => {
    console.log('車位資料更新');
    parking = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // =============== 修正：確保在有用戶登入的情況下正確渲染 ===============
    setTimeout(() => {
      renderParkingSlots();
      renderParkingManagement();
    }, 100); // 給一個短暫延遲確保狀態同步
  });
  
  // 監聽用戶變更
  onSnapshot(collection(db, 'users'), (snapshot) => {
    console.log('用戶資料更新');
    users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderUsers();
  });
}

/* 主要初始化函數 - 重新命名避免衝突 */
async function initApp() {
  console.log('開始初始化應用程式...');
  
  // 初始化 Firebase
  const firebaseReady = await initFirebase();
  if (!firebaseReady) {
    alert('Firebase 連接失敗，請檢查網路連接');
    return;
  }
  
  // 初始化測試資料
  await initializeTestData();
  
  // 設定即時監聽器
  setupRealtimeListeners();
  
  // 綁定基本事件
  setupEventListeners();
  
  console.log('應用程式初始化完成');
}

/* 事件監聽器設定 */
function setupEventListeners() {
  console.log('設定事件監聽器...');
  
  // 頁面切換
  const showRegisterBtn = $('showRegister');
  const showLoginBtn = $('showLogin');
  
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      console.log('切換到註冊頁面');
      showPage('registerPage');
    });
  }
  
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      console.log('切換到登入頁面');
      showPage('loginPage');
    });
  }
  
  // 登入表單
  // 登入表單
  const loginForm = $('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('處理登入...');
      
      try {
        const employeeNo = $('employeeNo').value;
        const password = $('password').value;
        
        // 設置當前用戶
        currentUser = await login(employeeNo, password);
        console.log('登入成功:', currentUser);
        
        // 更新用戶顯示
        const currentUserSpan = $('currentUser');
        if (currentUserSpan) {
          currentUserSpan.textContent = currentUser.name;
        }
        
        // 設置管理員選單顯示
        const adminNav = $('adminNav');
        if (currentUser.role === 'super' && adminNav) {
          adminNav.classList.remove('hidden');
        } else if (adminNav) {
          adminNav.classList.add('hidden');
        }
        
        // 切換到主應用頁面
        showPage('mainApp');
        showView('parkingView');
        
        // =============== 關鍵修正：強制重新渲染所有內容 ===============
        console.log('登入後重新渲染車位列表...');
        renderParkingSlots();  // 立即渲染車位列表以反映正確權限
        
        // 如果是管理員，也渲染管理內容
        if (currentUser.role === 'super') {
          renderUsers();
          renderParkingManagement();
        }
        
      } catch (error) {
        console.error('登入失敗:', error);
        showError('loginError', error.message);
      }
    });
  }
  
  // 註冊表單
  const registerForm = $('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('處理註冊...');
      
      try {
        const name = $('regName').value;
        const employeeNo = $('regEmployeeNo').value;
        const password = $('regPassword').value;
        
        await register(name, employeeNo, password);
        console.log('註冊成功');
        
        alert('註冊成功！請使用新帳號登入。');
        showPage('loginPage');
        
      } catch (error) {
        console.error('註冊失敗:', error);
        showError('registerError', error.message);
      }
    });
  }
  
  // 登出按鈕
  const logoutBtn = $('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('登出');
      currentUser = null;
      showPage('loginPage');
    });
  }
  
  // 管理選單切換
  const showParkingViewBtn = $('showParkingView');
  const showUserManagementBtn = $('showUserManagement');
  const showParkingManagementBtn = $('showParkingManagement');
  
  if (showParkingViewBtn) {
    showParkingViewBtn.addEventListener('click', () => {
      console.log('切換到車位管理視圖');
      showView('parkingView');
    });
  }
  
  if (showUserManagementBtn) {
    showUserManagementBtn.addEventListener('click', () => {
      console.log('切換到會員管理視圖');
      showView('userManagement');
      renderUsers(); // 確保重新渲染
    });
  }
  
  if (showParkingManagementBtn) {
    showParkingManagementBtn.addEventListener('click', () => {
      console.log('切換到車位設定視圖');
      showView('parkingManagement');
      renderParkingManagement(); // 確保重新渲染
    });
  }
  
  // 模態框關閉
  const modalClose = $('modalClose');
  if (modalClose) {
    modalClose.addEventListener('click', hideModal);
  }
  
  const modal = $('modal');
  if (modal) {
    const modalOverlay = modal.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', hideModal);
    }
  }
  
  // 新增按鈕
  const addUserBtn = $('addUserBtn');
  const addParkingBtn = $('addParkingBtn');
  
  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
      console.log('點擊新增會員按鈕');
      showAddUserModal();
    });
  }
  
  if (addParkingBtn) {
    addParkingBtn.addEventListener('click', () => {
      console.log('點擊新增車位按鈕');
      showAddParkingModal();
    });
  }

  // =============== 新增：篩選器事件監聽 ===============
  const buildingFilter = $('buildingFilter');
  const typeFilter = $('typeFilter');
  const statusFilter = $('statusFilter');
  
  if (buildingFilter) {
    buildingFilter.addEventListener('change', () => {
      console.log('棟別篩選變更:', buildingFilter.value);
      renderParkingSlots();
    });
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      console.log('種類篩選變更:', typeFilter.value);
      renderParkingSlots();
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      console.log('狀態篩選變更:', statusFilter.value);
      renderParkingSlots();
    });
  }
  
  console.log('篩選器事件綁定完成');
}

/* 將函數暴露到全域範圍 */
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

/* 當 DOM 載入完成時初始化 - 使用重新命名的函數 */
document.addEventListener('DOMContentLoaded', initApp);
