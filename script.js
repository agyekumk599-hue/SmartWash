// Data Management
const DataStore = {
  users: [
    {
      email: "admin@smartwash.com",
      password: "admin123",
      role: "admin",
      name: "Admin User",
      tenantId: "smartwash-demo",
    },
    {
      email: "staff@smartwash.com",
      password: "staff123",
      role: "staff",
      name: "Staff Member",
      tenantId: "smartwash-demo",
    },
  ],

  useFirestore: false,
  tenantId: "smartwash-demo",
  orders: [],
  notifications: [],
  staff: [],
  settings: {
    autoNotifyReady: true,
    autoNotifyDelivered: true,
    marketingNotify: false,
    whatsappNotify: false,
  },
  currentUser: null,
  subscriptions: [],

  async init() {
    this.useFirestore = !!window.firebaseEnabled;

    if (this.useFirestore) {
      await this.initFirebase();
    }

    this.loadLocalFallback();
  },

  async initFirebase() {
    try {
      const service = window.firebaseService;
      if (!service?.db) throw new Error("Firestore not available");

      this.useFirestore = true;

      if (service.auth?.currentUser) {
        await this.loadFirebaseUser(service.auth.currentUser);
      }

      service.onAuthStateChanged(async (user) => {
        if (user) {
          await this.loadFirebaseUser(user);
          await this.loadFirestoreData();
        } else {
          this.currentUser = null;
        }
      });
    } catch (error) {
      console.warn(
        "Firebase init failed, falling back to local storage:",
        error,
      );
      this.useFirestore = false;
    }
  },

  async loadFirebaseUser(firebaseUser) {
    try {
      const userDoc = await window.firebaseService.getUserByUid(
        firebaseUser.uid,
      );
      if (userDoc) {
        this.currentUser = { uid: firebaseUser.uid, ...userDoc };
        this.tenantId = userDoc.tenantId || this.tenantId;
      }
    } catch (error) {
      console.warn("Could not load Firebase user document:", error);
      this.currentUser = null;
    }
  },

  async loadFirestoreData() {
    if (!this.currentUser?.tenantId) return;
    try {
      this.orders = await window.firebaseService.getOrders(this.tenantId);
      this.notifications = await window.firebaseService.getNotifications(
        this.tenantId,
      );
      const tenantSettings = await window.firebaseService.getTenantSettings(
        this.tenantId,
      );
      if (tenantSettings) {
        this.settings = tenantSettings;
      }
    } catch (error) {
      console.warn("Could not load Firestore data:", error);
      this.useFirestore = false;
    }
  },

  loadLocalFallback() {
    if (!localStorage.getItem("smartwash_orders")) {
      const sampleOrders = [
        {
          id: 1,
          customer: "John Doe",
          phone: "555-0101",
          service: "Washing",
          quantity: 5,
          price: 25.0,
          status: "delivered",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          notified: true,
          estimatedCollection: new Date(
            Date.now() - 86400000 * 2 + 48 * 60 * 60 * 1000,
          ).toISOString(),
          tenantId: this.tenantId,
        },
        {
          id: 2,
          customer: "Jane Smith",
          phone: "555-0102",
          service: "Dry Cleaning",
          quantity: 3,
          price: 45.0,
          status: "ready",
          date: new Date(Date.now() - 86400000).toISOString(),
          notified: true,
          estimatedCollection: new Date(
            Date.now() - 86400000 + 48 * 60 * 60 * 1000,
          ).toISOString(),
          tenantId: this.tenantId,
        },
        {
          id: 3,
          customer: "Mike Johnson",
          phone: "555-0103",
          service: "Ironing",
          quantity: 8,
          price: 32.0,
          status: "washing",
          date: new Date().toISOString(),
          notified: false,
          estimatedCollection: new Date(
            Date.now() + 48 * 60 * 60 * 1000,
          ).toISOString(),
          tenantId: this.tenantId,
        },
        {
          id: 4,
          customer: "Sarah Williams",
          phone: "555-0104",
          service: "Full Service",
          quantity: 12,
          price: 120.0,
          status: "pending",
          date: new Date().toISOString(),
          notified: false,
          estimatedCollection: new Date(
            Date.now() + 48 * 60 * 60 * 1000,
          ).toISOString(),
          tenantId: this.tenantId,
        },
      ];
      localStorage.setItem("smartwash_orders", JSON.stringify(sampleOrders));
    }

    if (!localStorage.getItem("smartwash_notifications")) {
      const sampleNotifications = [
        {
          id: 1,
          orderId: 1,
          customer: "John Doe",
          phone: "555-0101",
          type: "delivered",
          channel: "sms",
          status: "delivered",
          message:
            "Your Washing order #0001 has been delivered. Thank you for choosing SmartWash!",
          time: new Date(Date.now() - 86400000 * 2).toISOString(),
          read: true,
          tenantId: this.tenantId,
        },
        {
          id: 2,
          orderId: 2,
          customer: "Jane Smith",
          phone: "555-0102",
          type: "ready",
          channel: "sms",
          status: "delivered",
          message:
            "Hi Jane, your Dry Cleaning order #0002 is ready for collection at SmartWash. Total: GH₵45.00. Open hours: 8AM-8PM.",
          time: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          tenantId: this.tenantId,
        },
        {
          id: 3,
          orderId: 2,
          customer: "Jane Smith",
          phone: "555-0102",
          type: "reminder",
          channel: "sms",
          status: "pending",
          message:
            "Reminder: Your order #0002 is still waiting for pickup. Available today until 8PM.",
          time: new Date().toISOString(),
          read: false,
          tenantId: this.tenantId,
        },
      ];
      localStorage.setItem(
        "smartwash_notifications",
        JSON.stringify(sampleNotifications),
      );
    }

    if (!localStorage.getItem("smartwash_staff")) {
      const sampleStaff = [
        {
          name: "Staff Member",
          email: "staff@smartwash.com",
          phone: "555-0202",
          role: "staff",
          status: "Active",
        },
        {
          name: "Support Lead",
          email: "support@smartwash.com",
          phone: "555-0203",
          role: "staff",
          status: "Active",
        },
      ];
      localStorage.setItem("smartwash_staff", JSON.stringify(sampleStaff));
    }

    if (!localStorage.getItem("smartwash_subscriptions")) {
      const sampleSubscriptions = [
        {
          id: 1,
          customer: "John Doe",
          plan: "Weekly Wash",
          amount: 55.0,
          frequency: "Weekly",
          status: "Active",
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          tenantId: this.tenantId,
        },
        {
          id: 2,
          customer: "Jane Smith",
          plan: "Biweekly Care",
          amount: 39.99,
          frequency: "Biweekly",
          status: "Active",
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          tenantId: this.tenantId,
        },
      ];
      localStorage.setItem(
        "smartwash_subscriptions",
        JSON.stringify(sampleSubscriptions),
      );
    }

    if (!localStorage.getItem("smartwash_settings")) {
      localStorage.setItem("smartwash_settings", JSON.stringify(this.settings));
    }

    if (!this.useFirestore || !this.currentUser) {
      this.orders = JSON.parse(
        localStorage.getItem("smartwash_orders") || "[]",
      );
      this.notifications = JSON.parse(
        localStorage.getItem("smartwash_notifications") || "[]",
      );
      this.staff = JSON.parse(localStorage.getItem("smartwash_staff") || "[]");
      this.subscriptions = JSON.parse(
        localStorage.getItem("smartwash_subscriptions") || "[]",
      );
      this.settings = JSON.parse(
        localStorage.getItem("smartwash_settings") || "{}",
      );
      if (!this.currentUser) {
        this.currentUser = JSON.parse(
          localStorage.getItem("smartwash_user") || "null",
        );
      }
    }
  },

  getOrders() {
    return this.useFirestore && this.currentUser?.tenantId
      ? this.orders
      : JSON.parse(localStorage.getItem("smartwash_orders") || "[]");
  },

  async saveOrder(order) {
    const now = new Date();
    if (order.id) {
      order.estimatedCollection =
        order.estimatedCollection ||
        new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    } else {
      order.id = Date.now();
      order.date = now.toISOString();
      order.notified = false;
      order.estimatedCollection =
        order.estimatedCollection ||
        new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    }

    if (this.useFirestore && this.currentUser?.tenantId) {
      order.tenantId = this.currentUser.tenantId;
      const savedOrder = await window.firebaseService.saveOrder(order);
      this.orders = this.orders.filter((o) => o.id !== order.id);
      this.orders.push(savedOrder);
      return savedOrder;
    }

    const orders = JSON.parse(localStorage.getItem("smartwash_orders") || "[]");
    const index = orders.findIndex((o) => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
    } else {
      orders.push(order);
    }
    localStorage.setItem("smartwash_orders", JSON.stringify(orders));
    this.orders = orders;
    return order;
  },

  async deleteOrder(id) {
    if (this.useFirestore && this.currentUser?.tenantId) {
      await window.firebaseService.deleteOrder(id);
      this.orders = this.orders.filter((o) => o.id !== id);
      return;
    }

    const orders = this.getOrders().filter((o) => o.id !== id);
    localStorage.setItem("smartwash_orders", JSON.stringify(orders));
    this.orders = orders;
  },

  getStaff() {
    return this.useFirestore && this.currentUser?.tenantId
      ? this.staff
      : JSON.parse(localStorage.getItem("smartwash_staff") || "[]");
  },

  async saveStaff(staffList) {
    if (this.useFirestore && this.currentUser?.tenantId) {
      this.staff = staffList;
      return staffList;
    }

    localStorage.setItem("smartwash_staff", JSON.stringify(staffList));
    this.staff = staffList;
    return staffList;
  },

  async addStaff(staffMember) {
    const staff = this.getStaff();
    staff.push(staffMember);
    await this.saveStaff(staff);
    return staffMember;
  },

  async deleteStaff(email) {
    const staff = this.getStaff().filter((member) => member.email !== email);
    await this.saveStaff(staff);
    return staff;
  },

  getSubscriptions() {
    return this.useFirestore && this.currentUser?.tenantId
      ? this.subscriptions
      : JSON.parse(localStorage.getItem("smartwash_subscriptions") || "[]");
  },

  async saveSubscriptions(subscriptionList) {
    if (this.useFirestore && this.currentUser?.tenantId) {
      this.subscriptions = subscriptionList;
      return subscriptionList;
    }

    localStorage.setItem(
      "smartwash_subscriptions",
      JSON.stringify(subscriptionList),
    );
    this.subscriptions = subscriptionList;
    return subscriptionList;
  },

  async addSubscription(subscription) {
    const subscriptions = this.getSubscriptions();
    subscriptions.push(subscription);
    await this.saveSubscriptions(subscriptions);
    return subscription;
  },

  getNotifications() {
    return this.useFirestore && this.currentUser?.tenantId
      ? this.notifications
      : JSON.parse(localStorage.getItem("smartwash_notifications") || "[]");
  },

  async addNotification(notification) {
    notification.id = Date.now();
    notification.time = new Date().toISOString();
    notification.read = false;

    if (this.useFirestore && this.currentUser?.tenantId) {
      notification.tenantId = this.currentUser.tenantId;
      const savedNotification =
        await window.firebaseService.saveNotification(notification);
      this.notifications.unshift(savedNotification);
      return savedNotification;
    }

    const notifications = this.getNotifications();
    notifications.unshift(notification);
    localStorage.setItem(
      "smartwash_notifications",
      JSON.stringify(notifications),
    );
    this.notifications = notifications;
    return notification;
  },

  async markNotificationAsRead(id) {
    if (this.useFirestore && this.currentUser?.tenantId) {
      await window.firebaseService.updateNotification(id, { read: true });
      this.notifications = this.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return;
    }

    const notifications = this.getNotifications();
    const notif = notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    localStorage.setItem(
      "smartwash_notifications",
      JSON.stringify(notifications),
    );
    this.notifications = notifications;
  },

  async markAllNotificationsAsRead() {
    if (this.useFirestore && this.currentUser?.tenantId) {
      await Promise.all(
        this.notifications.map((n) =>
          window.firebaseService.updateNotification(n.id, { read: true }),
        ),
      );
      this.notifications = this.notifications.map((n) => ({
        ...n,
        read: true,
      }));
      return;
    }

    const notifications = this.getNotifications();
    notifications.forEach((n) => (n.read = true));
    localStorage.setItem(
      "smartwash_notifications",
      JSON.stringify(notifications),
    );
    this.notifications = notifications;
  },

  getSettings() {
    return this.useFirestore && this.currentUser?.tenantId
      ? this.settings
      : JSON.parse(localStorage.getItem("smartwash_settings") || "{}");
  },

  saveSettings(settings) {
    if (this.useFirestore && this.currentUser?.tenantId) {
      // Tenant settings support can be added later.
      this.settings = settings;
      return;
    }
    localStorage.setItem("smartwash_settings", JSON.stringify(settings));
    this.settings = settings;
  },

  getCurrentUser() {
    return (
      this.currentUser ||
      JSON.parse(localStorage.getItem("smartwash_user") || "null")
    );
  },

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem("smartwash_user", JSON.stringify(user));
  },

  clearUser() {
    if (this.useFirestore && window.firebaseService?.signOut) {
      window.firebaseService.signOut();
    }
    localStorage.removeItem("smartwash_user");
    this.currentUser = null;
  },
};

