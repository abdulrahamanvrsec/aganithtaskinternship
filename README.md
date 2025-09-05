# 📚 Book Finder

[![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)  
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)  
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)  
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)  
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)  

> A modern, responsive **Book Finder web app** built with **React (Vite)** + **TailwindCSS**, powered by the **Open Library API**, and deployed on **Vercel**.  

---

## 🚀 Features
- 🔎 Search books by **title** using the Open Library API  
- 📖 Shows **title, author(s), first publish year, and cover image**  
- 🎨 Clean UI with **TailwindCSS** (responsive grid layout)  
- ⚡ **Dynamic background theme** → gradient after results are fetched  
- ⌨️ **Keyboard support** (press Enter to search)  
- 🎭 Handles **errors**: empty input, missing data, no results, network issues  
- 📱 Fully **responsive design** (desktop → mobile)  

---

## 🛠️ Tech Stack
- **Frontend Framework:** [React (Vite)](https://vitejs.dev/)  
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
- **Data Source:** [Open Library API](https://openlibrary.org/dev/docs/api/search)  
- **Deployment:** [Vercel](https://vercel.com/)  

---

## ⚡ API Usage
**Search Endpoint:**
```bash
https://openlibrary.org/search.json?title={bookTitle}


🎥 Demo

🔗 Video Walkthrough: https://drive.google.com/file/d/1s9LZw3vxaWn008luTD7129f39oONJVzh/view?usp=sharing

🔗 Live App on Vercel: https://aganithtaskinternship-9k3a.vercel.app/

🔧 Installation & Setup
# 1. Clone the repo
git clone https://github.com/your-username/book-finder.git
cd book-finder

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Build for production
npm run build

👉 App runs at:

http://localhost:5173


🌍 Deployment (Vercel)

The app is live on Vercel 🚀

Deploy Steps:
# Build project
npm run build

# Deploy with Vercel CLI
vercel --prod


🧪 Edge Cases Tested

✅ Empty input → ignored gracefully

✅ Special characters / emojis in query

✅ Very long queries → handled properly

✅ Large result sets → limited to 12 books

✅ Missing cover → fallback image

✅ Missing author → “Unknown Author”

✅ Missing year → “N/A”

✅ Network error → error message

✅ Case-insensitive search works

✅ Works on mobile, tablet, and desktop


📌 Project Structure
book-finder/
│── public/
│   └── banner.jpeg        # Banner image
│── src/
│   ├── App.jsx            # Main app
│   ├── index.css          # Tailwind imports
│   └── main.jsx           # React entry
│── tailwind.config.js     # Tailwind config
│── postcss.config.js      # PostCSS config
│── vite.config.js         # Vite config
│── package.json
└── README.md


✨ Future Improvements

📑 Pagination for large queries

🌙 Dark mode toggle

🔖 Save favorites (LocalStorage)

🔍 Advanced filters (author, year, language)

📚 Book detail page with extended info
