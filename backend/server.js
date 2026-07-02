const { setDefaultResultOrder } = require("dns");
setDefaultResultOrder("ipv4first");


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",  // your Vite frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

// Routes
const authRoutes        = require("./routes/auth.routes");
const studentRoutes     = require("./routes/student.routes");
const companyRoutes     = require("./routes/company.routes");
const opportunityRoutes = require("./routes/opportunity.routes");
const applicationRoutes = require("./routes/application.routes");
const dashboardRoutes   = require("./routes/dashboard.routes");

app.use("/users",        authRoutes);
app.use("/students",     studentRoutes);
app.use("/companies",    companyRoutes);
app.use("/opportunities",opportunityRoutes);
app.use("/applications", applicationRoutes);
app.use("/dashboard",    dashboardRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CareerConnect API running"});
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`CareerConnect API running on port ${PORT}`);
});