// State Management
let currentUser = null;
let currentSection = "overview";
let currentFilter = "all";
let editingOrderId = null;
let currentNotifyOrderId = null;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await DataStore.init();
  checkAuth();
  loadTheme();
  startLiveClock();

  const headerSearch = document.getElementById("headerSearch");
  if (headerSearch) {
    headerSearch.addEventListener("input", handleQuickSearch);
  }
});

function startLiveClock() {
  const clockEl = document.getElementById("liveClock");
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dateStr = `${day}/${month.toString().padStart(2, "0")}/${year}`;
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    clockEl.querySelector("span").innerHTML = `${dateStr}<br>${timeStr}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// Authentication
function checkAuth() {
  const user = DataStore.getCurrentUser();
  if (user) {
    currentUser = user;
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("dashboard").style.display = "none";
}

function showDashboard() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  updateUserInterface();
  loadData();
  showSection("orders");
  updateNotificationBadge();

  const loader = document.getElementById("loadingScreen");
  loader.classList.add("active");
  setTimeout(() => {
    loader.classList.remove("active");
  }, 800);
}

function updateUserInterface() {
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent =
    currentUser.role === "admin" ? "Administrator" : "Staff Member";
  document.getElementById("userAvatar").textContent = currentUser.name
    .charAt(0)
    .toUpperCase();

  const adminElements = document.querySelectorAll(".admin-only");
  adminElements.forEach((el) => {
    el.style.display = currentUser.role === "admin" ? "flex" : "none";
  });

  if (currentUser.role === "admin") {
    const addBtn = document.getElementById("addOrderBtn");
    const newBtn = document.getElementById("newOrderBtn");
    if (addBtn) addBtn.addEventListener("click", () => openModal());
    if (newBtn) newBtn.addEventListener("click", () => openModal());
  }

  if (currentUser.role === "staff") {
    document.getElementById("nav-customers").style.display = "none";
    document.getElementById("nav-reports").style.display = "none";
    document.getElementById("nav-notifications").style.display = "none";
  }
}

// Login Handler
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document
    .getElementById("emailInput")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("passwordInput").value.trim();
  const btn = document.getElementById("loginBtn");
  const errorMsg = document.getElementById("errorMessage");

  errorMsg.classList.remove("show");
  btn.classList.add("btn-loading");
  btn.textContent = "";

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const user = DataStore.users.find(
    (u) => u.email.toLowerCase() === email && u.password === password,
  );

  if (user) {
    currentUser = user;
    DataStore.setCurrentUser(user);
    showToast("Welcome back, " + user.name + "!", "success");
    showDashboard();
  } else {
    errorMsg.classList.add("show");
    document.getElementById("errorText").textContent =
      "Invalid email or password";
  }

  btn.classList.remove("btn-loading");
  btn.textContent = "Sign In";
});

function togglePassword() {
  const input = document.getElementById("passwordInput");
  const icon = document.getElementById("toggleIcon");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Sidebar Functions
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

function toggleMobileSidebar() {
  document.getElementById("sidebar").classList.toggle("mobile-open");
}

function toggleDropdown() {
  document.getElementById("userDropdown").classList.toggle("show");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    document.getElementById("userDropdown").classList.remove("show");
  }
  if (
    !e.target.closest(".notification-dropdown") &&
    !e.target.closest(".icon-btn")
  ) {
    document.getElementById("notificationDropdown").classList.remove("show");
  }
});

// Navigation
function showSection(section) {
  currentSection = section;

  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  document.getElementById("nav-" + section).classList.add("active");

  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  document.getElementById(section + "Section").classList.add("active");

  const titles = {
    overview: "Dashboard Overview",
    orders: "All Orders",
    customers: "Customer Management",
    staff: "Staff Management",
    notifications: "Notification Center",
    reports: "Reports & Analytics",
    subscriptions: "Subscriptions",
  };
  document.getElementById("pageTitle").textContent =
    titles[section] || "Smartwash Laundry Management";

  if (section === "customers") loadCustomers();
  if (section === "reports") loadReports();
  if (section === "notifications") loadNotificationCenter();
  if (section === "staff") loadStaffSection();
  if (section === "subscriptions") loadSubscriptions();
  if (section === "overview") {
    loadRecentOrders();
    loadAllOrders();
  }

  document.getElementById("sidebar").classList.remove("mobile-open");
  document.getElementById("notificationDropdown").classList.remove("show");
}

// Notification System
function toggleNotificationDropdown() {
  const dropdown = document.getElementById("notificationDropdown");
  dropdown.classList.toggle("show");
  if (dropdown.classList.contains("show")) {
    loadNotificationDropdown();
  }
}

function loadStaffSection() {
  const isAdmin = currentUser?.role === "admin";
  const adminCard = document.querySelector(".admin-staff-card");
  const profileCard = document.querySelector(".staff-profile-card");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileRole = document.getElementById("profileRole");
  const profileStatus = document.getElementById("profileStatus");

  if (adminCard) adminCard.classList.toggle("hidden", !isAdmin);
  if (profileCard) profileCard.classList.remove("hidden");

  if (profileName && profileEmail && profileRole && profileStatus) {
    profileName.textContent = currentUser.name;
    profileEmail.textContent = currentUser.email;
    profileRole.textContent = currentUser.role;
    profileStatus.textContent = "Active";
  }
}

function loadNotificationDropdown() {
  const notifications = DataStore.getNotifications().slice(0, 5);
  const list = document.getElementById("notificationList");

  if (notifications.length === 0) {
    list.innerHTML =
      '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
    return;
  }

  list.innerHTML = notifications
    .map((n) => {
      const time = new Date(n.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const iconClass =
        n.type === "ready"
          ? "ready"
          : n.type === "delivered"
            ? "delivered"
            : "pending";
      const icon =
        n.type === "ready"
          ? "fa-check-circle"
          : n.type === "delivered"
            ? "fa-box"
            : "fa-clock";

      return `
                    <div class="notification-item ${n.read ? "" : "unread"}" onclick="markAsRead(${n.id})">
                        <div class="notification-icon ${iconClass}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-text">${n.message}</div>
                            <div class="notification-time">${time} • ${n.channel.toUpperCase()}</div>
                        </div>
                    </div>
                `;
    })
    .join("");
}

function updateNotificationBadge() {
  const notifications = DataStore.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const badge = document.getElementById("notificationBadge");
  const navBadge = document.getElementById("navNotificationBadge");

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.style.display = "block";
    navBadge.textContent = unreadCount;
    navBadge.style.display = "block";
  } else {
    badge.style.display = "none";
    navBadge.style.display = "none";
  }
}

async function markAsRead(id) {
  await DataStore.markNotificationAsRead(id);
  updateNotificationBadge();
  loadNotificationDropdown();
}

async function markAllAsRead() {
  await DataStore.markAllNotificationsAsRead();
  updateNotificationBadge();
  loadNotificationDropdown();
  showToast("All notifications marked as read", "success");
}

function loadNotificationCenter() {
  const searchTerm =
    document
      .getElementById("notificationSearchInput")
      ?.value.trim()
      .toLowerCase() || "";
  const notifications = DataStore.getNotifications().filter((n) => {
    if (!searchTerm) return true;
    return [
      n.customer,
      n.orderId?.toString(),
      n.type,
      n.channel,
      n.status,
      n.message,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm));
  });
  const tbody = document.getElementById("notificationHistoryTable");

  // Update stats
  document.getElementById("notifTotalSent").textContent =
    DataStore.getNotifications().length;
  document.getElementById("notifDelivered").textContent =
    DataStore.getNotifications().filter((n) => n.status === "delivered").length;
  document.getElementById("notifPending").textContent =
    DataStore.getNotifications().filter((n) => n.status === "pending").length;

  if (notifications.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-state"><i class="fas fa-inbox"></i><h3>No notifications found</h3></td></tr>';
    return;
  }

  tbody.innerHTML = notifications
    .map((n) => {
      const date = new Date(n.time).toLocaleString();
      const typeColors = {
        ready: "success",
        delivered: "primary",
        delayed: "warning",
        reminder: "info",
        custom: "secondary",
      };
      const statusClass =
        n.status === "delivered" ? "status-ready" : "status-pending";
      const badgeType = typeColors[n.type] || "secondary";

      return `
                    <tr>
                        <td>${date}</td>
                        <td>
                            <div class="customer-info">
                                <div class="customer-avatar">${n.customer.charAt(0)}</div>
                                <div class="customer-name">${n.customer}</div>
                            </div>
                        </td>
                        <td>#${n.orderId.toString().slice(-4)}</td>
<<<<<<< HEAD
                        <td><span class="status-badge status-${typeColors[n.type] || "pending"}">${n.type}</span></td>
=======
                        <td><span class="status-badge status-${badgeType}">${n.type}</span></td>
>>>>>>> f7e8380b1f5ec9ee5648a0c3fb5985ae5e99c7d6
                        <td>
                            <span class="channel-tag ${n.channel}">${n.channel}</span>
                        </td>
                        <td>
<<<<<<< HEAD
                            <span class="status-badge ${n.status === "delivered" ? "status-ready" : "status-pending"}">
=======
                            <span class="status-badge ${statusClass}">
>>>>>>> f7e8380b1f5ec9ee5648a0c3fb5985ae5e99c7d6
                                ${n.status}
                            </span>
                        </td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${n.message}">
                            ${n.message}
                        </td>
                    </tr>
                `;
    })
    .join("");
}

// Data Loading
function loadData() {
  const orders = DataStore.getOrders();
  const notifications = DataStore.getNotifications();
  const subscriptions = DataStore.getSubscriptions();

  document.getElementById("totalOrders").textContent = orders.length;
  document.getElementById("pendingOrders").textContent = orders.filter(
    (o) => o.status === "pending",
  ).length;
  document.getElementById("completedOrders").textContent = orders.filter(
    (o) => o.status === "delivered",
  ).length;
  document.getElementById("totalNotifications").textContent =
    notifications.length;
  document.getElementById("activeSubscriptions").textContent =
    subscriptions.filter((s) => s.status === "Active").length;
  document.getElementById("subscriptionRevenue").textContent =
    `GHS ${subscriptions
      .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0)
      .toFixed(2)}`;

  loadRecentOrders();
  loadAllOrders();
  loadCustomerDropdown();
  loadStaffTable();
}

function loadRecentOrders() {
  let orders = DataStore.getOrders().slice(-5).reverse();
  const searchTerm =
    document.getElementById("headerSearch")?.value.toLowerCase() || "";
  if (searchTerm) {
    orders = orders.filter((o) => {
      return [o.customer, o.phone, o.id.toString(), o.service].some((field) =>
        field.toLowerCase().includes(searchTerm),
      );
    });
  }

  const tbody = document.getElementById("recentOrdersTable");

  if (orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><h3>No orders yet</h3><p>Create your first order to get started</p></td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map((order) => createOrderRow(order, false))
    .join("");
}

function loadAllOrders() {
  let orders = DataStore.getOrders();

  if (currentUser.role === "staff") {
    orders = orders.slice(-10);
  }

  if (currentFilter !== "all") {
    orders = orders.filter((o) => o.status === currentFilter);
  }

  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  if (searchTerm) {
    orders = orders.filter((o) => {
      return [o.customer, o.phone, o.id.toString(), o.service].some((field) =>
        field.toLowerCase().includes(searchTerm),
      );
    });
  }

  const tbody = document.getElementById("allOrdersTable");

  if (orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-state" style="padding: 40px;"><i class="fas fa-inbox"></i><h3>No orders found</h3></td></tr>';
    return;
  }

  tbody.innerHTML = orders.map((order) => createOrderRow(order, true)).join("");
}

function createOrderRow(order, fullView) {
  const initials = order.customer
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const isStaff = currentUser.role === "staff";
  const isAdmin = currentUser.role === "admin";

  let actions = "";
  if (isStaff) {
    actions = `
                    <div class="action-btns">
                        <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)" ${order.status === "delivered" ? "disabled" : ""}>
                            <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
                            <option value="washing" ${order.status === "washing" ? "selected" : ""}>Washing</option>
                            <option value="ready" ${order.status === "ready" ? "selected" : ""}>Ready</option>
                            <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
                        </select>
                        <button class="action-btn notify" onclick="showReceipt(${order.id})" title="Receipt">
                            <i class="fas fa-receipt"></i>
                        </button>
                    </div>
                `;
  } else {
    const nextStatus = getNextStatus(order.status);
    const advanceBtn = nextStatus
      ? `<button class="action-btn advance" onclick="advanceOrderStatus(${order.id})" title="Move to ${nextStatus}">
                            <i class="fas fa-arrow-right"></i>
                        </button>`
      : "";

    actions = `
                    <div class="action-btns">
                        ${advanceBtn}
                        <button class="action-btn notify" onclick="openNotificationModal(${order.id})" title="Send Notification">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="action-btn" onclick="showReceipt(${order.id})" title="Receipt" style="background: #f3f4f6; color: #1f2937;">
                            <i class="fas fa-receipt"></i>
                        </button>
                        <button class="action-btn edit" onclick="editOrder(${order.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteOrder(${order.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
  }

  const statusClass = "status-" + order.status;
  const orderDate = new Date(order.date).toLocaleDateString();
  const notifiedIcon = order.notified
    ? '<i class="fas fa-check-circle" style="color: var(--success);"></i>'
    : '<i class="fas fa-times-circle" style="color: var(--text-muted); opacity: 0.5;"></i>';

  if (fullView) {
    return `
                    <tr>
                        <td>#${order.id.toString().slice(-4)}</td>
                        <td>
                            <div class="customer-info">
                                <div class="customer-avatar">${initials}</div>
                                <div>
                                    <div class="customer-name">${order.customer}</div>
                                    <div class="customer-phone">${order.phone}</div>
                                </div>
                            </div>
                        </td>
                        <td>${order.service}</td>
                        <td>${order.quantity} items</td>
                        <td>GH₵${parseFloat(order.price).toFixed(2)}</td>
                        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                        <td style="text-align: center;">${notifiedIcon}</td>
                        <td>${actions}</td>
                    </tr>
                `;
  } else {
    return `
                    <tr>
                        <td>
                            <div class="customer-info">
                                <div class="customer-avatar">${initials}</div>
                                <div>
                                    <div class="customer-name">${order.customer}</div>
                                    <div class="customer-phone">${order.phone}</div>
                                </div>
                            </div>
                        </td>
                        <td>${order.service}</td>
                        <td>${order.quantity}</td>
                        <td>GH₵${parseFloat(order.price).toFixed(2)}</td>
                        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                        <td>${
                          isStaff
                            ? actions
                            : `
                            <div class="action-btns">
                                ${
                                  getNextStatus(order.status)
                                    ? `<button class="action-btn advance" onclick="advanceOrderStatus(${order.id})" title="Move to ${getNextStatus(order.status)}">
                                    <i class="fas fa-arrow-right"></i>
                                </button>`
                                    : ""
                                }
                                <button class="action-btn notify" onclick="openNotificationModal(${order.id})" title="Send Notification">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                                <button class="action-btn edit" onclick="editOrder(${order.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteOrder(${order.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `
                        }</td>
                    </tr>
                `;
  }
}

function loadCustomers() {
  const orders = DataStore.getOrders();
  const notifications = DataStore.getNotifications();
  const customers = {};

  orders.forEach((order) => {
    if (!customers[order.phone]) {
      customers[order.phone] = {
        name: order.customer,
        phone: order.phone,
        orders: 0,
        spent: 0,
        lastOrder: order.date,
        notifications: 0,
      };
    }
    customers[order.phone].orders++;
    customers[order.phone].spent += parseFloat(order.price);
    if (new Date(order.date) > new Date(customers[order.phone].lastOrder)) {
      customers[order.phone].lastOrder = order.date;
    }
  });

  notifications.forEach((n) => {
    if (customers[n.phone]) {
      customers[n.phone].notifications++;
    }
  });

  const tbody = document.getElementById("customersTable");
  const customerList = Object.values(customers).sort(
    (a, b) => b.orders - a.orders,
  );

  if (customerList.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state"><i class="fas fa-users"></i><h3>No customers yet</h3></td></tr>';
    return;
  }

  tbody.innerHTML = customerList
    .map((c) => {
      const initials = c.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      return `
                    <tr>
                        <td>
                            <div class="customer-info">
                                <div class="customer-avatar">${initials}</div>
                                <div class="customer-name">${c.name}</div>
                            </div>
                        </td>
                        <td>${c.phone}</td>
                        <td>${c.orders}</td>
                        <td>GH₵${c.spent.toFixed(2)}</td>
                        <td>${new Date(c.lastOrder).toLocaleDateString()}</td>
                        <td>
                            <div class="channel-tags">
                                <span class="channel-tag sms">SMS</span>
                                ${c.notifications > 0 ? `<span style="font-size: 12px; color: var(--text-muted);">${c.notifications} sent</span>` : ""}
                            </div>
                        </td>
                    </tr>
                `;
    })
    .join("");
}

function loadReports() {
  const orders = DataStore.getOrders();
  const today = new Date().toDateString();
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const todayRevenue = orders
    .filter((o) => new Date(o.date).toDateString() === today)
    .reduce((sum, o) => sum + parseFloat(o.price), 0);

  const weeklyRevenue = orders
    .filter((o) => new Date(o.date) >= weekAgo)
    .reduce((sum, o) => sum + parseFloat(o.price), 0);

  document.getElementById("todayRevenue").textContent =
    "GH₵" + todayRevenue.toFixed(2);
  document.getElementById("weeklyRevenue").textContent =
    "GH₵" + weeklyRevenue.toFixed(2);
}

// Order Management
function checkAutoNotify() {
  const status = document.getElementById("orderStatus").value;
  const settings = DataStore.getSettings();
  const notifyGroup = document.getElementById("notifyCheckboxGroup");
  const checkbox = document.getElementById("sendNotification");

  if (status === "ready" && settings.autoNotifyReady) {
    notifyGroup.style.display = "block";
    checkbox.checked = true;
  } else if (status === "delivered" && settings.autoNotifyDelivered) {
    notifyGroup.style.display = "block";
    checkbox.checked = true;
  } else {
    notifyGroup.style.display = "none";
    checkbox.checked = false;
  }
}

function openModal(orderId = null) {
  editingOrderId = orderId;
  const modal = document.getElementById("orderModal");
  const title = document.getElementById("modalTitle");

  document.getElementById("notifyCheckboxGroup").style.display = "none";
  document.getElementById("sendNotification").checked = false;

  if (orderId) {
    const order = DataStore.getOrders().find((o) => o.id === orderId);
    title.textContent = "Edit Order";
    document.getElementById("modalEmailInput").value = order.email || "";
    document.getElementById("customerName").value = order.customer;
    document.getElementById("customerPhone").value = order.phone;
    document.getElementById("serviceType").value = order.service;
    document.getElementById("quantity").value = order.quantity;
    document.getElementById("price").value = order.price;
    document.getElementById("orderStatus").value = order.status;
    document.getElementById("estimatedCollection").value =
      order.estimatedCollection
        ? new Date(order.estimatedCollection).toISOString().slice(0, 16)
        : "";

    // Restrict status options to current and next status in workflow
    updateStatusDropdown(order.status);
  } else {
    title.textContent = "New Order";
    document.getElementById("orderForm").reset();
    document.getElementById("modalEmailInput").value = "";
    const defaultPickup = new Date(Date.now() + 48 * 60 * 60 * 1000);
    document.getElementById("estimatedCollection").value = defaultPickup
      .toISOString()
      .slice(0, 16);
    // New orders default to pending
    document.getElementById("orderStatus").value = "pending";
    updateStatusDropdown("pending");
  }

  modal.classList.add("active");
}

function updateStatusDropdown(currentStatus) {
  const statusSelect = document.getElementById("orderStatus");
  const options = statusSelect.querySelectorAll("option");

  // Get allowed statuses (current and next)
  const currentIndex = WORKFLOW_SEQUENCE.indexOf(currentStatus);
  const allowedStatuses = [currentStatus];

  if (currentIndex < WORKFLOW_SEQUENCE.length - 1) {
    allowedStatuses.push(WORKFLOW_SEQUENCE[currentIndex + 1]);
  }

  // Enable/disable options based on workflow
  options.forEach((option) => {
    const value = option.value;
    if (allowedStatuses.includes(value)) {
      option.disabled = false;
      option.style.display = "block";
    } else {
      option.disabled = true;
      option.style.display = "none";
    }
  });
}

function closeModal() {
  document.getElementById("orderModal").classList.remove("active");
  editingOrderId = null;
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

function showReceipt(orderId) {
  const order = DataStore.getOrders().find((o) => o.id === orderId);
  if (!order) {
    showToast("Order not found", "error");
    return;
  }

  const receiptTitle = document.getElementById("receiptTitle");
  const receiptBody = document.getElementById("receiptBody");
  const receiptMeta = document.getElementById("receiptMeta");

  const collectionTime = order.estimatedCollection
    ? formatDateTime(order.estimatedCollection)
    : formatDateTime(
        new Date(
          new Date(order.date).getTime() + 48 * 60 * 60 * 1000,
        ).toISOString(),
      );

  receiptTitle.textContent = `Receipt for Order #${order.id.toString().slice(-4)}`;
  receiptMeta.innerHTML = `
        <div><strong>Customer:</strong> ${order.customer}</div>
        <div><strong>Phone:</strong> ${order.phone}</div>
        <div><strong>Email:</strong> ${order.email || "N/A"}</div>
        <div><strong>Service:</strong> ${order.service}</div>
        <div><strong>Quantity:</strong> ${order.quantity}</div>
        <div><strong>Order Status:</strong> ${order.status}</div>
        <div><strong>Ordered On:</strong> ${formatDateTime(order.date)}</div>
        <div><strong>Estimated Pickup:</strong> ${collectionTime}</div>
      `;

  const total = parseFloat(order.price || 0).toFixed(2);
  receiptBody.innerHTML = `
        <div class="receipt-line">
            <span>Subtotal</span>
            <span>GHS${total}</span>
        </div>
        <div class="receipt-line">
            <span>Processing Fee</span>
            <span>GHS0.00</span>
        </div>
        <div class="receipt-total">
            <span>Total</span>
            <span>GHS${total}</span>
        </div>
      `;

  document.getElementById("receiptModal").classList.add("active");
}

