const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
let nodemailer = null;

try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

const loadEnvFile = (envPath) => {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const loadEnvFiles = () => {
  const candidates = [
    path.join(__dirname, ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.resourcesPath || "", "app.asar.unpacked", "backend", "cloud-auth", ".env"),
    path.join(process.resourcesPath || "", "app", "backend", "cloud-auth", ".env"),
  ];
  const seen = new Set();
  candidates.forEach((candidate) => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    loadEnvFile(candidate);
  });
};

loadEnvFiles();

process.on("unhandledRejection", (error) => {
  console.error("Unhandled cloud auth error:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught cloud auth error:", error);
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vyapaaros_auth";
const mongoDbName = process.env.MONGODB_DB || "vyaapar_os";
const ownerEmail = (process.env.OWNER_EMAIL || "").toLowerCase();
const ownerPassword = process.env.OWNER_PASSWORD || "";

const userSchema = new mongoose.Schema(
  {
    name: String,
    businessName: String,
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    businessType: String,
    phone: String,
    country: String,
    state: String,
    city: String,
    gstNumber: String,
    businessAddress: String,
    profilePhoto: String,
    notes: String,
    accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    plan: { type: String, default: "Free Trial" },
    paymentStatus: { type: String, default: "trial" },
    trialStartedAt: Date,
    trialEndsAt: Date,
    paidUntil: Date,
    lastLogin: Date,
    role: { type: String, enum: ["owner", "shopkeeper"], default: "shopkeeper" },
  },
  { timestamps: true },
);

const licenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    plan: String,
    status: { type: String, enum: ["trial", "paid", "expired", "blocked"], default: "trial" },
    trialEndsAt: Date,
    paidUntil: Date,
    maxDevices: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const deviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    deviceId: { type: String, index: true },
    platform: String,
    lastSeenAt: Date,
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, index: true },
    codeHash: String,
    purpose: String,
    status: { type: String, default: "sent" },
    expiresAt: Date,
  },
  { timestamps: true },
);

const activitySchema = new mongoose.Schema(
  {
    adminName: String,
    action: String,
    targetUser: String,
    ipAddress: String,
  },
  { timestamps: true },
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "platform" },
    trialPeriodDays: Number,
    defaultPlan: String,
    defaultDeviceLimit: Number,
    smtpHost: String,
    smtpEmail: String,
    companyName: String,
    brandColor: String,
    maintenanceMode: Boolean,
    backupFrequency: String,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
const License = mongoose.model("License", licenseSchema);
const Device = mongoose.model("Device", deviceSchema);
const Otp = mongoose.model("Otp", otpSchema);
const Activity = mongoose.model("Activity", activitySchema);
const Setting = mongoose.model("Setting", settingsSchema);

const hash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const addDaysFrom = (date, days) => new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
const smtpTimeoutMs = Number(process.env.SMTP_TIMEOUT_MS || 10000);

const sendOtpEmail = async (email, code, purpose) => {
  if (!nodemailer || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Development OTP for ${email}: ${code}`);
    return { sent: false, mode: "development" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    connectionTimeout: smtpTimeoutMs,
    greetingTimeout: smtpTimeoutMs,
    socketTimeout: smtpTimeoutMs,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Vyaapar OS ${purpose === "signup" ? "Signup" : "Login"} OTP`,
      text: `Your Vyaapar OS OTP is ${code}. It is valid for 10 minutes.`,
    });
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    return { sent: false, mode: "smtp-error", error: error?.message || "SMTP send failed" };
  }

  return { sent: true, mode: "smtp" };
};

const registerDevice = async (userId, deviceId, platform = "Windows Desktop") => {
  if (!deviceId) return null;
  return Device.findOneAndUpdate(
    { deviceId },
    { userId, deviceId, platform, lastSeenAt: new Date(), status: "active" },
    { upsert: true, new: true },
  );
};

const serializeUser = (user) => {
  const plain = user.toObject ? user.toObject() : user;
  return {
    ...plain,
    id: String(plain._id || plain.id),
  };
};

const logActivity = async (adminName, action, targetUser, ipAddress = "Cloud API") => {
  await Activity.create({ adminName, action, targetUser, ipAddress });
};

const licenseForUser = async (user) => {
  let license = await License.findOne({ userId: user._id });
  if (!license) {
    license = await License.create({ userId: user._id, plan: "Free Trial", status: "trial", trialEndsAt: addDays(60), maxDevices: 1 });
  }
  return license;
};

