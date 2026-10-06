

const express = require("express");
const router = express.Router();


const {
  RegisterUser, Login, getUser, getUserById, deleteUser
} = require("../controllers/UserController");

const authMiddleware = require("../middleware/AuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");



router.get("/", authMiddleware, roleMiddleware("Admin"), getUser);
router.get("/:id", authMiddleware, roleMiddleware("Admin"), getUserById);
router.post("/register", RegisterUser);
router.post("/login", Login);

// Admin Only Route

router.delete("/:id",authMiddleware, roleMiddleware("Admin"),deleteUser);

module.exports = router;