function closeReceiptModal() {
  document.getElementById("receiptModal").classList.remove("active");
}

function printReceipt() {
  const printArea = document.getElementById("receiptContent");
  const printWindow = window.open("", "PrintReceipt", "width=800,height=600");
  if (!printWindow) {
    showToast("Please allow popups for printing", "error");
    return;
  }
  printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h2 { margin-bottom: 16px; }
            .receipt-meta { margin-bottom: 20px; }
            .receipt-meta div { margin-bottom: 8px; }
            .receipt-line { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .receipt-total { display: flex; justify-content: space-between; font-weight: 700; margin-top: 16px; padding-top: 12px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
        </body>
      </html>
    `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

// Workflow Status Sequence
const WORKFLOW_SEQUENCE = ["pending", "washing", "ready", "delivered"];

function getNextStatus(currentStatus) {
  const currentIndex = WORKFLOW_SEQUENCE.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex >= WORKFLOW_SEQUENCE.length - 1) {
    return null;
  }
  return WORKFLOW_SEQUENCE[currentIndex + 1];
}

async function advanceOrderStatus(orderId) {
  const orders = DataStore.getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    showToast("Order not found", "error");
    return;
  }

  const nextStatus = getNextStatus(order.status);
  if (!nextStatus) {
    showToast("Order is already delivered", "warning");
    return;
  }

  const previousStatus = order.status;
  order.status = nextStatus;
  await DataStore.saveOrder(order);

  // Send SMS notification for status change
  const notificationMessages = {
    washing: `Hi ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is now being washed. We'll notify you when it's ready!`,
    ready: `Hi ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is ready for collection at SmartWash. Total: GHS${parseFloat(order.price).toFixed(2)}. Open hours: 8AM-8PM.`,
    delivered: `Hi ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} has been delivered. Thank you for choosing SmartWash!`,
  };

  if (notificationMessages[nextStatus]) {
    const notification = {
      orderId: order.id,
      customer: order.customer,
      phone: order.phone,
      type: nextStatus,
      channel: "sms",
      status: "delivered",
      message: notificationMessages[nextStatus],
    };
    await DataStore.addNotification(notification);
    order.notified = true;
    await DataStore.saveOrder(order);
  }

  loadData();
  updateNotificationBadge();
  showToast(`Order moved from ${previousStatus} to ${nextStatus}`, "success");
}

async function saveOrder() {
  const order = {
    id: editingOrderId,
    email: document.getElementById("modalEmailInput").value,
    customer: document.getElementById("customerName").value,
    phone: document.getElementById("customerPhone").value,
    service: document.getElementById("serviceType").value,
    quantity: parseInt(document.getElementById("quantity").value),
    price: parseFloat(document.getElementById("price").value),
    status: document.getElementById("orderStatus").value,
    estimatedCollection: document.getElementById("estimatedCollection").value,
  };

  if (
    !order.customer ||
    !order.phone ||
    !order.price ||
    !order.estimatedCollection
  ) {
    showToast(
      "Please fill all required fields, including estimated pickup time",
      "error",
    );
    return;
  }

  // If updating an existing order, enforce workflow sequence
  if (editingOrderId) {
    const existingOrders = DataStore.getOrders();
    const existingOrder = existingOrders.find((o) => o.id === editingOrderId);
    if (existingOrder && order.status !== existingOrder.status) {
      const currentIndex = WORKFLOW_SEQUENCE.indexOf(existingOrder.status);
      const newIndex = WORKFLOW_SEQUENCE.indexOf(order.status);

      if (newIndex > currentIndex + 1) {
        order.status =
          getNextStatus(existingOrder.status) || existingOrder.status;
        showToast(
          "Status can only be changed to the next step in the workflow",
          "info",
        );
      } else if (newIndex < currentIndex) {
        showToast(
          "Orders can only move forward in the workflow, not backward",
          "error",
        );
        return;
      }
    }
  }

  const shouldNotify = document.getElementById("sendNotification").checked;

  await DataStore.saveOrder(order);

  // Send notification if checked
  if (
    shouldNotify &&
    (order.status === "ready" || order.status === "delivered")
  ) {
    await sendNotification(order, order.status);
  }

  closeModal();
  loadData();
  updateNotificationBadge();
  showToast(
    editingOrderId
      ? "Order updated successfully"
      : "Order created successfully",
    "success",
  );
}

function editOrder(id) {
  openModal(id);
}

async function deleteOrder(id) {
  if (confirm("Are you sure you want to delete this order?")) {
    await DataStore.deleteOrder(id);
    loadData();
    showToast("Order deleted successfully", "success");
  }
}

async function updateOrderStatus(id, newStatus) {
  const orders = DataStore.getOrders();
  const order = orders.find((o) => o.id === id);
  if (order) {
    const oldStatus = order.status;
    order.status = newStatus;

    // Auto-notify logic
    const settings = DataStore.getSettings();
    let notified = false;

    if (
      newStatus === "ready" &&
      settings.autoNotifyReady &&
      oldStatus !== "ready"
    ) {
      await sendNotification(order, "ready");
      order.notified = true;
      notified = true;
    } else if (
      newStatus === "delivered" &&
      settings.autoNotifyDelivered &&
      oldStatus !== "delivered"
    ) {
      await sendNotification(order, "delivered");
      order.notified = true;
      notified = true;
    }

    await DataStore.saveOrder(order);
    loadData();
    updateNotificationBadge();

    if (notified) {
      showToast(
        `Status updated to ${newStatus} & customer notified`,
        "success",
      );
    } else {
      showToast(`Order status updated to ${newStatus}`, "success");
    }
  }
}

// Notification Sending
async function sendNotification(order, type) {
  const templates = {
    ready: `Hi ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is now ready for collection at Smartwash. Total: GHS${parseFloat(order.price).toFixed(2)}. Open hours: 8AM-8PM. Reply STOP to opt out.`,
    delivered: `Thank you ${order.customer}! Your ${order.service} order #${order.id.toString().slice(-4)} has been delivered/collected. We hope you enjoyed our service. Rate us: smartwash.com/rate`,
    delayed: `Hi ${order.customer}, we apologize but your ${order.service} order #${order.id.toString().slice(-4)} is delayed. New pickup: tomorrow after 2PM. 10% discount applied.`,
    reminder: `Reminder: ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is still waiting for pickup at Smartwash. Available today until 8PM.`,
  };

  const message = templates[type] || templates.ready;

  const notification = {
    orderId: order.id,
    customer: order.customer,
    phone: order.phone,
    type: type,
    channel: "sms",
    status: "delivered",
    message: message,
  };

  await DataStore.addNotification(notification);

  // Simulate SMS sending delay
  setTimeout(() => {
    showToast(`SMS sent to ${order.customer}`, "success");
  }, 500);
}

