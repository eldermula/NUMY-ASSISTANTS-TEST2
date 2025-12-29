require("dotenv").config();
const express = require("express");
const cors = require("cors");
const taskRoutes = require("./routes/tasks");
const pageRoutes = require("./routes/pages");

const authRoutes = require("./routes/auth");
const orgRoutes = require("./routes/orgs");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, service: "NA Systems API" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pages", pageRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NA Systems running on port ${PORT}`);
});
