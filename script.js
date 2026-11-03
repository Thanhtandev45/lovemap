/**
 * TxT — OUR LITTLE UNIVERSE
 * Tân × Trân — "Hai Cuộc Đời, Một Câu Chuyện"
 * 
 * Technology: HTML5, CSS3, Vanilla JavaScript, Firebase Auth, Firebase Realtime Database, Leaflet.js
 */

// ==========================================================================
// 1. CẤU HÌNH FIREBASE & TÀI KHOẢN
// ==========================================================================

/**
 * THAY THẾ THÔNG TIN DƯỚI ĐÂY BẰNG CẤU HÌNH TỪ FIREBASE CONSOLE CỦA BẠN:
 * Firebase Console -> Project Settings -> General -> Your apps -> Web app -> SDK setup and configuration -> Config
 */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwkVyxGchsg1iSgQoMoBQjSHy4Q199YQ8",
  authDomain: "map-txt.firebaseapp.com",
  projectId: "map-txt",
  storageBucket: "map-txt.firebasestorage.app",
  messagingSenderId: "343278929275",
  appId: "1:343278929275:web:17a6b43a4acd8dd72b69de",
  measurementId: "G-VTL9SG4PBB"
};

// Hỗ trợ cả 2 cách đặt tên biến để không bao giờ bị lỗi ReferenceError


/**
 * CẤU HÌNH UID CỦA HAI TÀI KHOẢN (Lấy từ Firebase Console -> Authentication -> Users):
 * Điền UID của Tân và Trân vào đây để xác định danh tính và quyền hạn.
 */
const AUTHORIZED_USERS = {
  // UID của Tân trong Firebase Authentication
  TAN_UID: "wuWWFPnarrcYVHnrlkw3lzLAnEx2",
  
  // UID của Trân trong Firebase Authentication
  TRAN_UID: "XwEWaEoNP0XSMqYcBRYkqP1lhh33"
};

// ==========================================================================
// 2. MỐC THỜI GIAN TÌNH YÊU (LOVE MILESTONES)
// ==========================================================================
// Mốc 1: Ngày bắt đầu quen nhau: 22/10/2025
const DATE_START_ACQUAINTED = new Date("2025-10-22T00:00:00+07:00").getTime();

// Mốc 2: Ngày chính thức hẹn hò: 15/09/2026
const DATE_START_DATING = new Date("2026-09-15T00:00:00+07:00").getTime();

// Danh ngôn tình yêu ngẫu nhiên hiển thị ở trang chủ
const LOVE_QUOTES = [
  "“Dù đi bao xa hay ở bất cứ nơi đâu, chỉ cần nhìn lên bầu trời, hai ta luôn hướng về một vì sao duy nhất.”",
  "“Hai quỹ đạo từng cô đơn giữa dải ngân hà, giờ đây đã tìm thấy lực hút của cuộc đời mình.”",
  "“Khoảng cách địa lý chỉ là những con số, tình yêu của chúng ta mới là vĩnh hằng.”",
  "“Mỗi bước chân em đi, luôn có anh dõi theo và đồng hành cùng em qua mọi nẻo đường.”",
  "“Vũ trụ bao la hàng tỷ năm ánh sáng, kỳ diệu nhất là đã mang Tân và Trân đến bên nhau.”"
];

// ==========================================================================
// 3. GLOBAL APP STATE
// ==========================================================================
const AppState = {
  currentUser: null,           // Firebase User object
  currentRole: null,           // 'tan' | 'tran' | null
  partnerRole: null,           // 'tran' | 'tan' | null
  partnerUid: null,            // Partner UID

  // GPS & Location
  myLocation: null,            // { lat, lng, accuracy, speed, heading, updatedAt }
  partnerLocation: null,       // { lat, lng, accuracy, speed, heading, updatedAt }
  gpsWatcherId: null,
  isGpsActive: false,
  lastGpsFixTime: null,
  isMapPickingDestination: false,

  // Sharing Settings
  sharingEnabled: true,
  sharingExpiresAt: null,      // timestamp or null (always)
  selectedDurationHours: 0,    // 0 = always

  // Active Trip
  myTrip: {
    active: false,
    destination: null,         // { name, lat, lng }
    startedAt: null,
    recordTrail: false,
    trail: []                  // Array of [lat, lng]
  },
  partnerTrip: {
    active: false,
    destination: null,
    startedAt: null,
    trail: []
  },

  // Map Instances & Layers
  map: null,
  myMarker: null,
  partnerMarker: null,
  destinationMarker: null,
  routePolyline: null,
  trailPolyline: null,
  partnerRoutePolyline: null,
  currentTileLayer: 'dark',    // 'dark' | 'osm' | 'voyager'
  tileLayers: {}
};

// ==========================================================================
// 4. INITIALIZATION & ENTRY POINT
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initStarfieldCanvas();
  initLoveCounters();
  initTabNavigation();
  initSettingsUI();
  initTripUI();
  initAuthForm(); // Luôn gắn lắng nghe submit form ngay lập tức để không bao giờ bị reload trang
  initFirebase();
  initVisibilityListener();
});

