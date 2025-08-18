import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const panelRef = useRef(null); 
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_URL}/posts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch post");
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

  // Fetch comments when sidebar opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!showComments) return;
      try {
        const res = await fetch(`${API_URL}/posts/${id}/comments`);
        if (!res.ok) throw new Error("Failed to fetch comments");
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };
    fetchComments();
  }, [showComments, id, API_URL]);

  // Click-away listener for comments panel
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
    if (!newComment.trim()) return;

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

      if (!res.ok) throw new Error("Failed to add comment");

      const savedComment = await res.json();
      setComments((prev) => [...prev, savedComment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error adding comment: " + error.message);
    }
  };

  if (loading) return <p className="p-6">Loading post...</p>;
  if (!post) return <p className="p-6 text-red-500">Post not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      {/* Author Info */}
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

      {/* Title */}
      <h1 className="text-3xl font-bold mb-4" style={{ color: "rgba(0, 0, 0, 0.85)" }}>
        {post.title}
      </h1>

      {/* Content */}
      <p className="text-gray-700 leading-relaxed">{post.content}</p>

      {/* Likes and Comments */}
      <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
        <span>❤️ {post.likes?.length || 0} Likes</span>
        <span
          className="cursor-pointer hover:underline"
          onClick={() => setShowComments(true)}
        >
          💬 {comments.length || 0} Comments
        </span>
      </div>

      {/* Comments Panel */}
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
    </div>
  );
};

export default PostDetail;










