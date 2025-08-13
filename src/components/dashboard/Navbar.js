import React from "react";
import { FiSearch, FiMessageSquare, FiBell, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const DashboardNavbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <div
          className="text-black text-3xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontWeight: 700,
          }}
        >
          <span className="backdrop-blur-sm px-2 py-1 rounded">
            JustBlog
          </span>
        </div>

      {/* Search Bar */}
      <div className="flex items-center w-full max-w-md mx-4 bg-gray-100 rounded-full px-3 py-1">
        <FiSearch className="text-gray-500 mr-2" size={18} />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none w-full text-sm"
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-6">
      <div
          className="flex items-center space-x-1 cursor-pointer hover:text-blue-500 transition"
          onClick={() => navigate("/write")}
        >
          <FiMessageSquare size={20} />
          <span className="text-sm font-medium">Write</span>
        </div>
        <FiBell size={20} className="cursor-pointer hover:text-blue-500 transition" />
        <FiUser size={20} className="cursor-pointer hover:text-blue-500 transition" />
      </div>
    </nav>
  );
};

export default DashboardNavbar;
