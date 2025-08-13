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
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, [API_URL]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Blogs</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li
              key={post._id}
              className="border rounded-lg p-5 shadow-sm bg-white"
            >
              {/* Author info */}
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

              {/* Title */}
              <Link
                to={`/dashboard/posts/${post._id}`}
                className="block text-2xl font-bold text-gray-900 bg-clip-text"
                style={{ color: "rgba(0, 0, 0, 0.85)" }}
              >
                {post.title}
              </Link>

              {/* Excerpt */}
              <p className="text-gray-600 mt-2">{post.content.substring(0, 150)}...</p>

              {/* Likes and comments */}
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                <span>❤️ {post.likes?.length || 0} Likes</span>
                <span>💬 {post.comments?.length || 0} Comments</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Posts;


