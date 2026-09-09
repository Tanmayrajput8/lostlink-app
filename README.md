# LostLink — Campus Lost & Found Management System

LostLink is a full-stack web application built to help college and university campuses manage lost and found items in one central place. Instead of relying on scattered WhatsApp groups, notice boards, or spreadsheets, students and staff can report lost items, post found items, browse a searchable catalog, and submit ownership claims that go through an admin verification workflow — all from a single web app.

The project is deliberately built as a **single Express MVC application** rather than a separate frontend/backend setup. There is no React, no Vite, no separate client server, and no CORS configuration to worry about, because the same Express server renders the HTML views and exposes the JSON API on one origin. This keeps the codebase approachable for a college project or a small internal tool, while still following a proper layered architecture (routes → controllers → models) that you'd find in a production app.

---

## Why it's structured this way

A lot of MERN-stack tutorials push you toward a React frontend talking to an Express API over two different ports, which means dealing with CORS headers, proxy configs, and two separate `npm start` processes just to see a page render. For a project of this scope, that adds friction without adding much value.

LostLink instead serves static HTML/CSS/JS from Express's `public` and `views` folders and hits its own API using relative paths like `/api/items`. One server, one port, one `npm run dev`, and the browser and the API are always same-origin. If the project ever needs to grow into a React or Next.js frontend later, the API layer underneath is already a clean, independent Express/Mongoose service that can be reused as-is.

---

## Core Features

**For students / regular users**
- Register and log in with a JWT-based auth system (passwords hashed with bcrypt, never stored in plain text)
- Report a lost item with a description, category, location, date, and optional photo
- Report a found item the same way, including a photo of the item itself
- Browse the full catalog of lost and found items with filters for category, status, and date range
- View item details in a modal without leaving the browse page
- Submit a claim on an item that isn't theirs to report, along with proof of ownership (photo, description, or matching details)
- Track the status of their own reported items and submitted claims from a personal dashboard
- Receive in-app notifications when a claim is approved, rejected, or when there's a match on something they reported

**For admins**
- A moderation dashboard separate from the regular user dashboard
- Approve or reject claims after reviewing the submitted proof
- Mark items as active, claimed, or resolved
- View platform-wide stats: total items reported, items resolved, pending claims, etc.
- Remove inappropriate or duplicate listings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Web framework | Express.js |
| Database | MongoDB (local or Atlas) |
| ODM | Mongoose |
| Auth | JSON Web Tokens (JWT) + bcrypt for password hashing |
| File uploads | Multer |
| Validation | express-validator (or equivalent, per validator files) |
| Frontend | Static HTML, vanilla CSS, vanilla JS (no framework, no build step) |

There's no bundler, no transpilation step, and no `node_modules`-heavy frontend tooling. The `public/js` files are plain ES modules loaded directly by the browser.

---

## Project Structure

```
LostLink/
│
├── config/
│   └── db.js                      # MongoDB connection logic (mongoose.connect, retry/error handling)
│
├── controllers/
│   ├── authController.js          # Register, login, JWT issuance, "get current user" endpoint
│   ├── itemController.js          # Create/read/update/delete items, dashboard stats, admin moderation
│   ├── claimController.js         # Submit claims, verification proof handling, admin approve/reject
│   └── notificationController.js  # Fetch and mark-as-read for in-app notifications
│
├── models/
│   ├── user.js                    # name, email, password (hashed), role (user/admin), timestamps
│   ├── items.js                   # title, description, category, status, location, images, reportedBy
│   ├── claim.js                   # itemRef, claimedBy, proofDetails, status, adminNote, audit timestamps
│   └── notification.js            # recipient, message, type, read flag, timestamps
│
├── routes/
│   ├── authroutes.js              # POST /api/auth/register, /api/auth/login, GET /api/auth/me
│   ├── itemroutes.js              # /api/items (CRUD + filters + stats)
│   ├── claimroutes.js             # /api/claims (submit, list, approve/reject)
│   └── notificationroutes.js      # /api/notifications
│
├── middleware/
│   ├── authMiddleware.js          # Verifies Bearer token, attaches req.user, adminOnly guard
│   └── uploadMiddleware.js        # Multer config for item photos and claim proof images
│
├── validators/
│   ├── authValidator.js           # Registration/login field validation
│   ├── itemValidator.js           # Item report field validation
│   └── claimValidator.js          # Claim submission field validation
│
├── public/
│   ├── css/
│   │   └── style.css              # Design system — colors, spacing, components, responsive layout
│   ├── js/
│   │   ├── api.js                 # fetch() wrapper: relative URLs, auto Bearer token injection, error handling
│   │   ├── auth.js                # Token storage, session checks, role-based UI gating
│   │   ├── validation.js          # Client-side form validation mirroring backend rules
│   │   └── main.js                # Toasts, image preview on upload, date/text formatting helpers
│   └── assets/                    # Icons, logos, placeholder images
│
├── views/
│   ├── index.html                 # Landing page — platform stats, recently reported items
│   ├── items.html                 # Full catalog with filters and a details modal
│   ├── login.html                 # Shared login for users and admins
│   ├── register.html              # New user sign-up
│   ├── report-lost.html           # Lost item report form
│   ├── report-found.html          # Found item report form
│   ├── dashboard.html             # User's own items/claims, or admin moderation panel by role
│   └── claim.html                 # Claim submission form with proof upload
│
├── uploads/                       # Stored item photos and claim proof images
├── app.js                         # Express app setup — middleware, static serving, view routes, API routes
├── server.js                      # Entry point — connects to MongoDB, starts the HTTP listener on port 5000
├── package.json
└── .env                           # Environment variables (see below)
```

