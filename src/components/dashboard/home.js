import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardNavbar from "./Navbar";
import CreatePost from "./pages/createPost";
import PostsList from "./pages/posts";
import PostDetail from "./pages/PostDetail";
import ProfilePage from "./pages/ProfilePage";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <DashboardNavbar />
      <hr className="border-gray-200 mb-6" /> {/* Full-width line */}
      <div className="p-6 max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<PostsList />} />
          <Route path="create-post" element={<CreatePost />} />
          <Route path="posts" element={<PostsList />} />
          <Route path="posts/:id" element={<PostDetail />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

export default Home;