// ==========================================================================
// 5. COSMIC STARFIELD BACKGROUND (CANVAS)
// ==========================================================================
function initStarfieldCanvas() {
  const canvas = document.getElementById("starfield-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let stars = [];
  const starCount = 85;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.015 + 0.005,
      direction: Math.random() > 0.5 ? 1 : -1
    });
  }

  function renderStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let star of stars) {
      star.alpha += star.speed * star.direction;
      if (star.alpha > 0.95) {
        star.alpha = 0.95;
        star.direction = -1;
      } else if (star.alpha < 0.15) {
        star.alpha = 0.15;
        star.direction = 1;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 213, 255, ${star.alpha})`;
      ctx.shadowBlur = star.radius > 1 ? 6 : 0;
      ctx.shadowColor = "#c084fc";
      ctx.fill();
    }

    requestAnimationFrame(renderStars);
  }
  renderStars();
}

// ==========================================================================
// 6. LOVE COUNTER LOGIC (CẬP NHẬT MỖI GIÂY)
// ==========================================================================
function initLoveCounters() {
  // Elements for Mốc 1: Quen nhau
  const qnDays = document.getElementById("qn-days");
  const qnHours = document.getElementById("qn-hours");
  const qnMinutes = document.getElementById("qn-minutes");
  const qnSeconds = document.getElementById("qn-seconds");
  const qnMilestoneText = document.getElementById("qn-milestone-text");

  // Elements for Mốc 2: Hẹn hò
  const hhDays = document.getElementById("hh-days");
  const hhHours = document.getElementById("hh-hours");
  const hhMinutes = document.getElementById("hh-minutes");
  const hhSeconds = document.getElementById("hh-seconds");
  const hhMilestoneText = document.getElementById("hh-milestone-text");

  // Pick a random sweet quote
  const quoteElem = document.getElementById("dynamic-love-quote");
  if (quoteElem) {
    quoteElem.textContent = LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];
  }

  function updateCounters() {
    const now = Date.now();

    // 1. Tính toán Mốc 1: Quen nhau (22/10/2025)
    renderCounterValues(now, DATE_START_ACQUAINTED, {
      daysElem: qnDays,
      hoursElem: qnHours,
      minElem: qnMinutes,
      secElem: qnSeconds,
      milestoneElem: qnMilestoneText,
      pastTemplate: "Tân & Trân đã quen nhau được {days} ngày tuyệt đẹp ✨",
      futureTemplate: "Đếm ngược ngày quen nhau: còn {days} ngày 💫"
    });

    // 2. Tính toán Mốc 2: Hẹn hò (15/09/2026)
    renderCounterValues(now, DATE_START_DATING, {
      daysElem: hhDays,
      hoursElem: hhHours,
      minElem: hhMinutes,
      secElem: hhSeconds,
      milestoneElem: hhMilestoneText,
      pastTemplate: "Chính thức cùng nhau chung đôi được {days} ngày 💖",
      futureTemplate: "Đếm ngược ngày chính thức hẹn hò: còn {days} ngày 🌸"
    });
  }

  function renderCounterValues(now, targetTimestamp, config) {
    const diffMs = now - targetTimestamp;
    const isElapsed = diffMs >= 0;
    const absDiff = Math.abs(diffMs);

    const totalSeconds = Math.floor(absDiff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (config.daysElem) config.daysElem.textContent = String(days).padStart(2, "0");
    if (config.hoursElem) config.hoursElem.textContent = String(hours).padStart(2, "0");
    if (config.minElem) config.minElem.textContent = String(minutes).padStart(2, "0");
    if (config.secElem) config.secElem.textContent = String(seconds).padStart(2, "0");

    if (config.milestoneElem) {
      const template = isElapsed ? config.pastTemplate : config.futureTemplate;
      config.milestoneElem.textContent = template.replace("{days}", days);
    }
  }

  // Chạy ngay lập tức và đặt interval mỗi giây
  updateCounters();
  setInterval(updateCounters, 1000);
}

// ==========================================================================
// 7. TAB NAVIGATION
// ==========================================================================
function initTabNavigation() {
  const navBtns = document.querySelectorAll(".bottom-nav .nav-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.getAttribute("data-tab");

      navBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(pane => pane.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add("active");
      }

      // Khi chuyển sang Tab Map, cần gọi map.invalidateSize() để Leaflet vẽ đúng kích thước container
      if (targetTabId === "tab-map") {
        setTimeout(() => {
          if (!AppState.map) {
            initLeafletMap();
          } else {
            AppState.map.invalidateSize();
            fitBothMarkersIfAvailable();
          }
        }, 150);
      }
    });
  });
}

// ==========================================================================
// 8. FIREBASE AUTH & REALTIME DATABASE INTEGRATION
// ==========================================================================
function initAuthForm() {
  const authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("submit", handleLoginSubmit);
  }
}

function isFirebaseConfigured() {
  const cfg = (typeof FIREBASE_CONFIG !== "undefined" ? FIREBASE_CONFIG : null) || 
              (typeof firebaseConfig !== "undefined" ? firebaseConfig : null);
  if (!cfg) return false;
  return (
    cfg.apiKey &&
    cfg.apiKey !== "YOUR_API_KEY" &&
    cfg.projectId &&
    cfg.projectId !== "YOUR_PROJECT_ID"
  );
}

function initFirebase() {
  const fbIndicator = document.getElementById("fb-connection-indicator");
  const fbText = document.getElementById("fb-connection-text");

  const cfg = (typeof FIREBASE_CONFIG !== "undefined" ? FIREBASE_CONFIG : null) || 
              (typeof firebaseConfig !== "undefined" ? firebaseConfig : null);

  if (!isFirebaseConfigured()) {
    console.warn("⚠️ Firebase chưa được cấu hình. Vui lòng điền thông tin FIREBASE_CONFIG trong script.js");
    if (fbIndicator) fbIndicator.className = "fb-indicator error";
    if (fbText) fbText.textContent = "Chưa cấu hình Firebase (Xem hướng dẫn trong script.js)";
    showAuthModal(true);
    return;
  }

  // Tự động bổ sung databaseURL nếu thiếu
  if (!cfg.databaseURL) {
    cfg.databaseURL = `https://${cfg.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
  }

  try {
    // Khởi tạo Firebase App qua SDK Compat
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }

    if (fbIndicator) fbIndicator.className = "fb-indicator connected";
    if (fbText) fbText.textContent = "Đã kết nối Firebase (" + cfg.projectId + ")";

    // Lắng nghe trạng thái đăng nhập
    firebase.auth().onAuthStateChanged(handleAuthStateChanged);

    // Xử lý sự kiện Đăng xuất
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", handleLogout);
    }

  } catch (err) {
    console.error("Lỗi khởi tạo Firebase:", err);
    if (fbIndicator) fbIndicator.className = "fb-indicator error";
    if (fbText) fbText.textContent = "Lỗi kết nối Firebase: " + err.message;
    showToast("Lỗi kết nối Firebase: " + err.message, "error");
  }
}

function handleAuthStateChanged(user) {
  const authModal = document.getElementById("auth-modal");
  const userBadge = document.getElementById("user-badge");
  const currentUserName = document.getElementById("current-user-name");
  const currentUserAvatar = document.getElementById("current-user-avatar");

  if (user) {
    // Kiểm tra UID
    AppState.currentUser = user;
    const uid = user.uid;

    // Phân quyền Tân hoặc Trân
    identifyUserRole(user);

    // Ẩn modal đăng nhập
    if (authModal) authModal.classList.add("hidden");

    // Hiển thị badge người dùng trên header
    if (userBadge) {
      userBadge.classList.remove("hidden");
      if (currentUserName) currentUserName.textContent = AppState.currentRole === "tan" ? "Tân 💜" : "Trân 🌸";
      if (currentUserAvatar) currentUserAvatar.textContent = AppState.currentRole === "tan" ? "💜" : "🌸";
    }

    // Cập nhật giao diện Settings
    updateSettingsUserProfile();

    showToast(`Chào mừng ${AppState.currentRole === "tan" ? "Tân" : "Trân"} đến với Vũ Trụ của chúng mình ✨`, "success");

    // Bắt đầu lắng nghe dữ liệu từ Realtime Database
    setupFirebaseListeners();

    // Bắt đầu lấy vị trí GPS thực tế
    startGpsTracking();

  } else {
    // Chưa đăng nhập
    AppState.currentUser = null;
    AppState.currentRole = null;
    AppState.partnerRole = null;
    AppState.partnerUid = null;

    if (userBadge) userBadge.classList.add("hidden");
    showAuthModal(false);
    stopGpsTracking();
  }
}

