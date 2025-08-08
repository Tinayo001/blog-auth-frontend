import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-black px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <div className="text-black font-bold text-2xl pl-6">
        Tinayo
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-4 items-center">
        <button className="text-zinc-900 text-sm hover:underline">
          Our Story
        </button>
        <button className="text-zinc-900 text-sm hover:underline">
          Membership
        </button>
        <button className="text-zinc-900 text-sm hover:underline">
          Write
        </button>
        <Link
          to="/login"
          className="text-black font-medium hover:underline"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="bg-black text-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