const ensureOwnerAccount = async () => {
  if (!ownerEmail || !ownerPassword) {
    console.warn("OWNER_EMAIL or OWNER_PASSWORD missing. Super Admin auto-login account was not seeded.");
    return;
  }

  const trialStartedAt = new Date();
  const paidUntil = addDays(3650);
  const owner = await User.findOneAndUpdate(
    { email: ownerEmail },
    {
      $set: {
        name: "Super Admin",
        businessName: "Vyaapar OS",
        email: ownerEmail,
        passwordHash: hash(ownerPassword),
        businessType: "Software Owner",
        country: "India",
        accountStatus: "active",
        emailVerified: true,
        plan: "Super Admin",
        paymentStatus: "paid",
        paidUntil,
        role: "owner",
      },
      $setOnInsert: {
        trialStartedAt,
        trialEndsAt: paidUntil,
      },
    },
    { upsert: true, new: true },
  );

  await License.findOneAndUpdate(
    { userId: owner._id },
    {
      userId: owner._id,
      plan: "Super Admin",
      status: "paid",
      activationDate: trialStartedAt,
      paidUntil,
      maxDevices: 10,
    },
    { upsert: true, new: true },
  );

  await logActivity("System", "Ensured Super Admin account", ownerEmail);
};

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "vyapaaros-cloud-auth",
    message: "Vyaapar OS cloud auth API is running. Use /health to check status.",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "vyapaaros-cloud-auth",
    mongoConfigured: Boolean(process.env.MONGODB_URI),
    smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    ownerConfigured: Boolean(ownerEmail && ownerPassword),
  });
});

app.post("/auth/request-otp", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await Otp.create({
    email,
    codeHash: hash(code),
    purpose: req.body.purpose || "login",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const delivery = await sendOtpEmail(email, code, req.body.purpose || "login");
  res.json({ ok: true, sentToEmail: delivery.sent, devOtp: delivery.sent ? undefined : code });
}));

app.post("/auth/signup", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = await Otp.findOne({ email, codeHash: hash(req.body.otp), status: "sent", expiresAt: { $gt: new Date() } });
  if (!otp) return res.status(401).json({ message: "Invalid or expired OTP." });
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ message: "Account already exists. Please login." });
  const trialStartedAt = new Date();
  const trialEndsAt = addDays(60);
  const user = await User.create({
    name: req.body.name || "Shopkeeper",
    businessName: req.body.businessName || "VyapaarOS Shop",
    email,
    passwordHash: hash(req.body.password),
    businessType: req.body.businessType || "General",
    phone: req.body.phone || "",
    country: req.body.country || "India",
    state: req.body.state || "",
    city: req.body.city || "",
    gstNumber: req.body.gstNumber || "",
    businessAddress: req.body.businessAddress || "",
    accountStatus: "active",
    emailVerified: true,
    plan: "Free Trial",
    paymentStatus: "trial",
    trialStartedAt,
    trialEndsAt,
    role: email === ownerEmail ? "owner" : "shopkeeper",
  });
  const license = await License.create({ userId: user._id, plan: "Free Trial", status: "trial", trialEndsAt, maxDevices: 1 });
  await registerDevice(user._id, req.body.deviceId, req.body.platform);
  otp.status = "verified";
  await otp.save();
  res.json({ user: serializeUser(user), license });
}));

app.post("/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const passwordHash = hash(req.body.password);
  let user = await User.findOne({ email, passwordHash });
  if (!user && email === ownerEmail && ownerPassword && String(req.body.password) === ownerPassword) {
    await ensureOwnerAccount();
    user = await User.findOne({ email, passwordHash });
  }
  if (!user) return res.status(401).json({ message: "Invalid login details." });
  if (user.accountStatus === "blocked") return res.status(403).json({ message: "Your account has been temporarily blocked. Please contact the administrator." });
  if (user.accountStatus === "inactive") return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
  await registerDevice(user._id, req.body.deviceId, req.body.platform);
  user.lastLogin = new Date();
  await user.save();
  const license = await License.findOne({ userId: user._id });
  res.json({ user: serializeUser(user), license });
}));

app.post("/auth/login-otp", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = await Otp.findOne({ email, codeHash: hash(req.body.otp), status: "sent", expiresAt: { $gt: new Date() } });
  if (!otp) return res.status(401).json({ message: "Invalid or expired OTP." });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "No account found." });
  if (user.accountStatus === "blocked") return res.status(403).json({ message: "Your account has been temporarily blocked. Please contact the administrator." });
  if (user.accountStatus === "inactive") return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
  await registerDevice(user._id, req.body.deviceId, req.body.platform);
  user.lastLogin = new Date();
  await user.save();
  otp.status = "verified";
  await otp.save();
  const license = await License.findOne({ userId: user._id });
  res.json({ user: serializeUser(user), license });
}));

app.get("/admin/users", asyncRoute(async (_req, res) => res.json(await User.find().sort({ createdAt: -1 }))));
app.get("/admin/licenses", asyncRoute(async (_req, res) => res.json(await License.find().sort({ updatedAt: -1 }))));
app.get("/admin/devices", asyncRoute(async (_req, res) => res.json(await Device.find().sort({ lastSeenAt: -1 }))));
app.get("/admin/otps", asyncRoute(async (_req, res) => res.json(await Otp.find().sort({ createdAt: -1 }).limit(100))));
app.get("/admin/activity", asyncRoute(async (_req, res) => res.json(await Activity.find().sort({ createdAt: -1 }).limit(300))));
app.get("/admin/settings", asyncRoute(async (_req, res) => {
  const settings = await Setting.findOne({ key: "platform" });
  res.json(settings || {
    trialPeriodDays: 60,
    defaultPlan: "Free Trial",
    defaultDeviceLimit: 1,
    companyName: "Vyaapar OS",
    brandColor: "#1266a8",
    maintenanceMode: false,
    backupFrequency: "Daily",
  });
}));

