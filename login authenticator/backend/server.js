const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://YOUR_PAGES_DOMAIN.pages.dev",
    credentials: true
  })
);

const SESSION_COOKIE = "flowauth_session";
const PORT = process.env.PORT || 4000;

// ----- MongoDB connection -----

const MONGO_URI =
  "mongodb+srv://dhruvdabas200081_db_user:tUh9h5WfMGMSHVzy@cluster0.qymves8.mongodb.net/flowauth?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`FlowAuth backend running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// ----- User model -----

const userSchema = new mongoose.Schema({
  identity: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// ----- Helpers -----

function createSessionPayload(user) {
  return {
    id: user._id.toString(),
    identity: user.identity,
    loggedInAt: new Date().toISOString()
  };
}

function setSessionCookie(res, payload) {
  res.cookie(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: true
  });
}

function readSession(req) {
  const raw = req.cookies[SESSION_COOKIE];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ----- Routes -----

app.post("/api/register", async (req, res) => {
  try {
    const { identity, password } = req.body;

    if (!identity || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Please fill in all fields." });
    }

    const longEnough = password.length >= 8;
    const hasNumber = /\d/.test(password);

    if (!longEnough || !hasNumber) {
      return res.status(400).json({
        ok: false,
        message: "Password must be at least 8 characters and contain a number."
      });
    }

    const lowered = identity.toLowerCase();

    const existing = await User.findOne({
      identity: { $regex: new RegExp("^" + lowered + "$", "i") }
    });

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "An account with these details already exists."
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      identity,
      passwordHash: hash
    });

    return res.json({
      ok: true,
      message: "Account created. You can now log in."
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identity, password } = req.body;

    if (!identity || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Please fill in all fields." });
    }

    const lowered = identity.toLowerCase();

    const user = await User.findOne({
      identity: { $regex: new RegExp("^" + lowered + "$", "i") }
    });

    const valid =
      user && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) {
      return res.status(401).json({
        ok: false,
        message: "The details you entered do not match our records."
      });
    }

    const sessionPayload = createSessionPayload(user);
    setSessionCookie(res, sessionPayload);

    return res.json({ ok: true, message: "Login successful." });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
});

app.get("/api/me", async (req, res) => {
  try {
    const session = readSession(req);

    if (!session) {
      return res.status(401).json({ ok: false, message: "Not authenticated." });
    }

    const user = await User.findById(session.id).lean();

    if (!user) {
      return res.status(401).json({ ok: false, message: "Not authenticated." });
    }

    return res.json({
      ok: true,
      user: { identity: user.identity }
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE);
  return res.json({ ok: true, message: "Logged out." });
});