import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [showLikePopup, setShowLikePopup] = useState(null);
  const panelRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    console.log("Post ID:", id);
    if (!isValidObjectId(id)) {
      console.error(`Invalid post ID: ${id}`);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!isValidObjectId(id)) return;
      try {
        const res = await fetch(`${API_URL}/posts/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch post");
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, API_URL]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!showComments || !isValidObjectId(id)) return;
      try {
        const res = await fetch(`${API_URL}/posts/${id}/comments`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch comments");
        }
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };
    fetchComments();
  }, [showComments, id, API_URL]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!isValidObjectId(id)) return;
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.log("No token, skipping like status fetch");
          return;
        }
        const res = await fetch(`${API_URL}/likes/${id}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch like status");
        }
        const { hasLiked } = await res.json();
        setHasLiked(hasLiked);
      } catch (err) {
        console.error("Error fetching like status:", err);
      }
    };
    fetchLikeStatus();
  }, [id, API_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowComments(false);
      }
    };
    if (showComments) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to comment");
        return;
      }

      const res = await fetch(`${API_URL}/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      const savedComment = await res.json();
      setComments((prev) => [...prev, savedComment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleToggleLike = async () => {
    if (isTogglingLike) return;
    console.log("Toggling like for postId:", id);
    setIsTogglingLike(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to like/unlike");
        setIsTogglingLike(false);
        return;
      }

      const newHasLiked = !hasLiked;
      setHasLiked(newHasLiked);
      setPost((prev) => ({
        ...prev,
        likesCount: Math.max(0, (prev?.likesCount || 0) + (newHasLiked ? 1 : -1)),
      }));
      setShowLikePopup(newHasLiked ? "+1" : "-1");
      setTimeout(() => setShowLikePopup(null), 1000);

      const url = `${API_URL}/likes/${id}`;
      const options = {
        method: newHasLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      if (newHasLiked) {
        options.body = JSON.stringify({ postId: id });
      }

      const res = await fetch(url, options);

      if (!res.ok) {
        setHasLiked(!newHasLiked);
        setPost((prev) => ({
          ...prev,
          likesCount: Math.max(0, (prev?.likesCount || 0) + (newHasLiked ? -1 : 1)),
        }));
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${newHasLiked ? "like" : "unlike"} post`);
      }
    } catch (error) {
      console.error(`Error ${hasLiked ? "unliking" : "liking"} post:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTogglingLike(false);
    }
  };

  if (loading) return <p className="p-6">Loading post...</p>;
  if (!post) return <p className="p-6 text-red-500">Post not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={post.author?.profileImage || "/default-avatar.png"}
          alt={post.author?.username || "Author"}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex items-center gap-2">
          <p className="font-medium">{post.author?.username || post.author?.email}</p>
          <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-4" style={{ color: "rgba(0, 0, 0, 0.85)" }}>
        {post.title}
      </h1>

      {post.image && (
        <div className="mb-4">
          <img
            src={`http://localhost:5000${post.image}`}
            alt={post.title}
            className="w-full max-w-lg h-auto object-contain rounded-lg"
            onError={(e) => {
              e.target.src = "/default-image.png";
              console.error("Failed to load image:", e.target.src);
            }}
          />
        </div>
      )}

      <p className="text-gray-700 leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
        <div className="relative">
          <button
            onClick={handleToggleLike}
            disabled={isTogglingLike}
            className={`flex items-center gap-1 text-lg ${
              hasLiked
                ? "text-gray-500 hover:text-gray-700"
                : "text-gray-500 hover:text-gray-700 opacity-50"
            } ${isTogglingLike ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {hasLiked ? <AiFillHeart /> : <AiOutlineHeart />}
            <span>{post.likesCount || 0}</span>
          </button>
          {showLikePopup && (
            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-popup">
              {showLikePopup}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowComments(true)}
          className="flex items-center gap-1 cursor-pointer hover:underline"
        >
          <FaComment
            className={`text-lg ${
              comments.length > 0
                ? "text-gray-500 hover:text-gray-700"
                : "text-gray-500 hover:text-gray-700 opacity-50"
            }`}
          />
          <span>{comments.length || 0}</span>
        </button>
      </div>

      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ${
          showComments ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Comments</h2>
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            ) : (
              comments.map((comment, idx) => (
                <div key={idx} className="border-b pb-2 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={comment.author?.profileImage || "/default-avatar.png"}
                      alt={comment.author?.username || "Author"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <p className="text-sm font-medium">{comment.author?.username || comment.author?.email}</p>
                  </div>
                  <p className="text-gray-600 text-sm ml-10">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddComment}
                className="bg-gray-500 text-white px-3 py-1 rounded-2xl hover:bg-gray-400"
              >
                Respond
              </button>
              <button
                onClick={() => setNewComment("")}
                className="text-zinc-950 px-3 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

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

export default PostDetail;


