app.post("/admin/users", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });
  if (await User.findOne({ email })) return res.status(409).json({ message: "User already exists." });
  const durationDays = Number(req.body.subscriptionDuration || 60);
  const trialStartedAt = new Date();
  const trialEndsAt = addDays(durationDays);
  const user = await User.create({
    name: req.body.name || "Shopkeeper",
    businessName: req.body.businessName || "New Business",
    email,
    passwordHash: hash(req.body.password || "123456"),
    phone: req.body.phone || "",
    businessType: req.body.businessType || "General",
    country: req.body.country || "India",
    state: req.body.state || "",
    city: req.body.city || "",
    gstNumber: req.body.gstNumber || "",
    businessAddress: req.body.businessAddress || "",
    notes: req.body.notes || "",
    accountStatus: req.body.accountStatus || "active",
    emailVerified: Boolean(req.body.emailVerified),
    plan: req.body.plan || "Free Trial",
    paymentStatus: req.body.plan === "Premium" ? "paid" : "trial",
    trialStartedAt,
    trialEndsAt,
    paidUntil: req.body.plan === "Premium" ? trialEndsAt : null,
    role: email === ownerEmail ? "owner" : "shopkeeper",
  });
  const license = await License.create({
    userId: user._id,
    plan: req.body.plan || "Free Trial",
    status: req.body.plan === "Premium" ? "paid" : "trial",
    trialEndsAt,
    paidUntil: req.body.plan === "Premium" ? trialEndsAt : null,
    maxDevices: Number(req.body.deviceLimit || 1),
  });
  await logActivity(req.body.adminName || "Super Admin", "Admin created a user", email);
  res.json({ user: serializeUser(user), license });
}));

app.patch("/admin/users/:id", asyncRoute(async (req, res) => {
  const patch = { ...req.body };
  delete patch.adminName;
  if (patch.password) {
    patch.passwordHash = hash(patch.password);
    delete patch.password;
  }
  if (patch.email) patch.email = String(patch.email).trim().toLowerCase();
  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  const license = await licenseForUser(user);
  await logActivity(req.body.adminName || "Super Admin", "Admin edited user", user.email);
  res.json({ user: serializeUser(user), license });
}));

app.delete("/admin/users/:id", asyncRoute(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  await User.deleteOne({ _id: user._id });
  await License.deleteMany({ userId: user._id });
  await Device.deleteMany({ userId: user._id });
  await logActivity(req.body?.adminName || "Super Admin", "Admin deleted a user and related cloud data", user.email);
  res.json({ ok: true });
}));

app.patch("/admin/users/:id/subscription", asyncRoute(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  const baseDate = user.paidUntil || user.trialEndsAt || new Date();
  const days = Number(req.body.days || 0);
  const nextDate = addDaysFrom(baseDate, days);
  user.paymentStatus = req.body.status || "paid";
  user.plan = req.body.plan || "Premium";
  user.paidUntil = nextDate;
  user.trialEndsAt = nextDate;
  await user.save();
  const license = await License.findOneAndUpdate(
    { userId: user._id },
    { plan: user.plan, status: user.paymentStatus, trialEndsAt: nextDate, paidUntil: nextDate },
    { upsert: true, new: true },
  );
  await logActivity(req.body.adminName || "Super Admin", `Admin changed subscription by ${days} days`, user.email);
  res.json({ user: serializeUser(user), license });
}));

app.patch("/admin/licenses/:userId", asyncRoute(async (req, res) => {
  const license = await License.findOneAndUpdate(
    { userId: req.params.userId },
    { ...req.body, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  await logActivity(req.body.adminName || "Super Admin", "Admin updated license", req.params.userId);
  res.json({ license });
}));

app.delete("/admin/devices/:deviceId", asyncRoute(async (req, res) => {
  const device = await Device.findOneAndDelete({ deviceId: req.params.deviceId });
  await logActivity(req.body?.adminName || "Super Admin", "Admin removed registered device", device?.userId || req.params.deviceId);
  res.json({ ok: true });
}));

app.put("/admin/settings", asyncRoute(async (req, res) => {
  const payload = { ...req.body };
  delete payload.adminName;
  const settings = await Setting.findOneAndUpdate({ key: "platform" }, { key: "platform", ...payload }, { upsert: true, new: true });
  await logActivity(req.body.adminName || "Super Admin", "Updated system settings", "Platform Settings");
  res.json({ settings });
}));

app.use((error, _req, res, _next) => {
  console.error("Cloud auth request failed:", error);
  res.status(500).json({ message: error?.message || "Cloud authentication server error." });
});

console.log(`Connecting to MongoDB database "${mongoDbName}"...`);

mongoose.connect(mongoUri, {
  dbName: mongoDbName,
  serverSelectionTimeoutMS: 10000,
}).then(async () => {
  await ensureOwnerAccount();
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`VyapaarOS cloud auth server running on port ${port}`);
  });
}).catch((error) => {
  console.error("Failed to start VyapaarOS cloud auth server:", error);
  process.exit(1);
});
