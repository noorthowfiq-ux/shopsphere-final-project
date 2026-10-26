# ShopSphere — MERN Stack E-Commerce Platform

A full-stack e-commerce web application built with the MERN stack, featuring product browsing, user authentication, shopping cart management, checkout, order tracking, and an admin dashboard.

## Features

### Customer Features
- Browse products with images, descriptions, prices, and stock availability
- Search, filter, and sort products
- View detailed product information
- Register and log in securely
- Add products to the shopping cart
- Update quantities and remove cart items
- Checkout with Cash on Delivery (COD)
- View order confirmation and order history
- Manage account profile information

### Admin Features
- Add, edit, and delete products
- Manage product inventory
- View and search customer orders
- Filter orders by status
- Update order statuses
- Access administrative features based on user roles

## Tech Stack

**Frontend**
- React
- Vite
- Axios
- Lucide React
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

## Project Structure

```text
ShopSphere/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

*Folder names may differ slightly depending on the final project structure.*







## API Overview

| Endpoint | Purpose |
|---|---|
| `/api/products` | Browse products |
| `/api/auth/register` | Register a user |
| `/api/auth/login` | Log in |
| `/api/auth/profile` | View or update the authenticated profile |
| `/api/cart` | Manage the shopping cart |
| `/api/orders` | Create and view orders |
| `/api/orders/admin/all` | View all orders as an administrator |

Protected endpoints require authentication. Administrative endpoints require appropriate admin permissions.

## Security

- Password hashing with bcryptjs
- JWT-based authentication
- Role-based authorization for administrative operations
- Environment variables for database credentials and JWT secrets
- Server-side validation and access control

## Future Improvements

- Online payment gateway integration
- Product reviews and ratings
- Product image upload
- Wishlist functionality
- Email notifications
- Deployment with production environment configuration

## Author

**Noor Thowfiq**

Full-Stack Development Project

## License

This project was created for educational and portfolio purposes. 