function openNotificationModal(orderId) {
  currentNotifyOrderId = orderId;
  const order = DataStore.getOrders().find((o) => o.id === orderId);

  document.getElementById("notifyCustomerName").value = order.customer;
  document.getElementById("notifyCustomerPhone").value = order.phone;

  // Set default channel based on settings
  const settings = DataStore.getSettings();
  const defaultChannel = settings.whatsappNotify ? "whatsapp" : "sms";
  document.getElementById("notifyChannel").value = defaultChannel;
  document.getElementById("notifyType").value = "ready";

  updateNotifyTemplate();

  document.getElementById("sendNotificationModal").classList.add("active");
}

function closeNotificationModal() {
  document.getElementById("sendNotificationModal").classList.remove("active");
  currentNotifyOrderId = null;
}

function updateNotifyTemplate() {
  const type = document.getElementById("notifyType").value;
  const channel = document.getElementById("notifyChannel").value;
  const order = DataStore.getOrders().find(
    (o) => o.id === currentNotifyOrderId,
  );

  const templates = {
<<<<<<< HEAD
    sms: {
      ready: `Hi ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is now ready for collection at Smartwash. Total: GHS${parseFloat(order.price).toFixed(2)}. Open hours: 8AM-8PM. Reply STOP to opt out.`,
      delayed: `Hi ${order.customer}, we apologize but your ${order.service} order #${order.id.toString().slice(-4)} is delayed. We will notify you when it's ready.`,
      reminder: `Reminder: ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is waiting for pickup at Smartwash.`,
      custom: "",
    },
    whatsapp: {
      ready: `👋 Hi ${order.customer},\n\n✅ Your ${order.service} order #${order.id.toString().slice(-4)} is now ready for collection!\n\n💰 Total: GHS${parseFloat(order.price).toFixed(2)}\n📍 Smartwash Laundry\n🕐 Open hours: 8AM-8PM\n\nThanks for choosing us! 🧼`,
      delayed: `⏰ Hi ${order.customer},\n\nWe apologize, but your ${order.service} order #${order.id.toString().slice(-4)} is delayed.\n\n🔄 New ETA: Tomorrow after 2PM\n📞 We'll notify you when it's ready\n\nThank you for your patience! 🙏`,
      reminder: `📦 Reminder ${order.customer},\n\nYour ${order.service} order #${order.id.toString().slice(-4)} is still waiting for pickup!\n\n📍 Smartwash Laundry\n⏰ Available today until 8PM\n\nCome pick it up! 🚗`,
      custom: "",
    },
=======
    ready: `Hi ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is now ready for collection at Smartwash. Total: GHS${parseFloat(order.price).toFixed(2)}. Open hours: 8AM-8PM.`,
    delayed: `Hi ${order.customer}, we apologize but your ${order.service} order #${order.id.toString().slice(-4)} is delayed. We will notify you when it's ready.`,
    reminder: `Reminder: ${order.customer}, your ${order.service} order #${order.id.toString().slice(-4)} is waiting for pickup at Smartwash.`,
    custom: "",
>>>>>>> f7e8380b1f5ec9ee5648a0c3fb5985ae5e99c7d6
  };

  const selectedTemplate = templates[channel][type] || "";
  document.getElementById("notifyMessage").value = selectedTemplate;

  const previewEl = document.getElementById("smsPreview");
  previewEl.textContent = selectedTemplate || "Enter your custom message...";

  // Update preview styling based on channel
  if (channel === "whatsapp") {
    previewEl.style.backgroundColor = "#e8f5e9";
    previewEl.style.borderLeft = "4px solid #25d366";
  } else {
    previewEl.style.backgroundColor = "#e3f2fd";
    previewEl.style.borderLeft = "4px solid #1976d2";
  }
}