---

## Getting Started

### 1. Prerequisites

- **Node.js** v18 or later
- **MongoDB** running locally at `mongodb://127.0.0.1:27017`, or a connection string to MongoDB Atlas

### 2. Clone and install

```bash
git clone <your-repo-url>
cd LostLink
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lostlink
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Don't commit `.env` to version control — it's already listed in `.gitignore` if you're using the default setup.

### 4. Run the app

```bash
npm run dev      # nodemon, auto-restarts on file changes
```

or for a plain production-style run:

```bash
npm start
```

### 5. Open it

Go to **http://localhost:5000** — the same server handles both the pages and the `/api/*` routes, so there's nothing else to start.

---

## API Overview

All API routes are mounted under `/api` and return JSON. Protected routes expect a `Bearer <token>` header, which `public/js/api.js` attaches automatically once a user is logged in.

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new user account | Public |
| POST | `/api/auth/login` | Log in, returns a JWT | Public |
| GET | `/api/auth/me` | Get the current logged-in user's profile | User |
| GET | `/api/items` | List items, supports query filters (category, status, search) | Public |
| POST | `/api/items` | Report a lost or found item (with optional photo) | User |
| GET | `/api/items/:id` | Get a single item's details | Public |
| PATCH | `/api/items/:id` | Update item status | User/Admin |
| DELETE | `/api/items/:id` | Remove a listing | Admin |
| GET | `/api/items/stats` | Aggregate stats for dashboards | Admin |
| POST | `/api/claims` | Submit a claim on an item with proof | User |
| GET | `/api/claims` | List claims (own claims for users, all for admins) | User/Admin |
| PATCH | `/api/claims/:id` | Approve or reject a claim | Admin |
| GET | `/api/notifications` | Get notifications for the logged-in user | User |
| PATCH | `/api/notifications/:id/read` | Mark a notification as read | User |

Exact field names and validation rules live in the corresponding `validators/` files — treat this table as a map of the surface area, not a full spec.

---

## Data Model Summary

- **User** — name, email (unique), hashed password, role (`user` or `admin`), created/updated timestamps.
- **Item** — title, description, category, type (`lost` or `found`), status (`active`, `claimed`, `resolved`), location, date reported, image path, reference to the reporting user.
- **Claim** — reference to the item, reference to the claiming user, proof details (text and/or uploaded image), status (`pending`, `approved`, `rejected`), admin note, timestamps for a basic audit trail.
- **Notification** — recipient reference, message text, type (e.g. `claim_update`, `item_match`), read flag, timestamp.

---

## Uploads

Item photos and claim proof images are handled by Multer and stored in the `uploads/` directory, served statically so the frontend can reference them directly by path. In a production deployment you'd swap this for S3, Cloudinary, or similar object storage — the Multer config is isolated in `middleware/uploadMiddleware.js` specifically so that swap doesn't touch the rest of the app.

---

## Notes on Scaling This Further

This structure is intentionally simple, but it doesn't paint you into a corner:

- Because the API is fully separated from the view-serving logic in `app.js`, you can later split the frontend into its own React/Vite app and point it at the same `/api` routes with minimal backend changes.
- The `role` field on the user model already distinguishes admins from regular users, so extending it to more roles (e.g. campus security, department moderators) is a matter of extending `authMiddleware.js` rather than rearchitecting anything.
- Notifications currently live in-app only; wiring up email or push notifications is additive — the `notificationController.js` is the single place that would need a new delivery method.

---

## License

This project is intended for educational and internal campus use. Add a license of your choice (MIT is a common default for student projects) before distributing it publicly.