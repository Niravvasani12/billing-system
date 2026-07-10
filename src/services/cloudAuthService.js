const USERS_KEY = "vyapaaros:cloud-users";
const LICENSES_KEY = "vyapaaros:cloud-licenses";
const OTPS_KEY = "vyapaaros:cloud-otps";
const DEVICES_KEY = "vyapaaros:cloud-devices";
const ACTIVITY_KEY = "vyapaaros:cloud-activity";
const SETTINGS_KEY = "vyapaaros:cloud-settings";
const SESSION_KEY = "billing:auth-session";
const TRIAL_DAYS = 60;
const OWNER_EMAILS = ["info.vyapparos@gmail.com", "info.vyapaaros@gmail.com"];
const DEFAULT_OWNER_EMAIL = "info.vyapparos@gmail.com";
const LOCAL_OWNER_DEV_PASSWORD_KEY = "vyapaaros:local-owner-dev-password";
const DEFAULT_CLOUD_AUTH_URL = "https://billing-system-8jll.onrender.com";
const CLOUD_AUTH_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUD_AUTH_URL) ||
  localStorage.getItem("vyapaaros:cloud-auth-url") ||
  ((typeof import.meta !== "undefined" && import.meta.env?.DEV) ? "http://localhost:8080" : DEFAULT_CLOUD_AUTH_URL);

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};

