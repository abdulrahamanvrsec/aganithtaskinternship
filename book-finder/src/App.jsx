// import { useState } from "react";

// function App() {
//   const [query, setQuery] = useState("");
//   const [books, setBooks] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const searchBooks = async () => {
//     if (!query.trim()) return;
//     setLoading(true);
//     setError("");
//     setBooks([]);
//     try {
//       const res = await fetch(
//         `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}`
//       );
//       const data = await res.json();
//       if (!data.docs || data.docs.length === 0) {
//         setError("No books found!");
//       } else {
//         setBooks(data.docs.slice(0, 12)); // show 12 results
//       }
//     } catch (err) {
//       setError("Something went wrong. Please try again.");
//     }
//     setLoading(false);
//   };

//   // ✅ Trigger search on Enter key
//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       searchBooks();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center">
//       {/* ✅ Banner Section */}
//       <div
//         className="w-full h-[300px] bg-cover bg-center"
//         style={{ backgroundImage: "url('/banner.jpeg')" }}
//       ></div>

//       {/* ✅ Title & Description */}
//       <div className="text-center px-6 mt-8">
//         <h1 className="text-5xl font-extrabold mb-4 text-gray-900 drop-shadow">
//           BookFinder
//         </h1>
//         <p className="text-lg max-w-2xl mx-auto text-gray-700">
//           Discover Your Next Literary Adventure <br />
//           Explore millions of books from around the world with our intelligent
//           search engine.
//         </p>
//         <div className="flex justify-center gap-8 text-sm font-medium mt-6 text-gray-800">
//           <p>
//             <span className="font-bold">1M+</span> Books
//           </p>
//           <p>
//             <span className="font-bold">100K+</span> Authors
//           </p>
//           <p>
//             <span className="font-bold">50+</span> Languages
//           </p>
//         </div>
//       </div>

//       {/* ✅ Modern Search Box */}
//       <div className="flex justify-center px-4 mt-12 mb-10 w-full">
//         <div className="w-full max-w-3xl flex items-center bg-white bg-opacity-90 backdrop-blur-md rounded-full shadow-xl p-4 transition transform hover:scale-[1.01]">
//           <input
//             type="text"
//             placeholder="🔎 Search for your next favorite book..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             onKeyDown={handleKeyDown}
//             className="flex-1 px-6 py-5 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-lg rounded-full"
//           />

//           {/* ✅ Uiverse.io Button */}
//           <button
//             type="button"
//             onClick={searchBooks}
//             className="[--background:#000000] [--color:#ffffff] [--muted:#242424] [--muted-foreground:#9c9c9c] [--border:#2e2e2e] relative inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[--border] bg-[--background] hover:bg-[--muted] text-[--muted-foreground] hover:text-[--color] px-6 py-4 justify-center rounded-full text-base font-medium shadow-md h-12 w-40 ml-4"
//           >
//             <span className="hidden lg:inline-flex">Search Books</span>
//             <span className="inline-flex lg:hidden">Search</span>
//             <kbd className="pointer-events-none absolute right-2 top-2 flex h-5 select-none items-center gap-1 rounded border border-[--border] bg-[--muted] px-1.5 font-mono text-[10px] font-medium opacity-100 [&_span]:text-xs">
            
//             </kbd>
//           </button>
//         </div>
//       </div>

//       {/* ✅ Messages */}
//       {loading && <p className="text-gray-600 text-lg mb-6">🔍 Searching...</p>}
//       {error && <p className="text-red-500 text-lg mb-6">{error}</p>}

//       {/* ✅ Results */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6 w-full max-w-6xl px-4">
//         {books.map((book, idx) => (
//           <div
//             key={idx}
//             className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 flex flex-col items-center text-center transition transform hover:scale-105"
//           >
//             <img
//               src={
//                 book.cover_i
//                   ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
//                   : "/banner.jpeg" // fallback
//               }
//               alt={book.title}
//               className="w-36 h-52 object-cover mb-4 rounded-lg shadow-md"
//             />
//             <h2 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
//               {book.title}
//             </h2>
//             <p className="text-sm text-gray-600 mb-1">
//               {book.author_name
//                 ? book.author_name.join(", ")
//                 : "Unknown Author"}
//             </p>
//             <p className="text-sm text-gray-500">
//               First Published: {book.first_publish_year || "N/A"}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;



import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchBooks = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setBooks([]);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!data.docs || data.docs.length === 0) {
        setError("No books found!");
      } else {
        setBooks(data.docs.slice(0, 12)); // show 12 results
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  // ✅ Trigger search on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchBooks();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center transition-colors duration-700 
      ${
        books.length > 0
          ? "bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200"
          : "bg-white"
      }`}
    >
      {/* ✅ Banner Section */}
      <div
        className="w-full h-[300px] bg-cover bg-center"
        style={{ backgroundImage: "url('/banner.jpeg')" }}
      ></div>

      {/* ✅ Title & Description */}
      <div className="text-center px-6 mt-8">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-900 drop-shadow">
          BookFinder
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-700">
          Discover Your Next Literary Adventure <br />
          Explore millions of books from around the world with our intelligent
          search engine.
        </p>
        <div className="flex justify-center gap-8 text-sm font-medium mt-6 text-gray-800">
          <p>
            <span className="font-bold">1M+</span> Books
          </p>
          <p>
            <span className="font-bold">100K+</span> Authors
          </p>
          <p>
            <span className="font-bold">50+</span> Languages
          </p>
        </div>
      </div>

      {/* ✅ Modern Search Box */}
      <div className="flex justify-center px-4 mt-12 mb-10 w-full">
        <div className="w-full max-w-3xl flex items-center bg-white bg-opacity-90 backdrop-blur-md rounded-full shadow-xl p-4 transition transform hover:scale-[1.01]">
          <input
            type="text"
            placeholder="🔎 Search for your next favorite book..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-6 py-5 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-lg rounded-full"
          />

          <button
            type="button"
            onClick={searchBooks}
            className="[--background:#000000] [--color:#ffffff] [--muted:#242424] [--muted-foreground:#9c9c9c] [--border:#2e2e2e] relative inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[--border] bg-[--background] hover:bg-[--muted] text-[--muted-foreground] hover:text-[--color] px-6 py-4 justify-center rounded-full text-base font-medium shadow-md h-12 w-40 ml-4"
          >
            <span className="hidden lg:inline-flex">Search Books</span>
            <span className="inline-flex lg:hidden">Search</span>
          </button>
        </div>
      </div>

      {/* ✅ Messages */}
      {loading && <p className="text-gray-600 text-lg mb-6">🔍 Searching...</p>}
      {error && <p className="text-red-500 text-lg mb-6">{error}</p>}

      {/* ✅ Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6 w-full max-w-6xl px-4">
        {books.map((book, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 flex flex-col items-center text-center transition transform hover:scale-105"
          >
            <img
              src={
                book.cover_i
                  ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                  : "/banner.jpeg"
              }
              alt={book.title}
              className="w-36 h-52 object-cover mb-4 rounded-lg shadow-md"
            />
            <h2 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
              {book.title}
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              {book.author_name
                ? book.author_name.join(", ")
                : "Unknown Author"}
            </p>
            <p className="text-sm text-gray-500">
              First Published: {book.first_publish_year || "N/A"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
