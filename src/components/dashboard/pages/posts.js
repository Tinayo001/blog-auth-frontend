import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [hasLikedMap, setHasLikedMap] = useState({});
  const [isTogglingLikeMap, setIsTogglingLikeMap] = useState({});
  const [showLikePopupMap, setShowLikePopupMap] = useState({});
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/posts`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch posts");
        }
        const data = await res.json();
        console.log("Fetched posts:", data);
        setPosts(data);

        const token = localStorage.getItem("accessToken");
        if (token) {
          const likeStatusPromises = data.map(async (post) => {
            if (!isValidObjectId(post._id)) {
              console.error(`Invalid post ID: ${post._id}`);
              return { postId: post._id, hasLiked: false };
            }
            try {
              const res = await fetch(`${API_URL}/likes/${post._id}/user`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const { hasLiked } = await res.json();
                return { postId: post._id, hasLiked };
              }
              return { postId: post._id, hasLiked: false };
            } catch (err) {
              console.error(`Error fetching like status for post ${post._id}:`, err);
              return { postId: post._id, hasLiked: false };
            }
          });
          const likeStatuses = await Promise.all(likeStatusPromises);
          const likeStatusMap = likeStatuses.reduce((acc, { postId, hasLiked }) => {
            acc[postId] = hasLiked;
            return acc;
          }, {});
          setHasLikedMap(likeStatusMap);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        alert(`Error: ${err.message}`);
      }
    };
    fetchPosts();
  }, [API_URL]);

  const handleToggleLike = async (postId) => {
    if (isTogglingLikeMap[postId]) return;
    console.log("Toggling like for postId:", postId);
    if (!isValidObjectId(postId)) {
      alert("Invalid post ID");
      return;
    }
    setIsTogglingLikeMap((prev) => ({ ...prev, [postId]: true }));

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to like/unlike");
        setIsTogglingLikeMap((prev) => ({ ...prev, [postId]: false }));
        return;
      }

      const newHasLiked = !hasLikedMap[postId];
      setHasLikedMap((prev) => ({ ...prev, [postId]: newHasLiked }));
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likesCount: Math.max(0, (post.likesCount || 0) + (newHasLiked ? 1 : -1)),
              }
            : post
        )
      );
      setShowLikePopupMap((prev) => ({ ...prev, [postId]: newHasLiked ? "+1" : "-1" }));
      setTimeout(() => setShowLikePopupMap((prev) => ({ ...prev, [postId]: null })), 1000);

      const url = `${API_URL}/likes/${postId}`;
      const options = {
        method: newHasLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      if (newHasLiked) {
        options.body = JSON.stringify({ postId });
      }

      const res = await fetch(url, options);

      if (!res.ok) {
        setHasLikedMap((prev) => ({ ...prev, [postId]: !newHasLiked }));
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likesCount: Math.max(0, (post.likesCount || 0) + (newHasLiked ? -1 : 1)),
                }
              : post
          )
        );
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${newHasLiked ? "like" : "unlike"} post`);
      }
    } catch (error) {
      console.error(`Error ${hasLikedMap[postId] ? "unliking" : "liking"} post:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTogglingLikeMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

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

                <p className="text-gray-600 mt-2">{post.content.substring(0, 150)}...</p>

                <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                  <div className="relative">
                    <button
                      onClick={() => handleToggleLike(post._id)}
                      disabled={isTogglingLikeMap[post._id]}
                      className={`flex items-center gap-1 text-lg ${
                        hasLikedMap[post._id]
                          ? "text-gray-500 hover:text-gray-700"
                          : "text-gray-500 hover:text-gray-700 opacity-50"
                      } ${isTogglingLikeMap[post._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {hasLikedMap[post._id] ? <AiFillHeart /> : <AiOutlineHeart />}
                      <span>{post.likesCount || 0}</span>
                    </button>
                    {showLikePopupMap[post._id] && (
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-popup">
                        {showLikePopupMap[post._id]}
                      </span>
                    )}
                  </div>
                  <span
                    className="flex items-center gap-1 cursor-pointer hover:underline"
                    onClick={() => console.log("Comments clicked")} // Placeholder
                  >
                    <FaComment
                      className={`text-lg ${
                        (post.comments?.length || 0) > 0
                          ? "text-gray-500 hover:text-gray-700"
                          : "text-gray-500 hover:text-gray-700 opacity-50"
                      }`}
                    />
                    {post.comments?.length || 0}
                  </span>
                </div>
              </div>

              {post.image && (
                <div className="w-full md:w-48 flex-shrink-0">
                  {console.log("Post image path:", post.image)}
                  <img
                    alt={post.title}
                    className="w-full h-full object-cover rounded-lg"
                    src={`http://localhost:5000${post.image}`}
                    onError={(e) => {
                      e.target.src = "/default-image.png";
                      console.error("Failed to load image:", e.target.src);
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <style>
        {`
          .animate-popup {
            animation: popup 1s ease-out forwards;
          }
          @keyframes popup {
            0% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
        `}
      </style>
    </div>
  );
};

export default Posts;




