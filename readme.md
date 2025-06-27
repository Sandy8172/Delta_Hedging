# 📈 Real-Time Options Streamer

A full-stack real-time options data streamer built with:

- ⚡ Express + Socket.IO (backend)
- ⚛️ React + Vite (frontend)
- 📦 CSV-based tick data simulation
- 🔥 Live quantity updates with PnL tracking
- 📱 Optional PWA support

---

## 🚀 Features

- Real-time streaming of option strikes via `Socket.IO`
- User-level tracking of quantity and value changes
- LocalStorage-based history and PnL calculations
- Dynamic strike subscriptions/unsubscriptions
- Responsive UI with LTP calculations and total rows
- Optional service worker control for clean builds

---

## 📁 Project Structure

├── client/ # React + Vite frontend
│ ├── src/
│ ├── index.html
│ └── ...
├── server/ # Express backend
│ └── index.js
├── client/dist/ # Frontend production build output
├── README.md
└── package.json # Root scripts and dependencies

---

## ⚙️ Setup Instructions

### 1. 📦 Install All Dependencies

```bash
npm run setup
```

---


## 📬 Contact

Made with ❤️ by Sandeep Singh
Feel free to contribute, fork, or ask questions.


Let me know if you'd like to add:
- Screenshots
- Demo GIFs
- Additional features
- Bug fixes
- Documentation improvements
- Environment variable setup
- Deployment instructions (e.g., on Vercel or Railway)
