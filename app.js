// Firebase 配置 - 請替換為您的實際 Firebase 配置

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdERse0mjGpwlHSZGo2WA8tFGSE235Bz8",
  authDomain: "mypark-42e1d.firebaseapp.com",
  projectId: "mypark-42e1d",
  storageBucket: "mypark-42e1d.firebasestorage.app",
  messagingSenderId: "893866513050",
  appId: "1:893866513050:web:f52586fd9eea28aa354523",
  measurementId: "G-HC2PK22D2J"
};

// 檢測是否為測試環境（Firebase配置未設置）
const isTestMode = firebaseConfig.apiKey === "YOUR_API_KEY";

let app, db;
let useLocalStorage = isTestMode;

// 如果不是測試模式，嘗試初始化Firebase
if (!isTestMode) {
    try {
        //導入 Firebase 模塊
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
        const { 
            getFirestore, 
            collection, 
            doc, 
            getDocs, 
            getDoc,
            addDoc, 
            updateDoc, 
            deleteDoc, 
            onSnapshot,
            query,
            where,
            orderBy 
        } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        // 初始化 Firebase
        // Initialize Firebase

        app = initializeApp(firebaseConfig);
        //const analytics = getAnalytics(app);
        db = getFirestore(app);
        
        // 測試Firebase連接
        await getDocs(collection(db, 'test'));
        console.log('Firebase 連接成功');
        useLocalStorage = false;
    } catch (error) {
        console.warn('Firebase 連接失敗，使用本地模擬數據:', error);
        useLocalStorage = true;
    }
}

// 應用程式狀態
let currentUser = null;
let parkingSlots = [];
let users = [];
let unsubscribers = [];

// 測試資料
const testData = {
    users: [
        {
            id: "dedustb46",
            name: "系統管理員",
            employeeNo: "dedustb46",
            password: "test0000",
            role: "super"
        },
        {
            id: "EMP001",
            name: "張三",
            employeeNo: "EMP001",
            password: "password123",
            role: "user"
        },
        {
            id: "EMP002",
            name: "李四",
            employeeNo: "EMP002",
            password: "password123",
            role: "user"
        },
        {
            id: "EMP005",
            name: "王五",
            employeeNo: "EMP005",
            password: "password123",
            role: "user"
        }
    ],
    parkingSlots: [
        {
            id: "A001",
            slotNo: "A001",
            type: "汽車",
            building: "A",
            ownerId: "EMP001",
            ownerName: "張三",
            status: "open",
            reservedBy: null
        },
        {
            id: "A002",
            slotNo: "A002",
            type: "機車",
            building: "A",
            ownerId: "EMP002",
            ownerName: "李四",
            status: "closed",
            reservedBy: null
        },
        {
            id: "B001",
            slotNo: "B001",
            type: "汽車",
            building: "B",
            ownerId: null,
            ownerName: "未分配",
            status: "available",
            reservedBy: null
        },
        {
            id: "C001",
            slotNo: "C001",
            type: "機車",
            building: "C",
            ownerId: null,
            ownerName: "未分配",
            status: "available",
            reservedBy: null
        }
    ]
};

// 本地存儲模擬器（用於測試環境）
class LocalStorageSimulator {
    constructor() {
        this.data = {
            users: [...testData.users],
            parking: [...testData.parkingSlots]
        };
        this.listeners = {
            users: [],
            parking: []
        };
    }

    // 模擬查詢操作
    async query(collectionName, whereField, operator, value) {
        const results = this.data[collectionName].filter(item => {
            if (operator === '==') {
                return item[whereField] === value;
            }
            return false;
        });
        return results;
    }

    // 模擬獲取所有文檔
    async getAll(collectionName) {
        return [...this.data[collectionName]];
    }

    // 模擬添加文檔
    async add(collectionName, data) {
        const newId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const newItem = { id: newId, ...data };
        this.data[collectionName].push(newItem);
        this.notifyListeners(collectionName);
        return newId;
    }

