require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

// Connect to MongoDB database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`LostLink backend server running on http://localhost:${PORT}`);
});