async function sendManualNotification() {
  const order = DataStore.getOrders().find(
    (o) => o.id === currentNotifyOrderId,
  );
  const message = document.getElementById("notifyMessage").value;
  const type = document.getElementById("notifyType").value;
  const channel = document.getElementById("notifyChannel").value;

  if (!message.trim()) {
    showToast("Please enter a message", "error");
    return;
  }

  const notification = {
    orderId: order.id,
    customer: order.customer,
    phone: order.phone,
    type: type,
    channel: channel,
    status: "delivered",
    message: message,
  };

  await DataStore.addNotification(notification);

  // Update order notified status
  const orders = DataStore.getOrders();
  const orderIndex = orders.findIndex((o) => o.id === currentNotifyOrderId);
  if (orderIndex !== -1) {
    orders[orderIndex].notified = true;
    await DataStore.saveOrder(orders[orderIndex]);
  }

  closeNotificationModal();
  loadData();
  updateNotificationBadge();

  const channelName = channel === "sms" ? "SMS" : "WhatsApp";
  showToast(`${channelName} notification sent successfully`, "success");
}

// Settings
function toggleSetting(element) {
  element.classList.toggle("active");
}

function saveNotificationSettings() {
  const settings = {
    autoNotifyReady: document
      .getElementById("autoNotifyReady")
      .classList.contains("active"),
    autoNotifyDelivered: document
      .getElementById("autoNotifyDelivered")
      .classList.contains("active"),
    marketingNotify: document
      .getElementById("marketingNotify")
      .classList.contains("active"),
    whatsappNotify: document
      .getElementById("whatsappNotify")
      .classList.contains("active"),
  };

  DataStore.saveSettings(settings);
  showToast("Notification settings saved", "success");
}

