import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/posts`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        console.log("Fetched posts:", data); // 🔍 Debug log
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, [API_URL]);

  return (
    <div className="p-2 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Blogs</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li
              key={post._id}
              className="border rounded-lg p-5 shadow-sm bg-white flex flex-col md:flex-row gap-4"
            >
              {/* Left side: text content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={post.author?.profileImage || "/default-avatar.png"}
                    alt={post.author?.username || "Author"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {post.author?.username || post.author?.email || "Unknown Author"}
                  </span>
                </div>

                <Link
                  to={`/dashboard/posts/${post._id}`}
                  className="block text-2xl font-bold text-gray-900 bg-clip-text"
                  style={{ color: "rgba(0, 0, 0, 0.85)" }}
                >
                  {post.title}
                </Link>

                <p className="text-gray-600 mt-2">
                  {post.content.substring(0, 150)}...
                </p>

                <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                  <span>❤️ {post.likes?.length || 0} Likes</span>
                  <span>💬 {post.comments?.length || 0} Comments</span>
                </div>
              </div>

              {/* Right side: post image */}
              {post.image && (
                <div className="w-full md:w-48 flex-shrink-0">
                  {console.log("Post image path:", post.image)} {/* 🔍 Debug each image */}
                  <img
                    alt={post.title}
                    className="w-full h-full object-cover rounded-lg"
                    src={`http://localhost:5000${post.image}`}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Posts;





