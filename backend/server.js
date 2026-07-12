const { setDefaultResultOrder } = require("dns");
setDefaultResultOrder("ipv4first");


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://college-placement-portal-hvasai9j5-career-connect1.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

// Routes
const authRoutes         = require("./routes/auth.routes");
const studentRoutes      = require("./routes/student.routes");
const companyRoutes      = require("./routes/company.routes");
const opportunityRoutes  = require("./routes/opportunity.routes");
const applicationRoutes  = require("./routes/application.routes");
const dashboardRoutes    = require("./routes/dashboard.routes");
const notificationRoutes = require("./routes/notification.routes");

app.use("/users",             authRoutes);
app.use("/students",          studentRoutes);
app.use("/companies",         companyRoutes);
app.use("/opportunities",     opportunityRoutes);
app.use("/applications",      applicationRoutes);
app.use("/dashboard",         dashboardRoutes);
app.use("/users/notifications", notificationRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CareerConnect API running"});
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`CareerConnect API running on port ${PORT}`);
  });
}

module.exports = app;