    // 模擬更新文檔
    async update(collectionName, id, data) {
        const index = this.data[collectionName].findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[collectionName][index] = { ...this.data[collectionName][index], ...data };
            this.notifyListeners(collectionName);
        }
    }

    // 模擬刪除文檔
    async delete(collectionName, id) {
        this.data[collectionName] = this.data[collectionName].filter(item => item.id !== id);
        this.notifyListeners(collectionName);
    }

    // 模擬即時監聽器
    onSnapshot(collectionName, callback) {
        this.listeners[collectionName].push(callback);
        // 立即調用一次
        callback(this.data[collectionName]);
        
        // 返回取消監聽的函數
        return () => {
            this.listeners[collectionName] = this.listeners[collectionName].filter(cb => cb !== callback);
        };
    }

    // 通知監聽器
    notifyListeners(collectionName) {
        this.listeners[collectionName].forEach(callback => {
            callback(this.data[collectionName]);
        });
    }
}

// 創建本地存儲模擬器實例
const localDb = new LocalStorageSimulator();

// DOM 元素
const elements = {
    // 頁面
    loginPage: document.getElementById('loginPage'),
    registerPage: document.getElementById('registerPage'),
    mainApp: document.getElementById('mainApp'),
    
    // 登入表單
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    employeeNo: document.getElementById('employeeNo'),
    password: document.getElementById('password'),
    
    // 註冊表單
    regName: document.getElementById('regName'),
    regEmployeeNo: document.getElementById('regEmployeeNo'),
    regPassword: document.getElementById('regPassword'),
    
    // 導航
    currentUser: document.getElementById('currentUser'),
    logoutBtn: document.getElementById('logoutBtn'),
    adminNav: document.getElementById('adminNav'),
    
    // 視圖切換按鈕
    showParkingView: document.getElementById('showParkingView'),
    showUserManagement: document.getElementById('showUserManagement'),
    showParkingManagement: document.getElementById('showParkingManagement'),
    
    // 視圖
    parkingView: document.getElementById('parkingView'),
    userManagement: document.getElementById('userManagement'),
    parkingManagement: document.getElementById('parkingManagement'),
    
    // 篩選器
    buildingFilter: document.getElementById('buildingFilter'),
    typeFilter: document.getElementById('typeFilter'),
    statusFilter: document.getElementById('statusFilter'),
    
    // 列表
    parkingSlots: document.getElementById('parkingSlots'),
    usersList: document.getElementById('usersList'),
    parkingManagementList: document.getElementById('parkingManagementList'),
    
    // 模態框
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    
    // 其他
    loadingSpinner: document.getElementById('loadingSpinner'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    addUserBtn: document.getElementById('addUserBtn'),
    addParkingBtn: document.getElementById('addParkingBtn')
};

// 工具函數
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showView(viewId) {
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    
    // 更新按鈕狀態
    document.querySelectorAll('#adminNav .btn').forEach(btn => {
        btn.classList.remove('btn--primary');
        btn.classList.add('btn--outline');
    });
    
    if (viewId === 'parkingView') {
        elements.showParkingView.classList.remove('btn--outline');
        elements.showParkingView.classList.add('btn--primary');
    } else if (viewId === 'userManagement') {
        elements.showUserManagement.classList.remove('btn--outline');
        elements.showUserManagement.classList.add('btn--primary');
    } else if (viewId === 'parkingManagement') {
        elements.showParkingManagement.classList.remove('btn--outline');
        elements.showParkingManagement.classList.add('btn--primary');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = content;
    elements.modal.classList.remove('hidden');
}

function hideModal() {
    elements.modal.classList.add('hidden');
}

// 資料庫操作（支援Firebase和本地模擬器）
async function initializeTestData() {
    if (useLocalStorage) {
        console.log('使用本地模擬數據');
        return;
    }
    
    try {
        // Firebase 初始化邏輯
        const { collection, getDocs, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const parkingSnapshot = await getDocs(collection(db, 'parking'));
        
        if (usersSnapshot.empty) {
            console.log('初始化測試用戶資料...');
            for (const user of testData.users) {
                await addDoc(collection(db, 'users'), user);
            }
        }
        
        if (parkingSnapshot.empty) {
            console.log('初始化測試車位資料...');
            for (const slot of testData.parkingSlots) {
                await addDoc(collection(db, 'parking'), slot);
            }
        }
        
        console.log('測試資料初始化完成');
    } catch (error) {
        console.error('初始化測試資料時發生錯誤:', error);
    }
}

// 用戶認證
async function login(employeeNo, password) {
    try {
        let foundUser = null;
        
        if (useLocalStorage) {
            const users = await localDb.query('users', 'employeeNo', '==', employeeNo);
            if (users.length > 0) {
                foundUser = users[0];
            }
        } else {
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('employeeNo', '==', employeeNo));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                foundUser = { id: userDoc.id, ...userDoc.data() };
            }
        }
        
        if (!foundUser) {
            throw new Error('找不到此工號');
        }
        
        if (foundUser.password !== password) {
            throw new Error('密碼錯誤');
        }
        
        currentUser = foundUser;
        return currentUser;
    } catch (error) {
        throw error;
    }
}

async function register(name, employeeNo, password) {
    try {
        // 檢查工號是否已存在
        let existingUsers = [];
        
        if (useLocalStorage) {
            existingUsers = await localDb.query('users', 'employeeNo', '==', employeeNo);
        } else {
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('employeeNo', '==', employeeNo));
            const querySnapshot = await getDocs(q);
            existingUsers = querySnapshot.docs;
        }
        
        if (existingUsers.length > 0) {
            throw new Error('此工號已註冊');
        }
        
        const newUser = {
            name,
            employeeNo,
            password,
            role: 'user'
        };
        
        if (useLocalStorage) {
            const id = await localDb.add('users', newUser);
            return { id, ...newUser };
        } else {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const docRef = await addDoc(collection(db, 'users'), newUser);
            return { id: docRef.id, ...newUser };
        }
    } catch (error) {
        throw error;
    }
}

