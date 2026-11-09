# 🛒eCommerce - Advanced Multi-Variant Store

A high-performance, full-stack eCommerce platform built with the **MERN Stack** (MongoDB, Express, React, Node.js). This project features a sophisticated **Multi-Variant Inventory System** designed to handle complex product SKUs like apparel (Shirts, Pants) with specific attributes per variant.

## 🚀 Key Features

### 🔹 Advanced Product Management
- **Multi-Variant Logic:** Support for multiple colors and sizes per product.
- **Granular Control:** Each variant (e.g., Red/Medium) has its own specific Price, Cost Price, Discount, Stock, and Images.
- **Smart Inventory:** Frontend visual cues for "Out of Stock" items (strike-through logic) that dynamically update based on variant selection.

### 🔹 Dynamic Media Handling
- **Multer Integration:** Intelligent backend processing using `upload.any()` to handle dynamic file fields.
- **Multiple Image Previews:** Real-time image preview and removal during product creation.
- **Variant-Specific Carousels:** Dynamic image switching on the product detail page based on the selected color.

### 🔹 Seamless UX/UI
- **Responsive Design:** Fully optimized for mobile and desktop using Tailwind CSS.
- **State Management:** Robust data flow with Redux Toolkit.
- **Clean UI:** Professional dashboard and product showcase with smart search and filtering.

## 🛠️ Tech Stack
- **Frontend:** React.js, Redux Toolkit, Tailwind CSS, React Hot Toast.
- **Backend:** Node.js, Express.js, Multer (Media).
- **Database:** MongoDB (Mongoose ODM).

## ⚙️ Installation & Setup
1. Clone the repository: `git clone https://github.com/yourusername/ecommerce-store.git`
2. Install Server dependencies: `cd server && npm install`
3. Install Client dependencies: `cd client && npm install`
4. Setup `.env` for MongoDB URI and Port.
5. Run Debug mode: `npm run debug` (Server) & `npm start` (Client).
