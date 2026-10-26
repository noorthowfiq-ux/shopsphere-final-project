
const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Customer routes
router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);

// Admin-only routes
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.patch("/admin/:id/status", protect, adminOnly, updateOrderStatus);

// Customer can view only their own order
router.get("/:id", protect, getOrderById);

module.exports = router;