function loadSettings() {
  const settings = DataStore.getSettings();
  if (settings.autoNotifyReady)
    document.getElementById("autoNotifyReady").classList.add("active");
  if (settings.autoNotifyDelivered)
    document.getElementById("autoNotifyDelivered").classList.add("active");
  if (settings.marketingNotify)
    document.getElementById("marketingNotify").classList.add("active");
  if (settings.whatsappNotify)
    document.getElementById("whatsappNotify").classList.add("active");
}

// Filtering & Search
function filterOrders(status) {
  currentFilter = status;

  document
    .querySelectorAll(".filter-tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  loadAllOrders();
}

function searchOrders() {
  loadAllOrders();
}

function searchCustomers() {
  loadCustomers();
}

function searchNotifications() {
  loadNotificationCenter();
}

function handleQuickSearch() {
  const query =
    document.getElementById("headerSearch")?.value.trim().toLowerCase() || "";
  const orderSearch = document.getElementById("searchInput");
  if (orderSearch) {
    orderSearch.value = query;
  }

  if (currentSection === "subscriptions") {
    loadSubscriptions();
  } else {
    loadAllOrders();
    loadRecentOrders();
  }
}

// Utilities
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
  };

  toast.innerHTML = `
                <div class="toast-icon">
                    <i class="fas ${icons[type]}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <div class="toast-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </div>
            `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  const icon = document.getElementById("darkModeIcon");

  if (isDark) {
    html.removeAttribute("data-theme");
    localStorage.setItem("smartwash_theme", "light");
    if (icon) {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("smartwash_theme", "dark");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
  }
}