const getDeviceId = () => {
  const key = "vyapaaros:device-id";
  const current = localStorage.getItem(key);
  if (current) return current;
  const generated = `desktop-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  localStorage.setItem(key, generated);
  return generated;
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isOwnerEmail = (email = "") => OWNER_EMAILS.includes(normalizeEmail(email));
const withResolvedRole = (user) => ({
  ...user,
  id: user.id || user._id,
  role: isOwnerEmail(user.email) ? "owner" : "shopkeeper",
});

const createLocalOwnerUser = () => {
  const now = new Date().toISOString();
  return withResolvedRole({
    id: "owner-super-admin",
    name: "Super Admin",
    businessName: "Vyaapar OS",
    email: DEFAULT_OWNER_EMAIL,
    password: localStorage.getItem(LOCAL_OWNER_DEV_PASSWORD_KEY) || "",
    businessType: "Software Owner",
    phone: "",
    country: "India",
    state: "",
    city: "",
    gstNumber: "",
    businessAddress: "",
    profilePhoto: "",
    notes: "Built-in Super Admin for local desktop testing.",
    accountStatus: "active",
    emailVerified: true,
    plan: "Super Admin",
    paymentStatus: "paid",
    trialStartedAt: now,
    trialEndsAt: addDays(new Date(), 3650),
    paidUntil: addDays(new Date(), 3650),
    lastLogin: null,
    createdAt: now,
  });
};

const ensureLocalOwnerUser = (users) => {
  const owner = createLocalOwnerUser();
  const existing = users.find((user) => user.email === DEFAULT_OWNER_EMAIL);
  if (!existing) return [owner, ...users];
  return users.map((user) =>
    user.email === DEFAULT_OWNER_EMAIL
      ? {
          ...owner,
          ...user,
          password: user.password || owner.password,
          role: "owner",
          accountStatus: "active",
          emailVerified: true,
          paymentStatus: "paid",
          plan: "Super Admin",
          paidUntil: user.paidUntil || owner.paidUntil,
          trialEndsAt: user.trialEndsAt || owner.trialEndsAt,
        }
      : user,
  );
};

const getCloudPayload = (payload = {}) => ({
  ...payload,
  deviceId: getDeviceId(),
  platform: "Windows Desktop",
});

const requestCloud = async (path, options = {}) => {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const { timeoutMs: _timeoutMs, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(`${CLOUD_AUTH_URL}${path}`, {
    ...fetchOptions,
    signal: fetchOptions.signal || controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(fetchOptions.headers || {}),
    },
  }).finally(() => clearTimeout(timeoutId));
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Cloud authentication request failed.");
  }
  return data;
};

const normalizeCloudUser = (user, license = null) => {
  if (!user) return null;
  const normalized = withResolvedRole({
    ...user,
    id: user.id || user._id,
    password: user.password || "",
    accountStatus: user.accountStatus || "active",
    paymentStatus: license?.status || user.paymentStatus || "trial",
    plan: license?.plan || user.plan || (license?.status === "paid" ? "Premium" : "Free Trial"),
    trialStartedAt: user.trialStartedAt || user.createdAt || new Date().toISOString(),
    trialEndsAt: license?.trialEndsAt || user.trialEndsAt,
    paidUntil: license?.paidUntil || user.paidUntil || null,
    createdAt: user.createdAt || new Date().toISOString(),
  });
  return normalized;
};

export const cloudAuth = {
  usersKey: USERS_KEY,
  licensesKey: LICENSES_KEY,
  sessionKey: SESSION_KEY,
  ownerEmails: OWNER_EMAILS,
  apiBaseUrl: CLOUD_AUTH_URL,

  isOwnerUser(user) {
    return isOwnerEmail(user?.email);
  },

  listUsers() {
    const users = readJson(USERS_KEY, []);
    if (users.length) {
      const normalized = ensureLocalOwnerUser(users.map((user) => withResolvedRole(user)));
      if (JSON.stringify(normalized) !== JSON.stringify(users)) {
        this.saveUsers(normalized);
      }
      return normalized;
    }
    const legacyUsers = readJson("billing:auth-users", []);
    if (legacyUsers.length) {
      const migrated = ensureLocalOwnerUser(legacyUsers.map((user) => withResolvedRole({
        ...user,
        createdAt: user.createdAt || user.trialStartedAt || new Date().toISOString(),
      })));
      this.saveUsers(migrated);
      migrated.forEach((user) => this.upsertLicense(user));
      return migrated;
    }
    const owner = createLocalOwnerUser();
    this.saveUsers([owner]);
    this.upsertLicense(owner);
    return [owner];
  },

  listLicenses() {
    return readJson(LICENSES_KEY, []);
  },

  listOtps() {
    return readJson(OTPS_KEY, []);
  },

  listDevices() {
    return readJson(DEVICES_KEY, []);
  },

  listActivity() {
    return readJson(ACTIVITY_KEY, []);
  },

  getAdminSettings() {
    return readJson(SETTINGS_KEY, {
      trialPeriodDays: 60,
      defaultPlan: "Free Trial",
      defaultDeviceLimit: 1,
      smtpHost: "",
      smtpEmail: "",
      companyName: "Vyaapar OS",
      brandColor: "#1266a8",
      maintenanceMode: false,
      backupFrequency: "Daily",
    });
  },

  async saveAdminSettings(settings, adminName = "Super Admin") {
    try {
      const data = await requestCloud("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ ...settings, adminName }),
      });
      writeJson(SETTINGS_KEY, data.settings || settings);
      return data.settings || settings;
    } catch (error) {
      console.warn(error);
    }
    writeJson(SETTINGS_KEY, settings);
    this.logActivity(adminName, "Updated system settings", "Platform Settings");
    return settings;
  },

  logActivity(adminName, action, targetUser = "-", ipAddress = "Desktop App") {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      dateTime: new Date().toISOString(),
      adminName,
      action,
      targetUser,
      ipAddress,
    };
    writeJson(ACTIVITY_KEY, [log, ...this.listActivity()].slice(0, 300));
    return log;
  },

  saveUsers(users) {
    writeJson(USERS_KEY, users);
    localStorage.setItem("billing:auth-users", JSON.stringify(users));
  },

  getSessionUser() {
    const session = readJson(SESSION_KEY, null);
    if (!session?.userId) return null;
    return this.listUsers().find((user) => user.id === session.userId) || null;
  },

  async requestOtp(email, purpose = "login") {
    const normalizedEmail = normalizeEmail(email);
    try {
      const data = await requestCloud("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, purpose }),
      });
      if (data.devOtp) {
        const otp = {
          id: `otp-${Date.now()}`,
          email: normalizedEmail,
          code: data.devOtp,
          purpose,
          status: "sent",
          deliveryMode: data.deliveryMode,
          deliveryError: data.deliveryError,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        };
        writeJson(OTPS_KEY, [otp, ...this.listOtps()].slice(0, 50));
        return otp;
      }
      return {
        email: normalizedEmail,
        purpose,
        status: "sent",
        sentToEmail: true,
        deliveryMode: data.deliveryMode,
      };
    } catch (error) {
      console.warn("Cloud OTP unavailable, using local OTP fallback.", error);
      return this.requestLocalOtp(email, purpose);
    }
  },

  requestLocalOtp(email, purpose = "login") {
    const normalizedEmail = normalizeEmail(email);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const otp = {
      id: `otp-${Date.now()}`,
      email: normalizedEmail,
      code,
      purpose,
      status: "sent",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    writeJson(OTPS_KEY, [otp, ...this.listOtps()].slice(0, 50));
    return otp;
  },

  verifyOtp(email, code) {
    const normalizedEmail = normalizeEmail(email);
    const otps = this.listOtps();
    const otp = otps.find(
      (item) =>
        item.email === normalizedEmail &&
        item.code === code.trim() &&
        item.status === "sent" &&
        new Date(item.expiresAt).getTime() > Date.now(),
    );
    if (!otp) return false;
    writeJson(
      OTPS_KEY,
      otps.map((item) => (item.id === otp.id ? { ...item, status: "verified", verifiedAt: new Date().toISOString() } : item)),
    );
    return true;
  },

  async signup(payload) {
    try {
      const data = await requestCloud("/auth/signup", {
        method: "POST",
        body: JSON.stringify(getCloudPayload({
          ...payload,
          businessType: payload.businessType || "General",
        })),
      });
      const user = normalizeCloudUser(data.user, data.license);
      const users = this.listUsers().filter((item) => item.id !== user.id && item.email !== user.email);
      this.saveUsers([user, ...users]);
      if (data.license) {
        writeJson(LICENSES_KEY, [data.license, ...this.listLicenses().filter((item) => item.userId !== user.id)]);
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      return user;
    } catch (error) {
      console.warn("Cloud signup unavailable, using local signup fallback.", error);
      if (!this.verifyOtp(payload.email, payload.otp || "")) {
        throw new Error("Invalid or expired OTP.");
      }
      return this.signupLocal(payload);
    }
  },

  signupLocal(payload) {
    const users = this.listUsers();
    const email = normalizeEmail(payload.email);
    if (users.some((user) => user.email === email)) {
      throw new Error("Account already exists. Please login.");
    }
    const now = new Date().toISOString();
    const user = {
      id: `user-${Date.now()}`,
      name: payload.name.trim() || "Shopkeeper",
      businessName: payload.businessName.trim() || "VyapaarOS Shop",
      email,
      password: payload.password,
      businessType: payload.businessType || "General",
      phone: payload.phone || "",
      country: payload.country || "India",
      state: payload.state || "",
      city: payload.city || "",
      gstNumber: payload.gstNumber || "",
      businessAddress: payload.businessAddress || "",
      profilePhoto: payload.profilePhoto || "",
      notes: payload.notes || "",
      accountStatus: "active",
      role: isOwnerEmail(email) ? "owner" : "shopkeeper",
      trialStartedAt: now,
      trialEndsAt: addDays(new Date(), TRIAL_DAYS),
      paymentStatus: "trial",
      paidUntil: null,
      createdAt: now,
    };
    this.saveUsers([user, ...users]);
    this.upsertLicense(user);
    this.registerDevice(user.id);
    this.logActivity("System", "New user registered", user.email);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    return user;
  },

  async login(email, password) {
    const normalizedEmail = normalizeEmail(email);
    try {
      const data = await requestCloud("/auth/login", {
        method: "POST",
        body: JSON.stringify(getCloudPayload({ email: normalizedEmail, password })),
      });
      const user = normalizeCloudUser(data.user, data.license);
      const users = this.listUsers().filter((item) => item.id !== user.id && item.email !== user.email);
      this.saveUsers([user, ...users]);
      if (data.license) {
        writeJson(LICENSES_KEY, [data.license, ...this.listLicenses().filter((item) => item.userId !== user.id)]);
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      return user;
    } catch (error) {
      console.warn("Cloud login unavailable, using local login fallback.", error);
      return this.loginLocal(email, password);
    }
  },

  loginLocal(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const user = this.listUsers().find((item) => item.email === normalizedEmail && item.password === password);
    if (!user) throw new Error("Invalid login details.");
    if (user.accountStatus === "blocked") {
      throw new Error("Your account has been temporarily blocked. Please contact the administrator.");
    }
    if (user.accountStatus === "inactive") {
      throw new Error("Your account is inactive. Please contact the administrator.");
    }
    this.registerDevice(user.id);
    this.saveUsers(this.listUsers().map((item) => (item.id === user.id ? { ...item, lastLogin: new Date().toISOString() } : item)));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    return user;
  },

  async loginWithOtp(email, otp) {
    const normalizedEmail = normalizeEmail(email);
    try {
      const data = await requestCloud("/auth/login-otp", {
        method: "POST",
        body: JSON.stringify(getCloudPayload({ email: normalizedEmail, otp })),
      });
      const user = normalizeCloudUser(data.user, data.license);
      const users = this.listUsers().filter((item) => item.id !== user.id && item.email !== user.email);
      this.saveUsers([user, ...users]);
      if (data.license) {
        writeJson(LICENSES_KEY, [data.license, ...this.listLicenses().filter((item) => item.userId !== user.id)]);
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      return user;
    } catch (error) {
      console.warn("Cloud OTP login unavailable, using local OTP login fallback.", error);
      if (!this.verifyOtp(email, otp || "")) {
        throw new Error("Invalid or expired OTP.");
      }
      return this.loginWithLocalOtp(email);
    }
  },

  loginWithLocalOtp(email) {
    const normalizedEmail = normalizeEmail(email);
    const user = this.listUsers().find((item) => item.email === normalizedEmail);
    if (!user) throw new Error("No account found for this email.");
    if (user.accountStatus === "blocked") {
      throw new Error("Your account has been temporarily blocked. Please contact the administrator.");
    }
    if (user.accountStatus === "inactive") {
      throw new Error("Your account is inactive. Please contact the administrator.");
    }
    this.registerDevice(user.id);
    this.saveUsers(this.listUsers().map((item) => (item.id === user.id ? { ...item, lastLogin: new Date().toISOString() } : item)));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    return user;
  },

  upsertLicense(user) {
    const licenses = this.listLicenses();
    const license = {
      id: `lic-${user.id}`,
      userId: user.id,
      businessName: user.businessName,
      plan: user.paymentStatus === "paid" ? "VyapaarOS Pro" : "Free Trial",
      status: user.paymentStatus || "trial",
      trialEndsAt: user.trialEndsAt,
      paidUntil: user.paidUntil,
      maxDevices: 1,
      updatedAt: new Date().toISOString(),
    };
    writeJson(LICENSES_KEY, [license, ...licenses.filter((item) => item.userId !== user.id)]);
    return license;
  },

  updateLicense(userId, patch) {
    const users = this.listUsers().map((user) => (user.id === userId ? { ...user, ...patch } : user));
    this.saveUsers(users);
    const user = users.find((item) => item.id === userId);
    if (user) this.upsertLicense(user);
    return user;
  },

  async createUser(payload, adminName = "Super Admin") {
    try {
      const data = await requestCloud("/admin/users", {
        method: "POST",
        body: JSON.stringify({ ...payload, adminName }),
      });
      const user = normalizeCloudUser(data.user, data.license);
      this.saveUsers([user, ...this.listUsers().filter((item) => item.id !== user.id)]);
      if (data.license) writeJson(LICENSES_KEY, [data.license, ...this.listLicenses().filter((item) => item.userId !== user.id)]);
      return user;
    } catch (error) {
      console.warn(error);
    }
    const users = this.listUsers();
    const email = normalizeEmail(payload.email);
    if (users.some((user) => user.email === email)) {
      throw new Error("User already exists.");
    }
    const now = new Date().toISOString();
    const durationDays = Number(payload.subscriptionDuration || 60);
    const user = {
      id: `user-${Date.now()}`,
      name: payload.name || "Shopkeeper",
      businessName: payload.businessName || "New Business",
      email,
      password: payload.password || "123456",
      phone: payload.phone || "",
      mobile: payload.phone || "",
      businessType: payload.businessType || "General",
      country: payload.country || "India",
      state: payload.state || "",
      city: payload.city || "",
      gstNumber: payload.gstNumber || "",
      businessAddress: payload.businessAddress || "",
      profilePhoto: payload.profilePhoto || "",
      role: isOwnerEmail(email) ? "owner" : "shopkeeper",
      accountStatus: payload.accountStatus || "active",
      emailVerified: Boolean(payload.emailVerified),
      paymentStatus: payload.plan === "Premium" ? "paid" : "trial",
      plan: payload.plan || "Free Trial",
      trialStartedAt: now,
      trialEndsAt: addDays(new Date(), durationDays),
      paidUntil: payload.plan === "Premium" ? addDays(new Date(), durationDays) : null,
      lastLogin: null,
      notes: payload.notes || "",
      createdAt: now,
    };
    this.saveUsers([user, ...users]);
    this.upsertLicense({ ...user, paymentStatus: user.paymentStatus, paidUntil: user.paidUntil });
    this.logActivity(adminName, "Admin created a user", user.email);
    return user;
  },

  async updateUser(userId, patch, adminName = "Super Admin", shouldLog = true) {
    try {
      const data = await requestCloud(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ ...patch, adminName }),
      });
      const user = normalizeCloudUser(data.user, data.license);
      this.saveUsers(this.listUsers().map((item) => (item.id === userId ? user : item)));
      if (data.license) writeJson(LICENSES_KEY, [data.license, ...this.listLicenses().filter((item) => item.userId !== userId)]);
      return user;
    } catch (error) {
      console.warn(error);
    }
    let updatedUser = null;
    const users = this.listUsers().map((user) => {
      if (user.id !== userId) return user;
      updatedUser = withResolvedRole({ ...user, ...patch });
      return updatedUser;
    });
    this.saveUsers(users);
    if (updatedUser) this.upsertLicense(updatedUser);
    if (shouldLog && updatedUser) this.logActivity(adminName, "Admin edited user", updatedUser.email);
    return updatedUser;
  },

  async deleteUser(userId, adminName = "Super Admin") {
    try {
      await requestCloud(`/admin/users/${userId}`, {
        method: "DELETE",
        body: JSON.stringify({ adminName }),
      });
    } catch (error) {
      console.warn(error);
    }
    const user = this.listUsers().find((item) => item.id === userId);
    this.saveUsers(this.listUsers().filter((item) => item.id !== userId));
    writeJson(LICENSES_KEY, this.listLicenses().filter((item) => item.userId !== userId));
    writeJson(DEVICES_KEY, this.listDevices().filter((item) => item.userId !== userId));
    this.logActivity(adminName, "Admin deleted a user and related cloud data", user?.email || userId);
  },

  async blockUser(userId, adminName = "Super Admin") {
    const user = await this.updateUser(userId, { accountStatus: "blocked" }, adminName, false);
    this.logActivity(adminName, "Admin blocked a user", user?.email || userId);
    return user;
  },

  async unblockUser(userId, adminName = "Super Admin") {
    const user = await this.updateUser(userId, { accountStatus: "active" }, adminName, false);
    this.logActivity(adminName, "Admin unblocked a user", user?.email || userId);
    return user;
  },

  forceLogoutUser(userId, adminName = "Super Admin") {
    this.logActivity(adminName, "Admin forced logout for user", userId);
  },

  async resetPassword(userId, password = "123456", adminName = "Super Admin") {
    const user = await this.updateUser(userId, { password }, adminName, false);
    this.logActivity(adminName, "Admin reset password", user?.email || userId);
    return user;
  },

  async extendSubscription(userId, days, adminName = "Super Admin") {
    try {
      const data = await requestCloud(`/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ days, adminName, status: "paid", plan: "Premium" }),
      });
      const updated = normalizeCloudUser(data.user, data.license);
      this.saveUsers(this.listUsers().map((item) => (item.id === userId ? updated : item)));
      if (data.license) writeJson(LICENSES_KEY, [data.license, ...this.listLicenses().filter((item) => item.userId !== userId)]);
      return updated;
    } catch (error) {
      console.warn(error);
    }
    const user = this.listUsers().find((item) => item.id === userId);
    if (!user) return null;
    const baseDate = user.paidUntil || user.trialEndsAt || new Date().toISOString();
    const nextDate = addDays(new Date(baseDate), Number(days || 0));
    const updated = this.updateUser(userId, {
      paymentStatus: "paid",
      plan: "Premium",
      paidUntil: nextDate,
      trialEndsAt: nextDate,
    }, adminName, false);
    this.logActivity(adminName, `Admin extended subscription by ${days} days`, updated?.email || userId);
    return updated;
  },

  async reduceSubscription(userId, days, adminName = "Super Admin") {
    return this.extendSubscription(userId, -Math.abs(Number(days || 0)), adminName);
  },

  async updateLicenseRecord(userId, patch, adminName = "Super Admin") {
    try {
      const data = await requestCloud(`/admin/licenses/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ ...patch, adminName }),
      });
      const license = data.license;
      writeJson(LICENSES_KEY, [license, ...this.listLicenses().filter((item) => item.userId !== userId)]);
      return license;
    } catch (error) {
      console.warn(error);
    }
    const licenses = this.listLicenses();
    const existing = licenses.find((license) => license.userId === userId) || { id: `lic-${userId}`, userId };
    const license = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    writeJson(LICENSES_KEY, [license, ...licenses.filter((item) => item.userId !== userId)]);
    this.logActivity(adminName, "Admin updated license", userId);
    return license;
  },

  async removeDevice(deviceId, adminName = "Super Admin") {
    try {
      await requestCloud(`/admin/devices/${deviceId}`, {
        method: "DELETE",
        body: JSON.stringify({ adminName }),
      });
    } catch (error) {
      console.warn(error);
    }
    const device = this.listDevices().find((item) => item.id === deviceId);
    writeJson(DEVICES_KEY, this.listDevices().filter((item) => item.id !== deviceId));
    this.logActivity(adminName, "Admin removed registered device", device?.userId || deviceId);
  },

  registerDevice(userId) {
    const devices = this.listDevices();
    const deviceId = getDeviceId();
    const device = {
      id: deviceId,
      userId,
      platform: "Windows Desktop",
      app: "VyapaarOS Electron",
      lastSeenAt: new Date().toISOString(),
      status: "active",
    };
    writeJson(DEVICES_KEY, [device, ...devices.filter((item) => item.id !== deviceId)]);
    return device;
  },

  async refreshAdminData() {
    const [users, licenses, devices, otps, activity, settings] = await Promise.all([
      requestCloud("/admin/users"),
      requestCloud("/admin/licenses"),
      requestCloud("/admin/devices"),
      requestCloud("/admin/otps"),
      requestCloud("/admin/activity"),
      requestCloud("/admin/settings"),
    ]);
    const normalizedUsers = users.map((user) => {
      const license = licenses.find((item) => String(item.userId) === String(user._id || user.id));
      return normalizeCloudUser(user, license);
    });
    this.saveUsers(normalizedUsers);
    writeJson(LICENSES_KEY, licenses.map((license) => ({ ...license, id: license.id || license._id })));
    writeJson(DEVICES_KEY, devices.map((device) => ({ ...device, id: device.deviceId || device.id || device._id })));
    writeJson(OTPS_KEY, otps.map((otp) => ({ ...otp, id: otp.id || otp._id, code: otp.code || "******" })));
    writeJson(ACTIVITY_KEY, activity.map((log) => ({ ...log, id: log.id || log._id, dateTime: log.dateTime || log.createdAt })));
    writeJson(SETTINGS_KEY, settings);
    return { users: normalizedUsers, licenses, devices, otps, activity, settings };
  },
};