function identifyUserRole(user) {
  const uid = user.uid;
  const email = (user.email || "").toLowerCase();

  if (uid === AUTHORIZED_USERS.TAN_UID || email.includes("tan")) {
    AppState.currentRole = "tan";
    AppState.partnerRole = "tran";
    AppState.partnerUid = AUTHORIZED_USERS.TRAN_UID;
  } else if (uid === AUTHORIZED_USERS.TRAN_UID || email.includes("tran")) {
    AppState.currentRole = "tran";
    AppState.partnerRole = "tan";
    AppState.partnerUid = AUTHORIZED_USERS.TAN_UID;
  } else {
    // Mặc định dựa trên UID hoặc gán role nếu chưa cấu hình đúng
    AppState.currentRole = "tan";
    AppState.partnerRole = "tran";
    AppState.partnerUid = AUTHORIZED_USERS.TRAN_UID;
  }
}

async function handleLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");
  const errorMsg = document.getElementById("login-error-msg");
  const submitBtn = document.getElementById("btn-login-submit");

  if (!emailInput || !passInput) return;

  const email = emailInput.value.trim();
  const password = passInput.value;

  if (errorMsg) errorMsg.classList.add("hidden");

  if (typeof firebase === "undefined" || !firebase.auth) {
    if (errorMsg) {
      errorMsg.textContent = "Chưa kết nối được với Firebase. Hãy kiểm tra kết nối mạng của bạn.";
      errorMsg.classList.remove("hidden");
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳</span> Đang xác thực...`;
  }

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    // Thành công -> onAuthStateChanged sẽ tự động đóng modal và vào trang chủ
  } catch (err) {
    console.error("Đăng nhập thất bại:", err);
    let msg = "Email hoặc mật khẩu không chính xác.";
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "Tài khoản hoặc mật khẩu không đúng. Hãy kiểm tra lại tài khoản Firebase của bạn.";
    } else if (err.code === "auth/too-many-requests") {
      msg = "Bạn đã thử đăng nhập quá nhiều lần. Hãy đợi một chút và thử lại.";
    } else if (err.code === "auth/network-request-failed") {
      msg = "Lỗi kết nối mạng tới Firebase. Hãy kiểm tra kết nối Internet.";
    } else {
      msg = err.message;
    }

    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.classList.remove("hidden");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>💜</span> Đăng Nhập`;
    }
  }
}

function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi Vũ Trụ?")) {
    firebase.auth().signOut().then(() => {
      showToast("Đã đăng xuất.", "info");
      location.reload();
    });
  }
}

function showAuthModal(isNotConfigured) {
  const authModal = document.getElementById("auth-modal");
  const errorMsg = document.getElementById("login-error-msg");
  if (!authModal) return;

  authModal.classList.remove("hidden");

  if (isNotConfigured && errorMsg) {
    errorMsg.innerHTML = `
      <strong>Chưa cấu hình Firebase!</strong><br>
      Vui lòng mở file <code>script.js</code> và dán <code>FIREBASE_CONFIG</code> từ Firebase Console của bạn.
    `;
    errorMsg.classList.remove("hidden");
  }
}

// ==========================================================================
// 9. FIREBASE REALTIME DATABASE SYNC
// ==========================================================================
function setupFirebaseListeners() {
  if (!AppState.currentUser) return;
  const db = firebase.database();
  const myUid = AppState.currentUser.uid;
  const partnerUid = AppState.partnerUid;

  // 1. Cập nhật profile cơ bản của mình lên DB nếu chưa có
  db.ref(`users/${myUid}/profile`).update({
    name: AppState.currentRole === "tan" ? "Tân" : "Trân",
    role: AppState.currentRole,
    email: AppState.currentUser.email,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  });

  // 2. Lắng nghe trạng thái Chia sẻ của chính mình
  db.ref(`users/${myUid}/sharing`).on("value", snapshot => {
    const val = snapshot.val();
    if (val) {
      AppState.sharingEnabled = val.enabled !== false;
      AppState.sharingExpiresAt = val.expiresAt || null;
      updateSharingUIFromState();
    }
  });

  // 3. Lắng nghe chuyến đi của chính mình
  db.ref(`users/${myUid}/trip`).on("value", snapshot => {
    const val = snapshot.val();
    if (val && val.active) {
      AppState.myTrip = val;
      renderActiveTripUI(true);
    } else {
      AppState.myTrip.active = false;
      renderActiveTripUI(false);
    }
  });

  // 4. Lắng nghe vị trí, quyền chia sẻ và chuyến đi của ĐỐI PHƯƠNG
  if (partnerUid && partnerUid !== "PASTE_TAN_FIREBASE_UID_HERE" && partnerUid !== "PASTE_TRAN_FIREBASE_UID_HERE") {
    listenToPartnerData(partnerUid);
  } else {
    // Nếu partnerUid chưa được điền chính xác, thử tìm tài khoản thứ hai trong nhánh users
    db.ref("users").limitToFirst(5).on("value", snapshot => {
      const usersData = snapshot.val();
      if (!usersData) return;

      Object.keys(usersData).forEach(uid => {
        if (uid !== myUid) {
          AppState.partnerUid = uid;
          listenToPartnerData(uid);
        }
      });
    });
  }
}

function listenToPartnerData(partnerUid) {
  const db = firebase.database();

  // Lắng nghe quyền chia sẻ của đối phương
  db.ref(`users/${partnerUid}/sharing`).on("value", snapshot => {
    const sharingData = snapshot.val();
    const isSharingAllowed = isSharingCurrentlyValid(sharingData);

    if (!isSharingAllowed) {
      // Đối phương tắt chia sẻ hoặc đã hết hạn
      AppState.partnerLocation = null;
      if (AppState.partnerMarker && AppState.map) {
        AppState.map.removeLayer(AppState.partnerMarker);
        AppState.partnerMarker = null;
      }
      if (AppState.routePolyline && AppState.map) {
        AppState.map.removeLayer(AppState.routePolyline);
        AppState.routePolyline = null;
      }
      updatePartnerStatusLabel("Đối phương đang tạm tắt chia sẻ vị trí 🔒");
    }
  });

  // Lắng nghe vị trí GPS của đối phương
  db.ref(`users/${partnerUid}/location`).on("value", snapshot => {
    const loc = snapshot.val();
    if (!loc) {
      updatePartnerStatusLabel("Chưa có tín hiệu GPS");
      return;
    }

    // Kiểm tra xem đối phương có đang bật chia sẻ không
    db.ref(`users/${partnerUid}/sharing`).once("value").then(shareSnap => {
      if (isSharingCurrentlyValid(shareSnap.val())) {
        AppState.partnerLocation = loc;
        updatePartnerMarkerOnMap(loc);
        updatePartnerStatusLabel(formatLastSeenText(loc.updatedAt));
        calculateRouteBetweenPartners();
      }
    });
  });

  // Lắng nghe chuyến đi (Trip) của đối phương
  db.ref(`users/${partnerUid}/trip`).on("value", snapshot => {
    const trip = snapshot.val();
    handlePartnerTripUpdate(trip);
  });
}