function loadTheme() {
  const theme = localStorage.getItem("smartwash_theme");
  const icon = document.getElementById("darkModeIcon");

  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (icon) {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  }
  loadSettings();
}

function refreshData() {
  const btn = event.currentTarget;
  btn.style.transform = "rotate(360deg)";
  setTimeout(() => (btn.style.transform = ""), 600);
  loadData();
  updateNotificationBadge();
  showToast("Data refreshed", "success");
}

function showProfile() {
  showSection("staff");
  document.getElementById("pageTitle").textContent = "My Profile";
  loadStaffSection();
}

function logout() {
  DataStore.clearUser();
  currentUser = null;
  showToast("Logged out successfully", "success");
  setTimeout(() => {
    location.reload();
  }, 1000);
}

// Close modals on outside click
document.getElementById("orderModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document
  .getElementById("sendNotificationModal")
  .addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeNotificationModal();
  });

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeNotificationModal();
  }
  if (e.ctrlKey && e.key === "n" && currentUser?.role === "admin") {
    e.preventDefault();
    openModal();
  }
});

// Button event listeners
document.getElementById("saveOrderBtn").addEventListener("click", saveOrder);
document.getElementById("cancelOrderBtn").addEventListener("click", closeModal);
document
  .getElementById("closeOrderModalBtn")
  .addEventListener("click", closeModal);
document
  .getElementById("closeNotificationModalBtn")
  .addEventListener("click", closeNotificationModal);
document
  .getElementById("cancelNotificationBtn")
  .addEventListener("click", closeNotificationModal);
document
  .getElementById("sendNotificationBtn")
  .addEventListener("click", sendManualNotification);

// ========== NEW FUNCTIONS FOR REDESIGNED UI ==========

