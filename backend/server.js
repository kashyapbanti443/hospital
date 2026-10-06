const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const dotenv = require("dotenv");

// dotenv.config();

// const app = require("./app");
// const connectDB = require("./config/db");

// const PORT = process.env.PORT || 3000;

// // MongoDB connection
// connectDB();

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
