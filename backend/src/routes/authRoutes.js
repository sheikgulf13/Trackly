const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const allowRoles = require("../middlewares/role");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.get("/admin-data", protect, allowRoles("Admin"), (req, res) => {
  res.json({ message: "Welcome, admin!" });
});


module.exports = router;