function isSharingCurrentlyValid(sharing) {
  if (!sharing) return false;
  if (sharing.enabled === false) return false;
  if (sharing.expiresAt && sharing.expiresAt < Date.now()) return false;
  return true;
}

// Đẩy vị trí GPS của mình lên Firebase
function syncMyLocationToFirebase(coords) {
  if (!AppState.currentUser) return;
  const db = firebase.database();
  const myUid = AppState.currentUser.uid;

  // Kiểm tra nếu chia sẻ đã hết hạn
  if (AppState.sharingExpiresAt && AppState.sharingExpiresAt < Date.now()) {
    AppState.sharingEnabled = false;
    AppState.sharingExpiresAt = null;
    db.ref(`users/${myUid}/sharing`).update({
      enabled: false,
      expiresAt: null
    });
    return;
  }

  const payload = {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: Math.round(coords.accuracy),
    speed: coords.speed ? Math.round(coords.speed * 3.6) : 0, // km/h
    heading: coords.heading || null,
    updatedAt: Date.now()
  };

  AppState.myLocation = payload;
  AppState.lastGpsFixTime = payload.updatedAt;

  // Ghi vào Realtime Database
  db.ref(`users/${myUid}/location`).set(payload);

  // Cập nhật marker trên bản đồ
  updateMyMarkerOnMap(payload);

  // Nếu đang trong chuyến đi và có bật opt-in trail
  if (AppState.myTrip && AppState.myTrip.active) {
    updateActiveTripNavigation(payload);
  }

  // Tính khoảng cách / tuyến đường nếu đối phương có vị trí
  if (AppState.partnerLocation) {
    calculateRouteBetweenPartners();
  }
}

// ==========================================================================
// 10. REAL GPS TRACKING (BROWSER GEOLOCATION API)
// ==========================================================================
function startGpsTracking() {
  if (!("geolocation" in navigator)) {
    showToast("Trình duyệt của bạn không hỗ trợ Geolocation API.", "error");
    updateGpsBadge("inactive", "GPS không hỗ trợ");
    return;
  }

  updateGpsBadge("inactive", "GPS: Đang kích hoạt...");

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 3000
  };

  // Hủy watcher cũ nếu có
  if (AppState.gpsWatcherId !== null) {
    navigator.geolocation.clearWatch(AppState.gpsWatcherId);
  }

  AppState.gpsWatcherId = navigator.geolocation.watchPosition(
    onGpsSuccess,
    onGpsError,
    geoOptions
  );

  // Bắt đầu timer kiểm tra dữ liệu GPS cũ (Stale Detection)
  setInterval(checkGpsFreshness, 10000);
}

function stopGpsTracking() {
  if (AppState.gpsWatcherId !== null) {
    navigator.geolocation.clearWatch(AppState.gpsWatcherId);
    AppState.gpsWatcherId = null;
  }
  AppState.isGpsActive = false;
  updateGpsBadge("inactive", "GPS: Tắt");
}

function onGpsSuccess(position) {
  AppState.isGpsActive = true;
  updateGpsBadge("active", "GPS: Trực tiếp");

  // Đồng bộ vị trí thực tế
  syncMyLocationToFirebase(position.coords);

  // Cập nhật thẻ chẩn đoán trong Cài đặt
  updateDiagnosticsUI(position.coords);
}

function onGpsError(err) {
  AppState.isGpsActive = false;
  let errorMsg = "Lỗi GPS";
  switch (err.code) {
    case err.PERMISSION_DENIED:
      errorMsg = "Bị từ chối cấp quyền GPS";
      showToast("Vui lòng cho phép quyền truy cập Vị trí trên Google Chrome để dùng Live Map.", "error");
      break;
    case err.POSITION_UNAVAILABLE:
      errorMsg = "Không tìm thấy tín hiệu GPS";
      break;
    case err.TIMEOUT:
      errorMsg = "Hết thời gian chờ GPS";
      break;
  }
  updateGpsBadge("inactive", `GPS: ${errorMsg}`);
  console.warn("Geolocation Watch Error:", err);
}

function checkGpsFreshness() {
  if (!AppState.lastGpsFixTime) return;
  const elapsed = Date.now() - AppState.lastGpsFixTime;

  // Nếu quá 3 phút không nhận được tọa độ mới (điện thoại khóa màn hình / Chrome bị sleep)
  if (elapsed > 3 * 60 * 1000) {
    updateGpsBadge("stale", "GPS: Vị trí đã cũ");
    if (AppState.myMarker && AppState.myMarker._icon) {
      AppState.myMarker._icon.classList.add("marker-stale");
    }
  } else {
    if (AppState.myMarker && AppState.myMarker._icon) {
      AppState.myMarker._icon.classList.remove("marker-stale");
    }
  }
}

// Xử lý khi người dùng mở lại Chrome / mở khóa màn hình
function initVisibilityListener() {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && AppState.currentUser) {
      // Khi tab trở lại active, ngay lập tức kiểm tra vị trí hiện tại
      navigator.geolocation.getCurrentPosition(
        onGpsSuccess,
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  });
}

function updateGpsBadge(status, text) {
  const badge = document.getElementById("gps-status-badge");
  if (!badge) return;
  badge.className = `status-pill gps-${status}`;
  const label = badge.querySelector(".status-label");
  if (label) label.textContent = text;
}

// ==========================================================================
// 11. LEAFLET.JS MAP IMPLEMENTATION
// ==========================================================================
function initLeafletMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer || AppState.map) return;

  // Tọa độ mặc định: Trung tâm TP. Hồ Chí Minh
  const defaultCenter = [10.7769, 106.7009];

  AppState.map = L.map("map", {
    center: defaultCenter,
    zoom: 13,
    zoomControl: false // Chúng ta sẽ tạo controls riêng đẹp mắt
  });

  // Lớp bản đồ 1: CartoDB Dark Matter (Tông màu tối phù hợp chủ đề Purple Mystical)
  AppState.tileLayers.dark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | TxT Universe',
      maxZoom: 19,
      subdomains: "abcd"
    }
  );

  // Lớp bản đồ 2: OpenStreetMap Chuẩn
  AppState.tileLayers.osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }
  );

  // Lớp bản đồ 3: CartoDB Voyager
  AppState.tileLayers.voyager = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; CARTO Voyager',
      maxZoom: 19
    }
  );

  // Kích hoạt Dark Matter ban đầu
  AppState.tileLayers.dark.addTo(AppState.map);

  // Gắn sự kiện click bản đồ để chọn điểm đến cho Hành trình
  AppState.map.on("click", onMapClickSelectDestination);

  // Gắn sự kiện các nút hành động nổi trên bản đồ
  initMapActionButtons();
}

