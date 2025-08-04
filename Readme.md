```markdown
# 🛍️ ATH - E-Commerce Web Application

ATH is a full-featured, secure, and scalable e-commerce web application built using Node.js, Express.js, MongoDB, and EJS.
It follows the MVC+ architecture, integrates modern tools like Razorpay for payments and Passport.js for authentication, and includes powerful features like invoice generation, image cropping, and Excel/CSV reporting.

---

## 📁 Project Structure

```
project\ath/
├── config/           # Config files (DB, sessions, passport, etc.)
├── constants/        # Static values like messages, HTTP codes
├── controller/       # All route handler logic (controllers)
├── middle-ware/      # Custom Express middlewares
├── models/           # Mongoose schemas for DB collections

├── public/           # Static files (images, CSS, JS)
├── routes/           # Route files (admin-routes.js, user-routes.js)
├── service/          # External services (e.g. Razorpay, Mail)
├── utils/            # Utility functions/helpers
├── views/            # EJS templates
├── .env              # Environment variables
├── app.js            # Main Express application entry point
````


## 🚀 Features

- 🔐 User Authentication
  - Local login/signup with password encryption (bcrypt)
  - Google & Facebook OAuth via Passport.js

- 🛒 E-Commerce Essentials
  - Product listing, filtering, sorting, and searching
  - Cart, Wishlist, Orders, and Referral to Wallet
  - Razorpay payment integration

- 📄 Reports & Exports
  - PDF invoices using PDFKit
  - CSV/Excel export using `json2csv` and `exceljs`

- 🧾 Admin Panel
  - Dashboard analytics
  - Product/category management
  - Coupon & banner controls

- 📸 Image Handling
  - Cropping (CropperJS)
  - Multer for uploads

- 📊 Security & Performance
  - Rate limiting
  - XSS protection
  - MongoDB sanitization
  - Session management

---

## ⚙️ Tech Stack

| Category      | Tools / Libraries                             |
|---------------|-----------------------------------------------|
| Backend       | Node.js, Express.js                           |
| Frontend      | EJS, Bootstrap 5, CropperJS                   |
| Database      | MongoDB, Mongoose                             |
| Auth & Authz  | Passport.js (Google, Facebook), bcrypt        |
| Payments      | Razorpay                                      |
| File Handling | Multer, PDFKit, ExcelJS, json2csv             |
| Security      | express-rate-limit, xss-clean, mongo-sanitize |
| Deployment    | Environment-ready with dotenv, nodemon        |

---

## 🛠️ Setup & Installation

### 1. Clone the Repo
```bash
git clone https://github.com/vsVINEETH/ath.git
cd project_ath
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file and add:

```env
PORT=3000
MONGODB_URI=your-mongodb-uri
SESSION_SECRET=your-session-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

### 4. Run the App

```bash
npm start
```

Visit: `http://localhost:3000`

---

## 📦 API Endpoints

| Route              | Description             |
| ------------------ | ----------------------- |
| `/`                | Landing page            |
| `/login`           | User login              |
| `/user_signup`     | User signup             |
| `/product/:id`     | Product detail page     |
| `/cart`            | Cart page               |
| `/admin/dashboard` | Admin panel             |
| `/api/export`      | Download invoice/report |

> More routes are defined under `routes/admin-routes.js` and `routes/user-routes.js`.

---

## 🧠 Author

* **Vineeth V S**
  Passionate Full Stack Developer | Clean Coder | Architecting Scalable Solutions
  [GitHub](https://github.com/vsVineeth) | [LinkedIn](linkedin.com/in/vineethvs1927)

---

## 📄 License

This project is licensed under the **ISC License**.

## 📌 Notes

* This project follows **MVC+ structure** with proper separation of concerns.

