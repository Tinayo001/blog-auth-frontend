import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";
import { BsBookmark, BsBookmarkFill, BsThreeDots } from "react-icons/bs";
import { HiMinusCircle } from "react-icons/hi";

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
  const [isSaved, setIsSaved] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sideReplyingTo, setSideReplyingTo] = useState(null);
  const [sideReplyText, setSideReplyText] = useState("");
  const [sideNewComment, setSideNewComment] = useState("");
  const panelRef = useRef(null);
  const textareaRef = useRef(null);
  const threeDotsRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Maximum number of comments to show initially
  const INITIAL_COMMENTS_COUNT = 3;

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
      if (!isValidObjectId(id)) return;
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
  }, [id, API_URL]);

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
    const fetchSavedStatus = async () => {
      if (!isValidObjectId(id)) return;
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.log("No token, skipping saved status fetch");
          return;
        }
        setIsSaved(false);
      } catch (err) {
        console.error("Error fetching saved status:", err);
      }
    };
    fetchSavedStatus();
  }, [id, API_URL]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.log("No token, user not logged in");
          setCurrentUser(null);
          return;
        }

        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem("accessToken");
            setCurrentUser(null);
            return;
          }
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch user profile");
        }

        const userData = await res.json();
        setCurrentUser(userData);
      } catch (err) {
        console.error("Error fetching current user:", err);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, [API_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowComments(false);
      }
      if (threeDotsRef.current && !threeDotsRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };
    if (showComments || showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showComments, showPopup]);

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

  const handleSideAddComment = async () => {
    if (!sideNewComment.trim()) {
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
        body: JSON.stringify({ content: sideNewComment }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      const savedComment = await res.json();
      setComments((prev) => [...prev, savedComment]);
      setSideNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleToggleLike = async () => {
    if (isTogglingLike) return;
    console.log("Toggling like for postId:", id);
    if (!isValidObjectId(id)) {
      alert("Invalid post ID");
      return;
    }
    setIsTogglingLike(true);
    const newHasLiked = !hasLiked;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to like/unlike");
        setIsTogglingLike(false);
        return;
      }

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
      console.error(`Error ${newHasLiked ? "liking" : "unliking"} post:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleSavePost = () => {
    console.log(`Toggling save for post: ${id}`);
    setIsSaved((prev) => !prev);
    alert(`Post ${isSaved ? "unsaved" : "saved"}!`);
  };

  const handleTogglePopup = () => {
    console.log(`Toggling popup for post: ${id}`);
    setShowPopup((prev) => !prev);
  };

  const handleFollowAuthor = () => {
    console.log(`Follow/Unfollow author for post: ${id}`);
    setIsFollowing((prev) => !prev);
    alert(`Author ${isFollowing ? "unfollowed" : "followed"}!`);
    setShowPopup(false);
  };

  const handleShowLess = () => {
    console.log(`Show less for post: ${id}`);
    alert("Show less functionality not implemented yet.");
    setShowPopup(false);
  };

  const handleFollowPublication = () => {
    console.log(`Follow publication for post: ${id}`);
    alert("Follow publication functionality not implemented yet.");
    setShowPopup(false);
  };

  const handleMuteAuthor = () => {
    console.log(`Mute author for post: ${id}`);
    alert("Mute author functionality not implemented yet.");
    setShowPopup(false);
  };

  const handleMutePublication = () => {
    console.log(`Mute publication for post: ${id}`);
    alert("Mute publication functionality not implemented yet.");
    setShowPopup(false);
  };

  const handleReportStory = () => {
    console.log(`Report story for post: ${id}`);
    alert("Report story functionality not implemented yet.");
    setShowPopup(false);
  };

  const handleBold = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newComment.slice(start, end);
    const before = newComment.slice(0, start);
    const after = newComment.slice(end);
    setNewComment(`${before}**${selectedText}**${after}`);
    textarea.focus();
  };

  const handleItalic = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newComment.slice(start, end);
    const before = newComment.slice(0, start);
    const after = newComment.slice(end);
    setNewComment(`${before}_${selectedText}_${after}`);
    textarea.focus();
  };

  const handleSideBold = () => {
    const before = sideNewComment.slice(0, 0);
    const after = sideNewComment.slice(0);
    setSideNewComment(`${before}****${after}`);
  };

  const handleSideItalic = () => {
    const before = sideNewComment.slice(0, 0);
    const after = sideNewComment.slice(0);
    setSideNewComment(`${before}__${after}`);
  };

  const handleToggleCommentLike = (commentIndex) => {
    setComments(prev => prev.map((comment, idx) => {
      if (idx === commentIndex) {
        const currentLikes = comment.likesCount || 0;
        const hasLiked = comment.hasLiked || false;
        return {
          ...comment,
          likesCount: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
          hasLiked: !hasLiked
        };
      }
      return comment;
    }));
    console.log(`Toggled like for comment ${commentIndex}`);
  };

  const handleReplyToComment = (commentIndex) => {
    setReplyingTo(commentIndex);
    setReplyText("");
  };

  const handleSideReplyToComment = (commentIndex) => {
    setSideReplyingTo(commentIndex);
    setSideReplyText("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSideCancelReply = () => {
    setSideReplyingTo(null);
    setSideReplyText("");
  };

  const handleSubmitReply = async (commentIndex) => {
    if (!replyText.trim()) {
      alert("Reply cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to reply");
        return;
      }

      // For now, we'll simulate adding a reply locally
      // You'll need to implement the actual API call
      const newReply = {
        content: replyText,
        author: {
          username: "Current User", // You'll get this from your auth context
          profileImage: "/default-avatar.png"
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        hasLiked: false
      };

      setComments(prev => prev.map((comment, idx) => {
        if (idx === commentIndex) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
            repliesCount: (comment.repliesCount || 0) + 1
          };
        }
        return comment;
      }));

      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Error adding reply:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSideSubmitReply = async (commentIndex) => {
    if (!sideReplyText.trim()) {
      alert("Reply cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to reply");
        return;
      }

      const newReply = {
        content: sideReplyText,
        author: {
          username: currentUser?.username || "Current User",
          profileImage: currentUser?.profileImage || "/default-avatar.png"
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        hasLiked: false
      };

      setComments(prev => prev.map((comment, idx) => {
        if (idx === commentIndex) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
            repliesCount: (comment.repliesCount || 0) + 1
          };
        }
        return comment;
      }));

      setSideReplyingTo(null);
      setSideReplyText("");
    } catch (error) {
      console.error("Error adding reply:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleReplyBold = (commentIndex) => {
    const start = 0; // You can enhance this to track cursor position in reply textarea
    const end = 0;
    const selectedText = replyText.slice(start, end);
    const before = replyText.slice(0, start);
    const after = replyText.slice(end);
    setReplyText(`${before}**${selectedText}**${after}`);
  };

  const handleReplyItalic = (commentIndex) => {
    const start = 0; // You can enhance this to track cursor position in reply textarea
    const end = 0;
    const selectedText = replyText.slice(start, end);
    const before = replyText.slice(0, start);
    const after = replyText.slice(end);
    setReplyText(`${before}_${selectedText}_${after}`);
  };

  const handleSideReplyBold = () => {
    const before = sideReplyText.slice(0, 0);
    const after = sideReplyText.slice(0);
    setSideReplyText(`${before}****${after}`);
  };

  const handleSideReplyItalic = () => {
    const before = sideReplyText.slice(0, 0);
    const after = sideReplyText.slice(0);
    setSideReplyText(`${before}__${after}`);
  };

  const handleToggleReplyLike = (commentIndex, replyIndex) => {
    setComments(prev => prev.map((comment, cIdx) => {
      if (cIdx === commentIndex) {
        return {
          ...comment,
          replies: comment.replies.map((reply, rIdx) => {
            if (rIdx === replyIndex) {
              const currentLikes = reply.likesCount || 0;
              const hasLiked = reply.hasLiked || false;
              return {
                ...reply,
                likesCount: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
                hasLiked: !hasLiked
              };
            }
            return reply;
          })
        };
      }
      return comment;
    }));
    console.log(`Toggled like for reply ${replyIndex} in comment ${commentIndex}`);
  };

  if (loading) return <p className="p-6">Loading post...</p>;
  if (!post) return <p className="p-6 text-red-500">Post not found.</p>;

  const displayedComments = comments.slice(0, INITIAL_COMMENTS_COUNT);
  const hasMoreComments = comments.length > INITIAL_COMMENTS_COUNT;

  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      {/* Blog Title */}
      <h1 className="text-4xl font-bold mb-6" style={{ color: "rgba(0, 0, 0, 0.85)" }}>
        {post.title}
      </h1>

      {/* Author Profile Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.profileImage || "/default-avatar.png"}
            alt={post.author?.username || "Author"}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <p className="font-medium text-lg">{post.author?.username || post.author?.email}</p>
            <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        
        {/* Follow Button */}
        <button
          onClick={handleFollowAuthor}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 ${
            isFollowing
              ? "border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100"
              : "border-green-600 text-green-600 bg-transparent hover:bg-green-50"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      {/* Action Buttons Section with borders */}
      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={handleToggleLike}
                disabled={isTogglingLike}
                className={`flex items-center gap-2 text-lg ${
                  hasLiked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-500 hover:text-gray-700"
                } ${isTogglingLike ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {hasLiked ? <AiFillHeart /> : <AiOutlineHeart />}
                <span className="text-sm">{post.likesCount || 0}</span>
              </button>
              {showLikePopup && (
                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-popup">
                  {showLikePopup}
                </span>
              )}
            </div>
            
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-2 text-lg text-gray-500 hover:text-gray-700"
            >
              <FaComment />
              <span className="text-sm">{comments.length || 0}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-lg text-gray-500">
            <button
              onClick={handleSavePost}
              className={`transition-colors duration-200 ${
                isSaved
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title={isSaved ? "Unsave post" : "Save post"}
            >
              {isSaved ? <BsBookmarkFill /> : <BsBookmark />}
            </button>
            
            <div className="relative">
              <button
                ref={threeDotsRef}
                onClick={handleTogglePopup}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                title="More options"
              >
                <BsThreeDots />
              </button>
              {showPopup && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 text-sm text-gray-500 w-48 z-10 animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                  <div className="px-2">
                    <button
                      onClick={handleShowLess}
                      className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                    >
                      <HiMinusCircle className="text-lg" />
                      Show less
                    </button>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-2">
                    <button
                      onClick={handleFollowAuthor}
                      className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                    >
                      {isFollowing ? "Unfollow" : "Follow"} Author
                    </button>
                    <button
                      onClick={handleFollowPublication}
                      className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                    >
                      Follow Publication
                    </button>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-2">
                    <button
                      onClick={handleMuteAuthor}
                      className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                    >
                      Mute Author
                    </button>
                    <button
                      onClick={handleMutePublication}
                      className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                    >
                      Mute Publication
                    </button>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-2">
                    <button
                      onClick={handleReportStory}
                      className="flex items-center text-red-600 gap-2 w-full text-left hover:bg-gray-100 p-1 rounded transition-colors duration-150"
                    >
                      Report Story...
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Image */}
      {post.image && (
        <div className="mb-6">
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

      {/* Blog Content */}
      <div className="mb-8">
        <p className="text-gray-700 leading-relaxed text-lg">{post.content}</p>
      </div>

      {/* Responses Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Responses ({comments.length})
          </h2>
        </div>

        {/* Add Comment Form */}
        <div className="mb-8">
          {/* User Profile Section */}
          {currentUser ? (
            <div className="flex items-center gap-3 mb-4">
              <img
                src={currentUser.profileImage || "/default-avatar.png"}
                alt={currentUser.username || "Your profile"}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {currentUser.username || currentUser.email || "Anonymous User"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">?</span>
              </div>
              <div>
                <p className="font-medium text-gray-500">Please log in to comment</p>
              </div>
            </div>
          )}
          
          {/* Comment Input Area */}
          <div className={`border rounded-lg transition-colors duration-200 ${
            currentUser 
              ? "border-gray-200 focus-within:border-gray-400" 
              : "border-gray-300 bg-gray-50"
          }`}>
            <div className="p-4">
              <textarea
                ref={textareaRef}
                placeholder={currentUser ? "What are your thoughts?" : "Please log in to leave a comment"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => setIsCommentFocused(true)}
                onBlur={() => setIsCommentFocused(false)}
                disabled={!currentUser}
                className={`w-full resize-none focus:outline-none placeholder-gray-500 ${
                  currentUser 
                    ? "text-gray-700" 
                    : "text-gray-400 bg-transparent cursor-not-allowed"
                }`}
                rows={3}
                style={{ minHeight: '60px' }}
              />
            </div>
            
            {/* Bottom Section - Only shows when focused or has content and user is logged in */}
            {currentUser && (newComment.trim() || isCommentFocused) && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={handleBold}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200"
                      title="Bold"
                    >
                      <span className="font-bold text-sm">B</span>
                    </button>
                    <button
                      onClick={handleItalic}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200"
                      title="Italic"
                    >
                      <span className="italic text-sm">I</span>
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setNewComment("");
                        setIsCommentFocused(false);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                        newComment.trim()
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={!newComment.trim()}
                    >
                      Respond
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Login prompt for non-authenticated users */}
          {!currentUser && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                <a href="/login" className="text-green-600 hover:text-green-700 underline">
                  Sign in
                </a>
                {" "}or{" "}
                <a href="/register" className="text-green-600 hover:text-green-700 underline">
                  create an account
                </a>
                {" "}to leave a comment.
              </p>
            </div>
          )}
        </div>

        {/* Comments List - Show limited comments initially */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No responses yet.</p>
              <p className="text-gray-400 text-sm mt-2">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <>
              {displayedComments.map((comment, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.author?.profileImage || "/default-avatar.png"}
                      alt={comment.author?.username || "Author"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">
                          {comment.author?.username || comment.author?.email}
                        </p>
                        <span className="text-gray-400 text-sm">•</span>
                        <p className="text-gray-500 text-sm">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-3">{comment.content}</p>
                      
                      {/* Response Actions */}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <button 
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                          onClick={() => handleToggleCommentLike(idx)}
                        >
                          <span className="text-lg">👏</span>
                          <span>{comment.likesCount || 0}</span>
                        </button>
                        
                        <div className="flex items-center gap-1">
                          <span>{comment.repliesCount || 0} replies</span>
                        </div>
                        
                        <button 
                          className="text-gray-500 hover:text-zinc-950 underline transition-colors duration-200"
                          onClick={() => handleReplyToComment(idx)}
                        >
                          Reply
                        </button>
                      </div>

                      {/* Reply Form (shows when replying to this comment) */}
                      {replyingTo === idx && (
                        <div className="mt-4 ml-4 p-3 border-l-2 border-gray-200 bg-gray-50 rounded-r-lg">
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => handleReplyBold(idx)}
                              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 font-bold"
                            >
                              B
                            </button>
                            <button
                              onClick={() => handleReplyItalic(idx)}
                              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 italic"
                            >
                              I
                            </button>
                          </div>
                          <textarea
                            placeholder={`Reply to ${comment.author?.username || comment.author?.email}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSubmitReply(idx)}
                              className={`text-white px-4 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                                replyText.trim()
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-gray-400 cursor-not-allowed"
                              }`}
                              disabled={!replyText.trim()}
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => handleCancelReply()}
                              className="text-gray-600 px-4 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-xs font-medium transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-4 space-y-4">
                          {comment.replies.map((reply, replyIdx) => (
                            <div key={replyIdx} className="flex items-start gap-2 border-l-2 border-gray-200 pl-3">
                              <img
                                src={reply.author?.profileImage || "/default-avatar.png"}
                                alt={reply.author?.username || "Author"}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {reply.author?.username || reply.author?.email}
                                  </p>
                                  <span className="text-gray-400 text-xs">•</span>
                                  <p className="text-gray-500 text-xs">
                                    {new Date(reply.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                                <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <button 
                                    className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                                    onClick={() => handleToggleReplyLike(idx, replyIdx)}
                                  >
                                    <span className="text-sm">👏</span>
                                    <span>{reply.likesCount || 0}</span>
                                  </button>
                                  <button 
                                    className="text-gray-500 hover:text-zinc-950 underline transition-colors duration-200"
                                    onClick={() => handleReplyToComment(idx)}
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* See all responses button */}
              {hasMoreComments && (
                <div className="text-center py-6">
                  <button
                    onClick={() => setShowComments(true)}
                    className="rounded-full border border-zinc-950 bg-transparent px-4 py-2 text-sm text-zinc-950 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                  >
                    See all responses
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side Panel for Comments (Enhanced with interactive elements) */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-[26rem] bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          showComments ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Comments ({comments.length})</h2>
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            ) : (
              comments.map((comment, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start gap-2 mb-2">
                    <img
                      src={comment.author?.profileImage || "/default-avatar.png"}
                      alt={comment.author?.username || "Author"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{comment.author?.username || comment.author?.email}</p>
                        <span className="text-gray-400 text-xs">•</span>
                        <p className="text-gray-500 text-xs">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{comment.content}</p>
                      
                      {/* Side panel comment actions */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button 
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                          onClick={() => handleToggleCommentLike(idx)}
                        >
                          <span className="text-sm">👏</span>
                          <span>{comment.likesCount || 0}</span>
                        </button>
                        
                        <div className="flex items-center gap-1">
                          <span>{comment.repliesCount || 0} replies</span>
                        </div>
                        
                        <button 
                          className="text-gray-500 hover:text-zinc-950 underline transition-colors duration-200"
                          onClick={() => handleSideReplyToComment(idx)}
                        >
                          Reply
                        </button>
                      </div>

                      {/* Side panel reply form */}
                      {sideReplyingTo === idx && (
                        <div className="mt-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex gap-1 mb-2">
                            <button
                              onClick={handleSideReplyBold}
                              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 font-bold"
                            >
                              B
                            </button>
                            <button
                              onClick={handleSideReplyItalic}
                              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 italic"
                            >
                              I
                            </button>
                          </div>
                          <textarea
                            placeholder={`Reply to ${comment.author?.username || comment.author?.email}...`}
                            value={sideReplyText}
                            onChange={(e) => setSideReplyText(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
                            rows={2}
                          />
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => handleSideSubmitReply(idx)}
                              className={`text-white px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                                sideReplyText.trim()
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-gray-400 cursor-not-allowed"
                              }`}
                              disabled={!sideReplyText.trim()}
                            >
                              Reply
                            </button>
                            <button
                              onClick={handleSideCancelReply}
                              className="text-gray-600 px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-xs font-medium transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display replies in side panel */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 ml-2 space-y-2">
                          {comment.replies.map((reply, replyIdx) => (
                            <div key={replyIdx} className="flex items-start gap-2 border-l-2 border-gray-200 pl-2">
                              <img
                                src={reply.author?.profileImage || "/default-avatar.png"}
                                alt={reply.author?.username || "Author"}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <p className="font-medium text-xs">
                                    {reply.author?.username || reply.author?.email}
                                  </p>
                                  <span className="text-gray-400 text-xs">•</span>
                                  <p className="text-gray-500 text-xs">
                                    {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                                <p className="text-gray-700 text-xs mb-1">{reply.content}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <button 
                                    className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                                    onClick={() => handleToggleReplyLike(idx, replyIdx)}
                                  >
                                    <span className="text-xs">👏</span>
                                    <span>{reply.likesCount || 0}</span>
                                  </button>
                                  <button 
                                    className="text-gray-500 hover:text-zinc-950 underline transition-colors duration-200"
                                    onClick={() => handleSideReplyToComment(idx)}
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Side panel comment form */}
          {currentUser ? (
            <div className="border-t pt-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleSideBold}
                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-300 font-bold"
                >
                  B
                </button>
                <button
                  onClick={handleSideItalic}
                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-300 italic"
                >
                  I
                </button>
              </div>
              <textarea
                placeholder="Write a comment..."
                value={sideNewComment}
                onChange={(e) => setSideNewComment(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSideAddComment}
                  className={`text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    sideNewComment.trim()
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!sideNewComment.trim()}
                >
                  Respond
                </button>
                <button
                  onClick={() => setSideNewComment("")}
                  className="text-gray-600 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100 text-sm font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 text-center">
                <a href="/login" className="text-green-600 hover:text-green-700 underline">
                  Sign in
                </a>
                {" "}to leave a comment.
              </p>
            </div>
          )}
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


















