import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardNavbar from "./Navbar";
import CreatePost from "./pages/createPost";
import PostsList from "./pages/posts";
import PostDetail from "./pages/PostDetail"; // matches the file name exactly

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="p-6">
        <Routes>
          {/* Default route - redirect to posts */}
          <Route path="/" element={<PostsList />} />

          <Route path="create-post" element={<CreatePost />} />
          <Route path="posts" element={<PostsList />} />
          <Route path="posts/:id" element={<PostDetail />} /> {/* new route */}

          {/* Optional: catch-all route to redirect to posts */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

export default Home;