function initMapActionButtons() {
  // Nút về vị trí của tôi
  const btnMe = document.getElementById("btn-recenter-me");
  if (btnMe) {
    btnMe.addEventListener("click", () => {
      if (AppState.myLocation && AppState.map) {
        AppState.map.flyTo([AppState.myLocation.lat, AppState.myLocation.lng], 16, { animate: true });
      } else {
        showToast("Đang chờ định vị GPS của bạn...", "info");
      }
    });
  }

  // Nút xem cả hai
  const btnBoth = document.getElementById("btn-recenter-both");
  if (btnBoth) {
    btnBoth.addEventListener("click", fitBothMarkersIfAvailable);
  }

  // Nút tính lại tuyến đường
  const btnRoute = document.getElementById("btn-refresh-route");
  if (btnRoute) {
    btnRoute.addEventListener("click", () => {
      calculateRouteBetweenPartners(true);
      showToast("Đang tính toán lại lộ trình đường bộ...", "info");
    });
  }

  // Nút đổi lớp bản đồ
  const btnTiles = document.getElementById("btn-toggle-tiles");
  if (btnTiles) {
    btnTiles.addEventListener("click", toggleMapTiles);
  }
}

function toggleMapTiles() {
  if (!AppState.map) return;
  const layers = ["dark", "osm", "voyager"];
  const currentIndex = layers.indexOf(AppState.currentTileLayer);
  const nextLayer = layers[(currentIndex + 1) % layers.length];

  AppState.map.removeLayer(AppState.tileLayers[AppState.currentTileLayer]);
  AppState.tileLayers[nextLayer].addTo(AppState.map);
  AppState.currentTileLayer = nextLayer;

  const names = { dark: "Tối huyền ảo", osm: "Đường phố OSM", voyager: "Sáng dịu" };
  showToast(`Đã chuyển lớp bản đồ: ${names[nextLayer]}`, "info");
}

function fitBothMarkersIfAvailable() {
  if (!AppState.map) return;
  const points = [];

  if (AppState.myLocation) points.push([AppState.myLocation.lat, AppState.myLocation.lng]);
  if (AppState.partnerLocation) points.push([AppState.partnerLocation.lat, AppState.partnerLocation.lng]);

  if (points.length === 2) {
    const bounds = L.latLngBounds(points);
    AppState.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  } else if (points.length === 1) {
    AppState.map.setView(points[0], 15);
  }
}

// ==========================================================================
// 12. MARKERS & POPUPS
// ==========================================================================
function createCustomMarkerIcon(role, name, isStale) {
  const isTan = role === "tan";
  const avatarChar = isTan ? "T" : "T";
  const roleClass = isTan ? "marker-tan" : "marker-tran";
  const staleClass = isStale ? "marker-stale" : "";

  return L.divIcon({
    className: "custom-leaflet-marker",
    iconSize: [44, 60],
    iconAnchor: [22, 42],
    popupAnchor: [0, -36],
    html: `
      <div class="custom-user-marker ${roleClass} ${staleClass}">
        <div class="marker-pulse-wrapper">
          <div class="marker-radar-ring"></div>
          <div class="marker-avatar-core">${avatarChar}</div>
        </div>
        <div class="marker-name-tag">${name}</div>
      </div>
    `
  });
}

function updateMyMarkerOnMap(loc) {
  if (!AppState.map) return;
  const myRole = AppState.currentRole || "tan";
  const myName = myRole === "tan" ? "Tân" : "Trân";
  const pos = [loc.lat, loc.lng];

  const popupHtml = `
    <div style="font-family: inherit;">
      <strong style="color: #c084fc; font-size: 0.95rem;">📍 Vị trí của ${myName} (Tôi)</strong><br>
      <div style="margin-top: 5px; font-size: 0.78rem;">
        ⚡ Tốc độ: <strong>${loc.speed} km/h</strong><br>
        🎯 Độ chính xác: ±${loc.accuracy}m<br>
        🕒 Cập nhật: ${new Date(loc.updatedAt).toLocaleTimeString("vi-VN")}
      </div>
    </div>
  `;

  if (!AppState.myMarker) {
    AppState.myMarker = L.marker(pos, {
      icon: createCustomMarkerIcon(myRole, myName, false),
      zIndexOffset: 1000
    }).addTo(AppState.map);
    AppState.myMarker.bindPopup(popupHtml);
  } else {
    AppState.myMarker.setLatLng(pos);
    AppState.myMarker.setIcon(createCustomMarkerIcon(myRole, myName, false));
    AppState.myMarker.getPopup().setContent(popupHtml);
  }

  // Cập nhật nhãn trạng thái HUD
  const myStatusElem = document.getElementById(myRole === "tan" ? "tan-loc-status" : "tran-loc-status");
  if (myStatusElem) {
    myStatusElem.textContent = `${loc.speed} km/h • Vừa xong`;
  }
}

function updatePartnerMarkerOnMap(loc) {
  if (!AppState.map) return;
  const partnerRole = AppState.partnerRole || "tran";
  const partnerName = partnerRole === "tan" ? "Tân" : "Trân";
  const pos = [loc.lat, loc.lng];
  const isStale = (Date.now() - loc.updatedAt) > 4 * 60 * 1000;

  const popupHtml = `
    <div style="font-family: inherit;">
      <strong style="color: #f43f5e; font-size: 0.95rem;">💖 Vị trí của ${partnerName}</strong><br>
      <div style="margin-top: 5px; font-size: 0.78rem;">
        ⚡ Tốc độ: <strong>${loc.speed} km/h</strong><br>
        🎯 Độ chính xác: ±${loc.accuracy}m<br>
        🕒 Cập nhật: ${new Date(loc.updatedAt).toLocaleTimeString("vi-VN")}<br>
        ${isStale ? '<span style="color: #f59e0b;">⚠️ Vị trí đã cũ</span>' : '<span style="color: #10b981;">✓ Đang trực tuyến</span>'}
      </div>
    </div>
  `;

  if (!AppState.partnerMarker) {
    AppState.partnerMarker = L.marker(pos, {
      icon: createCustomMarkerIcon(partnerRole, partnerName, isStale),
      zIndexOffset: 900
    }).addTo(AppState.map);
    AppState.partnerMarker.bindPopup(popupHtml);
  } else {
    AppState.partnerMarker.setLatLng(pos);
    AppState.partnerMarker.setIcon(createCustomMarkerIcon(partnerRole, partnerName, isStale));
    AppState.partnerMarker.getPopup().setContent(popupHtml);
  }

  // Cập nhật nhãn trạng thái HUD
  const partnerStatusElem = document.getElementById(partnerRole === "tan" ? "tan-loc-status" : "tran-loc-status");
  if (partnerStatusElem) {
    partnerStatusElem.textContent = isStale ? "Vị trí đã cũ" : `${loc.speed} km/h • Vừa xong`;
  }
}

// ==========================================================================
// 13. ROUTING & DISTANCE CALCULATION (OSRM + HAVERSINE)
// ==========================================================================

/**
 * Tính khoảng cách đường chim bay bằng công thức Haversine (km)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Gọi dịch vụ định tuyến OSRM (Open Source Routing Machine) công cộng
 * OSRM hoàn toàn miễn phí, không yêu cầu API Key.
 * Đường dẫn: https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson
 */