// 即時監聽器
function setupRealtimeListeners() {
    // 清除舊的監聽器
    unsubscribers.forEach(unsubscribe => unsubscribe());
    unsubscribers = [];
    
    if (useLocalStorage) {
        // 本地模擬器監聽器
        const parkingUnsubscribe = localDb.onSnapshot('parking', (data) => {
            parkingSlots = data;
            renderParkingSlots();
            renderParkingManagement();
        });
        unsubscribers.push(parkingUnsubscribe);
        
        const usersUnsubscribe = localDb.onSnapshot('users', (data) => {
            users = data;
            renderUsers();
        });
        unsubscribers.push(usersUnsubscribe);
    } else {
        // Firebase 監聽器
        const setupFirebaseListeners = async () => {
            const { collection, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            
            const parkingUnsubscribe = onSnapshot(collection(db, 'parking'), (snapshot) => {
                parkingSlots = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderParkingSlots();
                renderParkingManagement();
            });
            unsubscribers.push(parkingUnsubscribe);
            
            const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
                users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderUsers();
            });
            unsubscribers.push(usersUnsubscribe);
        };
        
        setupFirebaseListeners();
    }
}

// 渲染車位列表
function renderParkingSlots() {
    const container = elements.parkingSlots;
    const buildingFilter = elements.buildingFilter.value;
    const typeFilter = elements.typeFilter.value;
    const statusFilter = elements.statusFilter.value;
    
    // 篩選車位
    let filteredSlots = parkingSlots.filter(slot => {
        return (!buildingFilter || slot.building === buildingFilter) &&
               (!typeFilter || slot.type === typeFilter) &&
               (!statusFilter || slot.status === statusFilter);
    });
    
    if (filteredSlots.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>沒有找到符合條件的車位</h3>
                <p>請調整篩選條件或聯繫管理員</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredSlots.map(slot => {
        const statusText = getStatusText(slot.status);
        const statusClass = `status-${slot.status}`;
        const isOwner = currentUser && slot.ownerId === currentUser.employeeNo;
        const canReserve = slot.status === 'open' && !isOwner;
        const canOpen = isOwner && slot.status === 'closed';
        const canClose = isOwner && slot.status === 'open';
        const canCancelReservation = slot.reservedBy === currentUser?.employeeNo;
        
        return `
            <div class="parking-slot">
                <div class="parking-slot-header">
                    <div class="parking-slot-number">${slot.slotNo}</div>
                    <div class="parking-slot-type">${slot.type}</div>
                </div>
                <div class="parking-slot-info">
                    <div class="info-row">
                        <span class="info-label">棟別:</span>
                        <span class="info-value">${slot.building}棟</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">車位主人:</span>
                        <span class="info-value">${slot.ownerName || '未分配'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">狀態:</span>
                        <span class="info-value status ${statusClass}">${statusText}</span>
                    </div>
                    ${slot.reservedBy ? `
                        <div class="info-row">
                            <span class="info-label">預約人:</span>
                            <span class="info-value">${getUserNameById(slot.reservedBy)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="parking-slot-actions">
                    ${canReserve ? `<button class="btn btn--primary" onclick="reserveSlot('${slot.id}')">預約</button>` : ''}
                    ${canOpen ? `<button class="btn btn--success" onclick="openSlot('${slot.id}')">開放</button>` : ''}
                    ${canClose ? `<button class="btn btn--warning" onclick="closeSlot('${slot.id}')">關閉</button>` : ''}
                    ${canCancelReservation ? `<button class="btn btn--outline" onclick="cancelReservation('${slot.id}')">取消預約</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    elements.loadingSpinner.style.display = 'none';
}

// 渲染用戶列表
function renderUsers() {
    if (currentUser?.role !== 'super') return;
    
    const container = elements.usersList;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>暫無用戶資料</h3>
                <button class="btn btn--primary" onclick="showAddUserModal()">新增第一個用戶</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-card-header">
                <div class="user-name">${user.name}</div>
                <div class="user-role role-${user.role}">${user.role === 'super' ? '管理員' : '一般用戶'}</div>
            </div>
            <div class="info-row">
                <span class="info-label">工號:</span>
                <span class="info-value">${user.employeeNo}</span>
            </div>
            <div class="user-card-actions">
                <button class="btn btn--outline btn--sm" onclick="editUser('${user.id}')">編輯</button>
                ${user.role !== 'super' ? `<button class="btn btn--outline btn--sm" onclick="deleteUser('${user.id}')">刪除</button>` : ''}
            </div>
        </div>
    `).join('');
}

// 渲染車位管理列表
function renderParkingManagement() {
    if (currentUser?.role !== 'super') return;
    
    const container = elements.parkingManagementList;
    
    if (parkingSlots.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>暫無車位資料</h3>
                <button class="btn btn--primary" onclick="showAddParkingModal()">新增第一個車位</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = parkingSlots.map(slot => `
        <div class="parking-card">
            <div class="parking-slot-header">
                <div class="parking-slot-number">${slot.slotNo}</div>
                <div class="parking-slot-type">${slot.type}</div>
            </div>
            <div class="info-row">
                <span class="info-label">棟別:</span>
                <span class="info-value">${slot.building}棟</span>
            </div>
            <div class="info-row">
                <span class="info-label">車位主人:</span>
                <span class="info-value">${slot.ownerName || '未分配'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">狀態:</span>
                <span class="info-value">${getStatusText(slot.status)}</span>
            </div>
            <div class="parking-card-actions">
                <button class="btn btn--outline btn--sm" onclick="editParking('${slot.id}')">編輯</button>
                <button class="btn btn--outline btn--sm" onclick="assignOwner('${slot.id}')">分配主人</button>
                <button class="btn btn--outline btn--sm" onclick="deleteParking('${slot.id}')">刪除</button>
            </div>
        </div>
    `).join('');
}

// 車位操作
async function reserveSlot(slotId) {
    try {
        if (useLocalStorage) {
            await localDb.update('parking', slotId, {
                status: 'reserved',
                reservedBy: currentUser.employeeNo
            });
        } else {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const slotRef = doc(db, 'parking', slotId);
            await updateDoc(slotRef, {
                status: 'reserved',
                reservedBy: currentUser.employeeNo
            });
        }
    } catch (error) {
        console.error('預約車位失敗:', error);
        alert('預約失敗，請稍後再試');
    }
}

async function openSlot(slotId) {
    try {
        if (useLocalStorage) {
            await localDb.update('parking', slotId, {
                status: 'open',
                reservedBy: null
            });
        } else {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const slotRef = doc(db, 'parking', slotId);
            await updateDoc(slotRef, {
                status: 'open',
                reservedBy: null
            });
        }
    } catch (error) {
        console.error('開放車位失敗:', error);
        alert('開放失敗，請稍後再試');
    }
}

async function closeSlot(slotId) {
    try {
        if (useLocalStorage) {
            await localDb.update('parking', slotId, {
                status: 'closed',
                reservedBy: null
            });
        } else {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const slotRef = doc(db, 'parking', slotId);
            await updateDoc(slotRef, {
                status: 'closed',
                reservedBy: null
            });
        }
    } catch (error) {
        console.error('關閉車位失敗:', error);
        alert('關閉失敗，請稍後再試');
    }
}

async function cancelReservation(slotId) {
    try {
        if (useLocalStorage) {
            await localDb.update('parking', slotId, {
                status: 'open',
                reservedBy: null
            });
        } else {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const slotRef = doc(db, 'parking', slotId);
            await updateDoc(slotRef, {
                status: 'open',
                reservedBy: null
            });
        }
    } catch (error) {
        console.error('取消預約失敗:', error);
        alert('取消預約失敗，請稍後再試');
    }
}

// 模態框操作
function showAddUserModal() {
    const content = `
        <form class="modal-form" onsubmit="addUser(event)">
            <div class="form-group">
                <label class="form-label" for="modalUserName">姓名</label>
                <input type="text" id="modalUserName" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="modalUserEmployeeNo">工號</label>
                <input type="text" id="modalUserEmployeeNo" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="modalUserPassword">密碼</label>
                <input type="password" id="modalUserPassword" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="modalUserRole">角色</label>
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
                <label class="form-label" for="modalSlotNo">車位號碼</label>
                <input type="text" id="modalSlotNo" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="modalSlotType">車位種類</label>
                <select id="modalSlotType" class="form-control">
                    <option value="汽車">汽車</option>
                    <option value="機車">機車</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="modalSlotBuilding">棟別</label>
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

// CRUD 操作
async function addUser(event) {
    event.preventDefault();
    
    try {
        const name = document.getElementById('modalUserName').value;
        const employeeNo = document.getElementById('modalUserEmployeeNo').value;
        const password = document.getElementById('modalUserPassword').value;
        const role = document.getElementById('modalUserRole').value;
        
        if (useLocalStorage) {
            await localDb.add('users', {
                name,
                employeeNo,
                password,
                role
            });
        } else {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            await addDoc(collection(db, 'users'), {
                name,
                employeeNo,
                password,
                role
            });
        }
        
        hideModal();
    } catch (error) {
        console.error('新增用戶失敗:', error);
        alert('新增失敗，請稍後再試');
    }
}

async function addParking(event) {
    event.preventDefault();
    
    try {
        const slotNo = document.getElementById('modalSlotNo').value;
        const type = document.getElementById('modalSlotType').value;
        const building = document.getElementById('modalSlotBuilding').value;
        
        const newSlot = {
            slotNo,
            type,
            building,
            ownerId: null,
            ownerName: '未分配',
            status: 'available',
            reservedBy: null
        };
        
        if (useLocalStorage) {
            await localDb.add('parking', newSlot);
        } else {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            await addDoc(collection(db, 'parking'), newSlot);
        }
        
        hideModal();
    } catch (error) {
        console.error('新增車位失敗:', error);
        alert('新增失敗，請稍後再試');
    }
}

async function deleteUser(userId) {
    if (confirm('確定要刪除此用戶嗎？')) {
        try {
            if (useLocalStorage) {
                await localDb.delete('users', userId);
            } else {
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                await deleteDoc(doc(db, 'users', userId));
            }
        } catch (error) {
            console.error('刪除用戶失敗:', error);
            alert('刪除失敗，請稍後再試');
        }
    }
}

async function deleteParking(parkingId) {
    if (confirm('確定要刪除此車位嗎？')) {
        try {
            if (useLocalStorage) {
                await localDb.delete('parking', parkingId);
            } else {
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                await deleteDoc(doc(db, 'parking', parkingId));
            }
        } catch (error) {
            console.error('刪除車位失敗:', error);
            alert('刪除失敗，請稍後再試');
        }
    }
}

// 工具函數
function getStatusText(status) {
    const statusMap = {
        'open': '開放中',
        'closed': '關閉',
        'reserved': '已預約',
        'available': '可分配'
    };
    return statusMap[status] || status;
}

function getUserNameById(employeeNo) {
    const user = users.find(u => u.employeeNo === employeeNo);
    return user ? user.name : employeeNo;
}

// 編輯和分配功能的佔位符
function editUser(userId) {
    alert('編輯用戶功能待實作');
}

function editParking(parkingId) {
    alert('編輯車位功能待實作');
}

function assignOwner(parkingId) {
    alert('分配車位主人功能待實作');
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化測試資料
        await initializeTestData();
        
        // 設定即時監聽器
        setupRealtimeListeners();
        
        // 顯示連接狀態
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `connection-status ${useLocalStorage ? 'connection-offline' : 'connection-online'}`;
        statusIndicator.textContent = useLocalStorage ? '本地模擬模式' : 'Firebase 已連接';
        document.body.appendChild(statusIndicator);
        
        // 登入表單
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const user = await login(elements.employeeNo.value, elements.password.value);
                
                elements.currentUser.textContent = user.name;
                
                if (user.role === 'super') {
                    elements.adminNav.classList.remove('hidden');
                } else {
                    elements.adminNav.classList.add('hidden');
                }
                
                showPage('mainApp');
                showView('parkingView');
                
            } catch (error) {
                showError('loginError', error.message);
            }
        });
        
        // 註冊表單
        elements.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                await register(
                    elements.regName.value,
                    elements.regEmployeeNo.value,
                    elements.regPassword.value
                );
                
                alert('註冊成功！請使用新帳號登入。');
                showPage('loginPage');
                
            } catch (error) {
                showError('registerError', error.message);
            }
        });
        
        // 頁面切換
        elements.showRegister.addEventListener('click', () => showPage('registerPage'));
        elements.showLogin.addEventListener('click', () => showPage('loginPage'));
        
        // 登出
        elements.logoutBtn.addEventListener('click', () => {
            currentUser = null;
            // 清除監聽器
            unsubscribers.forEach(unsubscribe => unsubscribe());
            unsubscribers = [];
            showPage('loginPage');
        });
        
        // 視圖切換
        elements.showParkingView.addEventListener('click', () => showView('parkingView'));
        elements.showUserManagement.addEventListener('click', () => showView('userManagement'));
        elements.showParkingManagement.addEventListener('click', () => showView('parkingManagement'));
        
        // 篩選器
        [elements.buildingFilter, elements.typeFilter, elements.statusFilter].forEach(filter => {
            filter.addEventListener('change', renderParkingSlots);
        });
        
        // 模態框
        elements.modalClose.addEventListener('click', hideModal);
        elements.modal.querySelector('.modal-overlay').addEventListener('click', hideModal);
        
        // 新增按鈕
        elements.addUserBtn.addEventListener('click', showAddUserModal);
        elements.addParkingBtn.addEventListener('click', showAddParkingModal);
        
    } catch (error) {
        console.error('應用程式初始化失敗:', error);
        alert('應用程式初始化失敗，請檢查 Firebase 配置');
    }
});

// 將函數暴露到全域範圍以便 HTML 中的 onclick 事件使用
window.reserveSlot = reserveSlot;
window.openSlot = openSlot;
window.closeSlot = closeSlot;
window.cancelReservation = cancelReservation;
window.addUser = addUser;
window.addParking = addParking;
window.deleteUser = deleteUser;
window.deleteParking = deleteParking;
window.editUser = editUser;
window.editParking = editParking;
window.assignOwner = assignOwner;
window.showAddUserModal = showAddUserModal;
window.showAddParkingModal = showAddParkingModal;
window.hideModal = hideModal;