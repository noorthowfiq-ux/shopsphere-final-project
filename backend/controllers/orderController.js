
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Create a new order from the logged-in user's cart
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      fullName,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      paymentMethod = "COD",
    } = req.body;

    // Validate delivery details
    const shippingFields = {
      fullName,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
    };

    for (const [field, value] of Object.entries(shippingFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Only Cash on Delivery (COD) is currently supported",
      });
    }

    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id })
        .populate("items.product")
        .session(session);

      if (!cart || cart.items.length === 0) {
        const error = new Error("Your cart is empty");
        error.statusCode = 400;
        throw error;
      }

      const orderItems = [];
      let itemsPrice = 0;

      // Validate stock and reserve inventory safely
      for (const item of cart.items) {
        const product = item.product;

        if (!product) {
          const error = new Error("A product in your cart no longer exists");
          error.statusCode = 400;
          throw error;
        }

        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!updatedProduct) {
          const error = new Error(
            `Insufficient stock for ${product.name}. Please update your cart.`
          );
          error.statusCode = 400;
          throw error;
        }

        const price = updatedProduct.price;
        const subtotal = price * item.quantity;

        itemsPrice += subtotal;

        orderItems.push({
          product: updatedProduct._id,
          name: updatedProduct.name,
          image: updatedProduct.image,
          price,
          quantity: item.quantity,
        });
      }

      const shippingPrice = 0;

      const orders = await Order.create(
        [
          {
            user: req.user._id,
            items: orderItems,
            shippingAddress: {
              fullName: fullName.trim(),
              phone: phone.trim(),
              address: address.trim(),
              city: city.trim(),
              state: state.trim(),
              postalCode: postalCode.trim(),
              country: country.trim(),
            },
            paymentMethod: "COD",
            itemsPrice,
            shippingPrice,
            totalPrice: itemsPrice + shippingPrice,
            paymentStatus: "Pending",
            orderStatus: "Placed",
          },
        ],
        { session }
      );

      createdOrder = orders[0];

      await Cart.updateOne(
        { user: req.user._id },
        { $set: { items: [] } },
        { session }
      );
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : "Failed to place order. Please try again.",
    });
  } finally {
    await session.endSession();
  }
};

// Get orders belonging to the logged-in user
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
    });
  }
};

// Get one order, only if it belongs to the logged-in user
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

 // Admin: retrieve all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch all orders",
    });
  }
};

// Admin: update an order's status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "Placed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "A cancelled order cannot be updated",
      });
    }

    if (order.orderStatus === "Delivered" && orderStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "A delivered order cannot be changed",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};