async function fetchOsrmRoute(startCoord, endCoord) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startCoord.lng},${startCoord.lat};${endCoord.lng},${endCoord.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  if (data.code !== "Ok" || !data.routes || !data.routes.length) {
    throw new Error("Không tìm thấy tuyến đường hợp lệ từ OSRM.");
  }

  const route = data.routes[0];
  return {
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.round(route.duration / 60),
    coordinates: route.geometry.coordinates // Mảng [lng, lat]
  };
}

let lastRouteCalcTime = 0;

async function calculateRouteBetweenPartners(force = false) {
  if (!AppState.myLocation || !AppState.partnerLocation) return;

  const now = Date.now();
  // Giới hạn gọi OSRM tối đa 1 lần mỗi 20 giây trừ khi ấn nút thủ công
  if (!force && now - lastRouteCalcTime < 20000) return;
  lastRouteCalcTime = now;

  const lat1 = AppState.myLocation.lat;
  const lon1 = AppState.myLocation.lng;
  const lat2 = AppState.partnerLocation.lat;
  const lon2 = AppState.partnerLocation.lng;

  // 1. Tính khoảng cách đường chim bay ngay lập tức
  const straightDist = calculateHaversineDistance(lat1, lon1, lat2, lon2).toFixed(1);
  updateDistanceDisplay(straightDist, null, null);

  // 2. Gọi OSRM tính khoảng cách đường bộ & vẽ tuyến đường
  try {
    const route = await fetchOsrmRoute(
      { lat: lat1, lng: lon1 },
      { lat: lat2, lng: lon2 }
    );

    updateDistanceDisplay(straightDist, route.distanceKm, route.durationMin);
    drawRoutePolylineOnMap(route.coordinates);

  } catch (err) {
    console.warn("Không thể tính lộ trình OSRM, hiển thị đường chim bay:", err);
    // Vẽ đường nét đứt chim bay dự phòng
    drawFallbackStraightLine([ [lat1, lon1], [lat2, lon2] ]);
  }
}

function updateDistanceDisplay(straightKm, roadKm, etaMin) {
  const hudRoad = document.getElementById("hud-road-distance");
  const hudStraight = document.getElementById("hud-straight-distance");
  const hudEta = document.getElementById("hud-eta");

  const quickCard = document.getElementById("quick-distance-card");
  const quickDistVal = document.getElementById("quick-dist-value");
  const quickEtaVal = document.getElementById("quick-eta-value");
  const quickUpdate = document.getElementById("quick-last-update");

  if (hudStraight) hudStraight.textContent = `${straightKm} km`;
  if (hudRoad) hudRoad.textContent = roadKm ? `${roadKm} km` : `${straightKm} km (ước tính)`;

  let etaText = "--";
  if (etaMin) {
    if (etaMin > 60) {
      const h = Math.floor(etaMin / 60);
      const m = etaMin % 60;
      etaText = `~${h} giờ ${m} phút`;
    } else {
      etaText = `~${etaMin} phút`;
    }
  } else {
    // Ước lượng 30km/h nếu không có OSRM
    const fallbackMin = Math.round((straightKm / 30) * 60);
    etaText = `~${fallbackMin} phút (chim bay)`;
  }

  if (hudEta) hudEta.textContent = etaText;

  // Cập nhật thẻ khoảng cách ở Trang chủ
  if (quickCard) quickCard.classList.remove("hidden");
  if (quickDistVal) quickDistVal.textContent = roadKm || straightKm;
  if (quickEtaVal) quickEtaVal.textContent = etaText;
  if (quickUpdate) quickUpdate.textContent = `Cập nhật lúc: ${new Date().toLocaleTimeString("vi-VN")}`;
}

function drawRoutePolylineOnMap(osrmCoordinates) {
  if (!AppState.map) return;

  // Xóa đường cũ nếu có
  if (AppState.routePolyline) {
    AppState.map.removeLayer(AppState.routePolyline);
  }

  // Chuyển [lng, lat] thành [lat, lng] cho Leaflet
  const latLngs = osrmCoordinates.map(coord => [coord[1], coord[0]]);

  // Vẽ đường màu tím phát sáng lung linh
  AppState.routePolyline = L.polyline(latLngs, {
    color: "#c084fc",
    weight: 5,
    opacity: 0.85,
    lineCap: "round",
    lineJoin: "round",
    dashArray: null
  }).addTo(AppState.map);
}

function drawFallbackStraightLine(points) {
  if (!AppState.map) return;
  if (AppState.routePolyline) AppState.map.removeLayer(AppState.routePolyline);

  AppState.routePolyline = L.polyline(points, {
    color: "#a855f7",
    weight: 3,
    dashArray: "6, 8",
    opacity: 0.7
  }).addTo(AppState.map);
}

// ==========================================================================
// 14. THEO DÕI HÀNH TRÌNH (TRIP TRACKING)
// ==========================================================================
function initTripUI() {
  const btnStartTrip = document.getElementById("btn-start-trip");
  const btnEndTrip = document.getElementById("btn-end-trip");
  const btnPickOnMap = document.getElementById("btn-pick-on-map");
  const btnViewPartner = document.getElementById("btn-view-partner-on-map");
  const btnViewTripDetails = document.getElementById("btn-view-trip-details");

  if (btnStartTrip) btnStartTrip.addEventListener("click", handleStartTrip);
  if (btnEndTrip) btnEndTrip.addEventListener("click", handleEndTrip);

  if (btnPickOnMap) {
    btnPickOnMap.addEventListener("click", () => {
      AppState.isMapPickingDestination = true;
      // Chuyển sang Tab Map
      const mapTabBtn = document.querySelector('.bottom-nav .nav-btn[data-tab="tab-map"]');
      if (mapTabBtn) mapTabBtn.click();
      showToast("Chạm vào vị trí bất kỳ trên bản đồ để chọn điểm đến 📍", "info");
    });
  }

  if (btnViewPartner) {
    btnViewPartner.addEventListener("click", () => {
      const mapTabBtn = document.querySelector('.bottom-nav .nav-btn[data-tab="tab-map"]');
      if (mapTabBtn) mapTabBtn.click();
    });
  }

  if (btnViewTripDetails) {
    btnViewTripDetails.addEventListener("click", () => {
      const tripTabBtn = document.querySelector('.bottom-nav .nav-btn[data-tab="tab-trip"]');
      if (tripTabBtn) tripTabBtn.click();
    });
  }
}