// Place Order Form Functions
function addOrderItem() {
  const tbody = document.getElementById("orderItemsTable");
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><input type="text" class="form-input" placeholder="Item name" style="width: 100%;" /></td>
    <td><input type="number" class="form-input" value="1" min="1" style="width: 100%;" onchange="calculateTotal()" /></td>
    <td><input type="number" class="form-input" value="0.00" step="0.01" style="width: 100%;" onchange="calculateTotal()" /></td>
    <td><input type="number" class="form-input" value="0.00" step="0.01" readonly style="width: 100%; background: var(--background);" /></td>
    <td><button type="button" class="action-btn delete" onclick="removeOrderItem(this)" style="width: 100%;">✕</button></td>
  `;
  tbody.appendChild(newRow);
}

function removeOrderItem(btn) {
  btn.closest("tr").remove();
  calculateTotal();
}

function calculateTotal() {
  const tbody = document.getElementById("orderItemsTable");
  const rows = tbody.querySelectorAll("tr");
  let subtotal = 0;

  rows.forEach((row) => {
    const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const amount = qty * price;
    row.cells[3].querySelector("input").value = amount.toFixed(2);
    subtotal += amount;
  });

  const tax = parseFloat(document.getElementById("taxAmount").value) || 0;
  const pickup = parseFloat(document.getElementById("pickupCharge").value) || 0;
  const delivery =
    parseFloat(document.getElementById("deliveryCharge").value) || 0;

  document.getElementById("subtotal").value = subtotal.toFixed(2);
  document.getElementById("totalAmount").value = (
    subtotal +
    tax +
    pickup +
    delivery
  ).toFixed(2);
}

// Load customer dropdown
function loadCustomerDropdown() {
  const customers = DataStore.getOrders();
  const customerMap = {};
  customers.forEach((order) => {
    if (!customerMap[order.customer]) {
      customerMap[order.customer] = true;
    }
  });

  const select = document.getElementById("placeOrderCustomer");
  if (select) {
<<<<<<< HEAD
=======
    select.innerHTML = '<option value="">Select Customer</option>';
>>>>>>> f7e8380b1f5ec9ee5648a0c3fb5985ae5e99c7d6
    Object.keys(customerMap).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }
}

// Pickup, Delivery, Subscriptions, Staff, Settings placeholder functions
function searchPickups() {
  // Placeholder for pickup search
}

function searchDeliveries() {
  // Placeholder for delivery search
}

<<<<<<< HEAD
function addSubscriptionPlan() {
  showToast("Add Subscription Plan feature coming soon", "info");
}

function addStaff() {
  showToast("Add Staff feature coming soon", "info");
=======
async function addSubscriptionPlan() {
  const customer = prompt("Customer name", "New Customer");
  if (!customer) return;

  const plan = prompt("Plan name", "Premium Wash");
  if (!plan) return;

  const amount = parseFloat(prompt("Amount (GHS)", "49.99")?.trim() || "0");
  const frequency = prompt("Frequency", "Monthly");
  const status = prompt("Status", "Active");
  const startDate = prompt(
    "Start date (YYYY-MM-DD)",
    new Date().toISOString().slice(0, 10),
  );

  const newSubscription = {
    id: Date.now(),
    customer,
    plan,
    amount: isNaN(amount) ? 0 : amount,
    frequency: frequency || "Monthly",
    status: status || "Active",
    startDate: startDate || new Date().toISOString().slice(0, 10),
  };

  await DataStore.addSubscription(newSubscription);
  loadSubscriptions();
  loadData();
  showToast("Subscription added successfully", "success");
}

function addStaff() {
  openStaffModal();
}

function loadStaffTable() {
  const staff = DataStore.getStaff();
  const tbody = document.getElementById("staffTable");

  if (!tbody) return;

  if (staff.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state"><i class="fas fa-user-friends"></i><h3>No staff members yet</h3><p>Add your first team member to start managing staff.</p></td></tr>';
    return;
  }

  tbody.innerHTML = staff
    .map(
      (member) => `
        <tr>
          <td>${member.name}</td>
          <td>${member.email}</td>
          <td>${member.phone || "-"}</td>
          <td>${member.role}</td>
          <td>${member.status}</td>
          <td>
            <button class="action-btn" onclick="deleteStaffMember('${member.email}')">Remove</button>
          </td>
        </tr>
      `,
    )
    .join("");
}

function loadSubscriptions() {
  const subscriptions = DataStore.getSubscriptions();
  const searchTerm =
    document.getElementById("headerSearch")?.value.toLowerCase() || "";
  const filtered = searchTerm
    ? subscriptions.filter((sub) => {
        return [
          sub.customer,
          sub.plan,
          sub.frequency,
          sub.status,
          sub.startDate,
        ].some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(searchTerm),
        );
      })
    : subscriptions;

  const tbody = document.getElementById("subscriptionsTable");
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-state"><i class="fas fa-box-open"></i><h3>No subscriptions found</h3><p>Try another search or add a plan.</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (sub) => `
        <tr>
          <td>${sub.customer}</td>
          <td>${sub.plan}</td>
          <td>GHS ${parseFloat(sub.amount || 0).toFixed(2)}</td>
          <td>${sub.frequency}</td>
          <td>${sub.status}</td>
          <td>${sub.startDate}</td>
          <td>
            <button class="action-btn" onclick="removeSubscription(${sub.id})">Remove</button>
          </td>
        </tr>
      `,
    )
    .join("");
}

async function removeSubscription(id) {
  const subscriptions = DataStore.getSubscriptions().filter(
    (subscription) => subscription.id !== id,
  );
  await DataStore.saveSubscriptions(subscriptions);
  loadSubscriptions();
  loadData();
  showToast("Subscription removed", "success");
}

function openStaffModal() {
  const overlay = document.getElementById("staffModal");
  if (overlay) overlay.classList.add("active");
}

function closeStaffModal() {
  const overlay = document.getElementById("staffModal");
  if (overlay) overlay.classList.remove("active");
  const form = document.getElementById("staffForm");
  if (form) form.reset();
}

async function deleteStaffMember(email) {
  await DataStore.deleteStaff(email);
  loadStaffTable();
  showToast("Staff member removed", "success");
}

function handleStaffSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("staffName").value.trim();
  const email = document
    .getElementById("staffEmail")
    .value.trim()
    .toLowerCase();
  const phone = document.getElementById("staffPhone").value.trim();
  const role = document.getElementById("staffRole").value;
  const status = document.getElementById("staffStatus").value;

  if (!name || !email) {
    showToast("Name and email are required", "error");
    return;
  }

  DataStore.addStaff({
    name,
    email,
    phone,
    role,
    status,
  }).then(() => {
    loadStaffTable();
    closeStaffModal();
    showToast("Staff member added", "success");
  });
>>>>>>> f7e8380b1f5ec9ee5648a0c3fb5985ae5e99c7d6
}

// Initialize place order form on load
document.addEventListener("DOMContentLoaded", function () {
  const placeOrderForm = document.getElementById("placeOrderForm");
  if (placeOrderForm) {
    loadCustomerDropdown();
    placeOrderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const customer = document.getElementById("placeOrderCustomer").value;
      const service = document.getElementById("placeOrderService").value;
      const total = document.getElementById("totalAmount").value;

      if (!customer) {
        showToast("Please select a customer", "error");
        return;
      }

      const order = {
        customer: customer,
        service: service,
        price: parseFloat(total),
        quantity: 1,
        phone: "N/A",
        status: "pending",
      };

      DataStore.saveOrder(order);
      loadData();
      showToast("Order placed successfully", "success");
      this.reset();
      calculateTotal();
    });
  }
<<<<<<< HEAD
=======

  const staffForm = document.getElementById("staffForm");
  if (staffForm) {
    staffForm.addEventListener("submit", handleStaffSubmit);
  }

  loadStaffTable();
>>>>>>> f7e8380b1f5ec9ee5648a0c3fb5985ae5e99c7d6
});
