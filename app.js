/* 修正版 app.js：Firebase v9 CDN + 即時同步 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getFirestore, collection, getDocs, addDoc,
  query, where, onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/* ========= Firebase Config ========= */
const firebaseConfig = {
  apiKey: 'AIzaSyDdERse0mjGpwlHSZGo2WA8tFGSE235Bz8',
  authDomain: 'mypark-42e1d.firebaseapp.com',
  projectId: 'mypark-42e1d',
  storageBucket: 'mypark-42e1d.appspot.com',
  messagingSenderId: '893866513050',
  appId: '1:893866513050:web:f52586fd9eea28aa354523'
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ========= DOM 快捷 ========= */
const $ = id => document.getElementById(id);
const el = {
  loginPage:          $('loginPage'),
  registerPage:       $('registerPage'),
  mainApp:            $('mainApp'),
  loginForm:          $('loginForm'),
  registerForm:       $('registerForm'),
  showRegister:       $('showRegister'),
  showLogin:          $('showLogin'),
  loginError:         $('loginError'),
  registerError:      $('registerError'),
  employeeNo:         $('employeeNo'),
  password:           $('password'),
  regName:            $('regName'),
  regEmployeeNo:      $('regEmployeeNo'),
  regPassword:        $('regPassword'),
  currentUser:        $('currentUser'),
  logoutBtn:          $('logoutBtn'),
  adminNav:           $('adminNav'),
  showParkingView:    $('showParkingView'),
  showUserManagement: $('showUserManagement'),
  showParkingManagement:$('showParkingManagement'),
  parkingView:        $('parkingView'),
  userManagement:     $('userManagement'),
  parkingManagement:  $('parkingManagement'),
  buildingFilter:     $('buildingFilter'),
  typeFilter:         $('typeFilter'),
  statusFilter:       $('statusFilter'),
  parkingSlots:       $('parkingSlots'),
  usersList:          $('usersList')
};

/* ========= 狀態 ========= */
let currentUser = null;
let parking     = [];
let users       = [];

/* ========= 輔助 ========= */
const showPage = p => {
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  el[p].classList.add('active');
};
const showView = v => {
  document.querySelectorAll('.content-view').forEach(x=>x.classList.remove('active'));
  el[v].classList.add('active');
};
const showErr = (id,msg) => {
  const e = el[id]; e.textContent = msg; e.classList.remove('hidden');
  setTimeout(()=>e.classList.add('hidden'),4000);
};

/* ========= Auth (以 Firestore users 集合示範) ========= */
async function login(emp,pwd){
  const q  = query(collection(db,'users'),where('employeeNo','==',emp));
  const rs = await getDocs(q);
  if(rs.empty) throw new Error('找不到此工號');
  const u = {id:rs.docs[0].id,...rs.docs[0].data()};
  if(u.password!==pwd) throw new Error('密碼錯誤');
  return u;
}
async function register(name,emp,pwd){
  const q = query(collection(db,'users'),where('employeeNo','==',emp));
  if(!(await getDocs(q)).empty) throw new Error('工號已存在');
  await addDoc(collection(db,'users'),{name,employeeNo:emp,password:pwd,role:'user'});
}

/* ========= 渲染 ========= */
const renderParking = ()=>{
  const html = parking.map(s=>`
    <div class="parking-slot">
      <div class="parking-slot-header">
        <span>${s.slotNo}</span><span class="status-${s.status}">${s.status}</span>
      </div>
      <p>棟別：${s.building}</p><p>主人：${s.ownerName||'未分配'}</p>
    </div>`).join('');
  el.parkingSlots.innerHTML = html || '<p class="text-center">目前沒有車位資料</p>';
};
const renderUsers = ()=>{
  const html = users.map(u=>`<div class="user-card">${u.name} (${u.employeeNo})</div>`).join('');
  el.usersList.innerHTML = html || '<p class="text-center">目前沒有會員資料</p>';
};

/* ========= 即時監聽 ========= */
onSnapshot(collection(db,'parking'),snap=>{
  parking = snap.docs.map(d=>({id:d.id,...d.data()}));
  renderParking();
});
onSnapshot(collection(db,'users'),snap=>{
  users = snap.docs.map(d=>({id:d.id,...d.data()}));
  renderUsers();
});

/* ========= 事件 ========= */
document.addEventListener('DOMContentLoaded',()=>{
  /* 頁面切換 */
  el.showRegister.onclick = ()=>showPage('registerPage');
  el.showLogin.onclick    = ()=>showPage('loginPage');

  /* 登入 */
  el.loginForm.onsubmit = async e=>{
    e.preventDefault();
    try{
      currentUser = await login(el.employeeNo.value,el.password.value);
      el.currentUser.textContent = currentUser.name;
      if(currentUser.role==='super') el.adminNav.classList.remove('hidden');
      else                           el.adminNav.classList.add('hidden');
      showPage('mainApp'); showView('parkingView');
    }catch(err){ showErr('loginError',err.message); }
  };

  /* 註冊 */
  el.registerForm.onsubmit = async e=>{
    e.preventDefault();
    try{
      await register(el.regName.value,el.regEmployeeNo.value,el.regPassword.value);
      alert('註冊成功！請登入。');
      showPage('loginPage');
    }catch(err){ showErr('registerError',err.message); }
  };

  /* 登出 */
  el.logoutBtn.onclick = ()=>{ currentUser=null; showPage('loginPage'); };

  /* 管理選單切換 */
  el.showParkingView.onclick      = ()=>showView('parkingView');
  el.showUserManagement.onclick   = ()=>showView('userManagement');
  el.showParkingManagement.onclick= ()=>showView('parkingManagement');
});
