import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   ALLOW IFRAME EMBEDDING (IMPORTANT)
===================================================== */
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

/* =====================================================
   BOT BLOCK
===================================================== */
const blockedBots = [
  "bot","crawl","spider","slurp","bing","ahrefs","semrush",
  "facebookexternalhit","python-requests","curl","wget","java","headless"
];

app.use((req, res, next) => {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (blockedBots.some(b => ua.includes(b))) {
    return res.status(403).send("Bots not allowed");
  }
  next();
});

/* =====================================================
   ACCESS CONTROL (BLOCK DIRECT ACCESS COMPLETELY)
===================================================== */

const ALLOWED_ORIGIN = "https://yogamasterja.shop";

app.use((req, res, next) => {

  // Allow static files (CSS/JS/images/videos/MP4)
  if (
    req.path.startsWith("/css/") ||
    req.path.startsWith("/js/") ||
    req.path.startsWith("/images/") ||
    req.path.startsWith("/videos/") ||
    req.path.endsWith(".mp4")
  ) {
    return next();
  }

  // Allow loader API
  if (req.path === "/frontend-loader") return next();

  // Read referer
  const referer = (req.headers.referer || "").toLowerCase();

  // If inside iframe from decamour.shop → ALLOW
  if (referer.startsWith(ALLOWED_ORIGIN.toLowerCase())) {
    return next();
  }

  // Direct ?loader=true access → BLOCK
  if (req.query.loader === "true") {
    return res.status(403).send("Direct loader access blocked");
  }

  // BLOCK EVERYTHING ELSE
  return res.status(403).send("Direct access not allowed");
});

/* =====================================================
   FRONTEND LOADER — JAPAN ONLY
===================================================== */

app.get("/frontend-loader", (req, res) => {
  const tzRaw = req.headers["x-client-timezone"] || "";
  const tz = tzRaw.toLowerCase();

  const allowedTZ = [
    "asia/calcutta"
  ];

  if (!allowedTZ.includes(tz)) {
    return res.json({
      allowed: false,
      frontloader: false,
      error: "Timezone blocked"
    });
  }

  return res.json({
    allowed: true,
    frontloader: true
  });
});

/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =====================================================
   START
===================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