function onMapClickSelectDestination(e) {
  if (!AppState.isMapPickingDestination) return;

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  setChosenDestination({
    lat: lat,
    lng: lng,
    name: `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  });

  AppState.isMapPickingDestination = false;
  showToast("Đã chọn điểm đến thành công!", "success");

  // Chuyển lại Tab Hành trình
  const tripTabBtn = document.querySelector('.bottom-nav .nav-btn[data-tab="tab-trip"]');
  if (tripTabBtn) tripTabBtn.click();
}

function setChosenDestination(dest) {
  AppState.chosenDestination = dest;

  const destInput = document.getElementById("dest-input");
  const preview = document.getElementById("dest-coords-preview");

  if (destInput) destInput.value = dest.name;
  if (preview) preview.textContent = `Tọa độ: ${dest.lat.toFixed(5)}, ${dest.lng.toFixed(5)}`;

  // Vẽ marker điểm đến trên bản đồ
  renderDestinationMarker(dest);
}

function renderDestinationMarker(dest) {
  if (!AppState.map) return;

  if (AppState.destinationMarker) {
    AppState.map.removeLayer(AppState.destinationMarker);
  }

  const destIcon = L.divIcon({
    className: "dest-leaflet-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    html: `<div class="destination-pin">🏁</div>`
  });

  AppState.destinationMarker = L.marker([dest.lat, dest.lng], {
    icon: destIcon,
    zIndexOffset: 1200
  }).addTo(AppState.map);

  AppState.destinationMarker.bindPopup(`<strong>Điểm đến:</strong><br>${dest.name}`).openPopup();
}

async function handleStartTrip() {
  if (!AppState.myLocation) {
    showToast("Vui lòng đợi định vị GPS trước khi bắt đầu hành trình.", "error");
    return;
  }

  const destInput = document.getElementById("dest-input");
  const chkRecordTrail = document.getElementById("chk-record-trail");

  let destName = destInput ? destInput.value.trim() : "";
  let destCoords = AppState.chosenDestination;

  if (!destCoords) {
    showToast("Vui lòng chọn điểm đến trên bản đồ hoặc nhập địa chỉ.", "error");
    return;
  }

  if (destName) {
    destCoords.name = destName;
  }

  const tripData = {
    active: true,
    destination: destCoords,
    startedAt: Date.now(),
    recordTrail: chkRecordTrail ? chkRecordTrail.checked : false,
    trail: chkRecordTrail && chkRecordTrail.checked ? [ [AppState.myLocation.lat, AppState.myLocation.lng] ] : []
  };

  // Tự động bật chia sẻ vị trí khi bắt đầu hành trình
  AppState.sharingEnabled = true;
  AppState.myTrip = tripData;

  if (AppState.currentUser) {
    const db = firebase.database();
    const uid = AppState.currentUser.uid;
    await db.ref(`users/${uid}/sharing`).update({ enabled: true });
    await db.ref(`users/${uid}/trip`).set(tripData);
  }

  renderActiveTripUI(true);
  showToast("Hành trình đã bắt đầu! Tuyến đường đang được đồng bộ.", "success");

  // Chuyển sang Tab Map để theo dõi
  const mapTabBtn = document.querySelector('.bottom-nav .nav-btn[data-tab="tab-map"]');
  if (mapTabBtn) mapTabBtn.click();
}

async function handleEndTrip() {
  if (!confirm("Bạn có chắc muốn kết thúc hành trình này?")) return;

  AppState.myTrip = {
    active: false,
    destination: null,
    startedAt: null,
    recordTrail: false,
    trail: []
  };

  if (AppState.currentUser) {
    const db = firebase.database();
    const uid = AppState.currentUser.uid;
    await db.ref(`users/${uid}/trip`).set({ active: false });
  }

  // Xóa marker và vệt đường đi
  if (AppState.destinationMarker && AppState.map) {
    AppState.map.removeLayer(AppState.destinationMarker);
    AppState.destinationMarker = null;
  }
  if (AppState.trailPolyline && AppState.map) {
    AppState.map.removeLayer(AppState.trailPolyline);
    AppState.trailPolyline = null;
  }

  renderActiveTripUI(false);
  showToast("Đã kết thúc hành trình.", "info");
}

function renderActiveTripUI(isActive) {
  const idleState = document.getElementById("trip-idle-state");
  const activeState = document.getElementById("trip-active-state");
  const activeDestName = document.getElementById("active-dest-name");
  const mapBanner = document.getElementById("map-active-trip-banner");

  if (isActive && AppState.myTrip.destination) {
    if (idleState) idleState.classList.add("hidden");
    if (activeState) activeState.classList.remove("hidden");
    if (activeDestName) activeDestName.textContent = AppState.myTrip.destination.name;

    // Hiển thị banner trên bản đồ
    if (mapBanner) {
      mapBanner.classList.remove("hidden");
      const title = document.getElementById("map-trip-user-title");
      const desc = document.getElementById("map-trip-user-desc");
      if (title) title.textContent = "Bạn đang di chuyển";
      if (desc) desc.textContent = `Điểm đến: ${AppState.myTrip.destination.name}`;
    }
  } else {
    if (idleState) idleState.classList.remove("hidden");
    if (activeState) activeState.classList.add("hidden");
    if (mapBanner && !AppState.partnerTrip.active) {
      mapBanner.classList.add("hidden");
    }
  }
}

async function updateActiveTripNavigation(myCoords) {
  if (!AppState.myTrip || !AppState.myTrip.active || !AppState.myTrip.destination) return;

  const dest = AppState.myTrip.destination;

  // 1. Tính khoảng cách còn lại
  const straightDist = calculateHaversineDistance(myCoords.lat, myCoords.lng, dest.lat, dest.lng);

  const activeDistElem = document.getElementById("active-trip-distance");
  const activeEtaElem = document.getElementById("active-trip-eta");
  const activeSpeedElem = document.getElementById("active-trip-speed");
  const activeElapsedElem = document.getElementById("active-trip-elapsed");

  if (activeSpeedElem) activeSpeedElem.textContent = `${myCoords.speed} km/h`;

  // Thời gian đã đi
  if (activeElapsedElem && AppState.myTrip.startedAt) {
    const elapsedSec = Math.floor((Date.now() - AppState.myTrip.startedAt) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    activeElapsedElem.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // 2. Lấy lộ trình OSRM đến điểm đến
  try {
    const route = await fetchOsrmRoute(
      { lat: myCoords.lat, lng: myCoords.lng },
      { lat: dest.lat, lng: dest.lng }
    );

    if (activeDistElem) activeDistElem.textContent = `${route.distanceKm} km`;
    if (activeEtaElem) activeEtaElem.textContent = `${route.durationMin} phút`;

    // Vẽ vệt đường đi (opt-in trail)
    if (AppState.myTrip.recordTrail) {
      if (!AppState.myTrip.trail) AppState.myTrip.trail = [];
      AppState.myTrip.trail.push([myCoords.lat, myCoords.lng]);

      // Vẽ trail lên map
      if (AppState.map) {
        if (AppState.trailPolyline) {
          AppState.trailPolyline.setLatLngs(AppState.myTrip.trail);
        } else {
          AppState.trailPolyline = L.polyline(AppState.myTrip.trail, {
            color: "#38bdf8",
            weight: 4,
            opacity: 0.75
          }).addTo(AppState.map);
        }
      }
    }

  } catch (e) {
    if (activeDistElem) activeDistElem.textContent = `${straightDist.toFixed(1)} km`;
    if (activeEtaElem) activeEtaElem.textContent = `~${Math.round((straightDist / 30) * 60)} phút`;
  }
}

function handlePartnerTripUpdate(partnerTrip) {
  const partnerTripCard = document.getElementById("partner-trip-card");
  const mapBanner = document.getElementById("map-active-trip-banner");

  if (partnerTrip && partnerTrip.active && partnerTrip.destination) {
    AppState.partnerTrip = partnerTrip;

    if (partnerTripCard) {
      partnerTripCard.classList.remove("hidden");
      const nameElem = document.getElementById("partner-trip-name");
      const descElem = document.getElementById("partner-trip-desc");
      const partnerName = AppState.partnerRole === "tan" ? "Tân" : "Trân";

      if (nameElem) nameElem.textContent = `${partnerName} đang trên đường`;
      if (descElem) descElem.textContent = `Điểm đến: ${partnerTrip.destination.name}`;
    }

    if (mapBanner && !AppState.myTrip.active) {
      mapBanner.classList.remove("hidden");
      const title = document.getElementById("map-trip-user-title");
      const desc = document.getElementById("map-trip-user-desc");
      const partnerName = AppState.partnerRole === "tan" ? "Tân" : "Trân";
      if (title) title.textContent = `${partnerName} đang di chuyển`;
      if (desc) desc.textContent = `Điểm đến: ${partnerTrip.destination.name}`;
    }

    // Vẽ marker điểm đến của đối phương
    renderDestinationMarker(partnerTrip.destination);

  } else {
    AppState.partnerTrip.active = false;
    if (partnerTripCard) partnerTripCard.classList.add("hidden");
    if (mapBanner && !AppState.myTrip.active) mapBanner.classList.add("hidden");
  }
}

// ==========================================================================
// 15. SETTINGS & SHARING CONTROLS
// ==========================================================================
function initSettingsUI() {
  const switchShare = document.getElementById("switch-share-location");
  const durationChips = document.querySelectorAll(".duration-chips .chip-btn");
  const btnRecheckGps = document.getElementById("btn-recheck-gps");

  if (switchShare) {
    switchShare.addEventListener("change", e => {
      AppState.sharingEnabled = e.target.checked;
      pushSharingSettingsToFirebase();
    });
  }

  durationChips.forEach(chip => {
    chip.addEventListener("click", () => {
      durationChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      const hours = parseInt(chip.getAttribute("data-hours"), 10);
      AppState.selectedDurationHours = hours;

      if (hours === 0) {
        AppState.sharingExpiresAt = null; // Luôn luôn
      } else {
        AppState.sharingExpiresAt = Date.now() + (hours * 3600 * 1000);
      }

      pushSharingSettingsToFirebase();
      updateSharingUIFromState();
    });
  });

  if (btnRecheckGps) {
    btnRecheckGps.addEventListener("click", () => {
      startGpsTracking();
      showToast("Đang kích hoạt lại cảm biến GPS...", "info");
    });
  }
}

function pushSharingSettingsToFirebase() {
  if (!AppState.currentUser) return;
  const db = firebase.database();
  const uid = AppState.currentUser.uid;

  db.ref(`users/${uid}/sharing`).set({
    enabled: AppState.sharingEnabled,
    expiresAt: AppState.sharingExpiresAt,
    updatedAt: Date.now()
  });

  const statusText = AppState.sharingEnabled ? "Đã bật chia sẻ vị trí." : "Đã tạm dừng chia sẻ vị trí.";
  showToast(statusText, "info");
}

function updateSharingUIFromState() {
  const switchShare = document.getElementById("switch-share-location");
  const subtitle = document.getElementById("sharing-status-subtitle");
  const expiryInfo = document.getElementById("sharing-expiry-info");

  if (switchShare) switchShare.checked = AppState.sharingEnabled;

  if (subtitle) {
    subtitle.textContent = AppState.sharingEnabled
      ? "Đang chia sẻ thời gian thực"
      : "Đang tạm dừng chia sẻ";
  }

  if (expiryInfo) {
    if (!AppState.sharingEnabled) {
      expiryInfo.textContent = "Chia sẻ đang tắt.";
    } else if (AppState.sharingExpiresAt) {
      const dateStr = new Date(AppState.sharingExpiresAt).toLocaleTimeString("vi-VN") + " - " + new Date(AppState.sharingExpiresAt).toLocaleDateString("vi-VN");
      expiryInfo.textContent = `Hết hạn lúc: ${dateStr}`;
    } else {
      expiryInfo.textContent = "Thời hạn: Chia sẻ liên tục (Không giới hạn)";
    }
  }
}

function updateSettingsUserProfile() {
  const nameDisplay = document.getElementById("profile-name-display");
  const emailDisplay = document.getElementById("profile-email-display");
  const uidDisplay = document.getElementById("profile-uid-display");
  const avatarDisplay = document.getElementById("profile-avatar-display");

  if (nameDisplay) nameDisplay.textContent = AppState.currentRole === "tan" ? "Tân (Anh)" : "Trân (Em)";
  if (emailDisplay && AppState.currentUser) emailDisplay.textContent = AppState.currentUser.email;
  if (uidDisplay && AppState.currentUser) uidDisplay.textContent = `UID: ${AppState.currentUser.uid}`;
  if (avatarDisplay) avatarDisplay.textContent = AppState.currentRole === "tan" ? "💜" : "🌸";
}

function updateDiagnosticsUI(coords) {
  const diagCoords = document.getElementById("diag-coords");
  const diagAcc = document.getElementById("diag-accuracy");
  const diagSpeed = document.getElementById("diag-speed");
  const diagTime = document.getElementById("diag-timestamp");

  if (diagCoords) diagCoords.textContent = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
  if (diagAcc) diagAcc.textContent = `±${Math.round(coords.accuracy)} mét`;
  if (diagSpeed) diagSpeed.textContent = coords.speed ? `${Math.round(coords.speed * 3.6)} km/h` : "Đang đứng yên";
  if (diagTime) diagTime.textContent = new Date().toLocaleTimeString("vi-VN");
}

function updatePartnerStatusLabel(text) {
  const syncLabel = document.getElementById("map-last-sync-label");
  if (syncLabel) syncLabel.textContent = text;
}

function formatLastSeenText(timestamp) {
  if (!timestamp) return "Chưa có tín hiệu";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 30) return "Cập nhật: Vừa xong";
  if (diffSec < 60) return `Cập nhật: ${diffSec} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Cập nhật: ${diffMin} phút trước`;
  return `Cập nhật: ${new Date(timestamp).toLocaleTimeString("vi-VN")}`;
}

// ==========================================================================
// 16. TOAST NOTIFICATION UTILITY
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = type === "success" ? "✨" : type === "error" ? "⚠️" : "💫";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
