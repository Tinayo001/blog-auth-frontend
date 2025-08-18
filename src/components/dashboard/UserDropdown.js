import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="cursor-pointer hover:text-blue-500 transition"
        onClick={() => setOpen(!open)}
      >
        User
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white justify-center shadow-lg rounded-md border border-gray-200 overflow-hidden z-50">
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => navigate("/dashboard/profile")}
          >
            Profile
          </button>

          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => navigate("/stories")}
          >
            Stories
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
            onClick={() => console.log("Logout")}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
