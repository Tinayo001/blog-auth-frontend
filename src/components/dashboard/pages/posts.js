import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";
import { HiMinusCircle } from "react-icons/hi"; // For Show Less
import { BsBookmark, BsBookmarkFill, BsThreeDots } from "react-icons/bs"; // For Save Post and More Options

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [hasLikedMap, setHasLikedMap] = useState({});
  const [isTogglingLikeMap, setIsTogglingLikeMap] = useState({});
  const [showLikePopupMap, setShowLikePopupMap] = useState({});
  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isTogglingFollowMap, setIsTogglingFollowMap] = useState({});
  const [likersMap, setLikersMap] = useState({});
  const [savedPostsMap, setSavedPostsMap] = useState({});
  const [showPopupMap, setShowPopupMap] = useState({}); // State for popup visibility
  const threeDotsRefs = useRef({}); // Refs for three-dot buttons
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/auth";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        console.log("Access token:", token ? "Present" : "Missing");

        // Fetch posts
        const postsRes = await fetch(`${API_URL}/posts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!postsRes.ok) {
          const errorData = await postsRes.json();
          throw new Error(errorData.error || `Failed to fetch posts: ${postsRes.status}`);
        }
        const postsData = await postsRes.json();
        console.log("Fetched posts:", postsData.map(p => ({ _id: p._id, likesCount: p.likesCount })));
        setPosts(postsData);

        // Fetch like statuses
        if (token) {
          const likeStatusPromises = postsData.map(async (post) => {
            if (!isValidObjectId(post._id)) {
              console.error(`Invalid post ID: ${post._id}`);
              return { postId: post._id, hasLiked: false };
            }
            try {
              const res = await fetch(`${API_URL}/likes/${post._id}/user`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const errorData = await res.json();
                console.error(`Failed to fetch like status for post ${post._id}:`, errorData);
                return { postId: post._id, hasLiked: false };
              }
              const { hasLiked } = await res.json();
              console.log(`Like status for post ${post._id}:`, { hasLiked });
              return { postId: post._id, hasLiked };
            } catch (err) {
              console.error(`Error fetching like status for post ${post._id}:`, err.message);
              return { postId: post._id, hasLiked: false };
            }
          });
          const likeStatusPromisesResult = await Promise.all(likeStatusPromises);
          const likeStatusMap = likeStatusPromisesResult.reduce((acc, { postId, hasLiked }) => {
            acc[postId] = hasLiked;
            return acc;
          }, {});
          console.log("Updated hasLikedMap:", likeStatusMap);
          setHasLikedMap(likeStatusMap);

          // Fetch saved post statuses (placeholder)
          const savedStatusMap = postsData.reduce((acc, post) => {
            acc[post._id] = false; // Default: not saved
            return acc;
          }, {});
          setSavedPostsMap(savedStatusMap);
        }
      } catch (err) {
        console.error("Error fetching posts:", { message: err.message, stack: err.stack });
        alert(`Error: ${err.message}`);
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Failed to fetch users: ${res.status}`);
        }
        const data = await res.json();
        const sortedData = data.sort((a, b) => {
          const nameA = (a.username || a.email || "").toLowerCase();
          const nameB = (b.username || b.email || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        console.log("Fetched and sorted users:", sortedData.map(u => ({ _id: u._id, username: u.username })));
        setUsers(sortedData);

        if (token) {
          const followingStatusPromises = sortedData.map(async (user) => {
            if (!isValidObjectId(user._id)) {
              console.error(`Invalid user ID: ${user._id}`);
              return { userId: user._id, isFollowing: false };
            }
            try {
              const res = await fetch(`${API_URL}/follow/${user._id}/following`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const { isFollowing } = await res.json();
                return { userId: user._id, isFollowing };
              }
              return { userId: user._id, isFollowing: false };
            } catch (err) {
              console.error(`Error fetching following status for user ${user._id}:`, err.message);
              return { userId: user._id, isFollowing: false };
            }
          });
          const followingStatuses = await Promise.all(followingStatusPromises);
          const followingStatusMap = followingStatuses.reduce((acc, { userId, isFollowing }) => {
            acc[userId] = isFollowing;
            return acc;
          }, {});
          setFollowingMap(followingStatusMap);
        }
      } catch (err) {
        console.error("Error fetching users:", { message: err.message, stack: err.stack });
        alert(`Error: ${err.message}`);
      }
    };

    fetchPosts();
    fetchUsers();
  }, [API_URL]);

  const fetchUsersWhoLiked = async (postId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to view likers");
        return;
      }
      const res = await fetch(`${API_URL}/likes/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch users who liked: ${res.status}`);
      }
      const data = await res.json();
      console.log(`Fetched users who liked post ${postId}:`, data.likes);
      setLikersMap((prev) => ({
        ...prev,
        [postId]: data.likes.map((like) => ({
          _id: like.user._id,
          username: like.user.username || like.user.email || "Unknown User",
          profileImage: like.user.profileImage || "/default-avatar.png",
        })),
      }));
    } catch (err) {
      console.error(`Error fetching users who liked post ${postId}:`, err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleLike = async (postId) => {
    if (isTogglingLikeMap[postId]) return;
    console.log("Toggling like for postId:", postId);
    if (!isValidObjectId(postId)) {
      alert("Invalid post ID");
      return;
    }
    setIsTogglingLikeMap((prev) => ({ ...prev, [postId]: true }));
    const newHasLiked = !hasLikedMap[postId];

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to like/unlike");
        setIsTogglingLikeMap((prev) => ({ ...prev, [postId]: false }));
        return;
      }

      // Optimistic update
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
        const errorData = await res.json();
        console.error(`Failed to ${newHasLiked ? "like" : "unlike"} post ${postId}:`, errorData);
        // Revert optimistic update
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
        throw new Error(errorData.error || `Failed to ${newHasLiked ? "like" : "unlike"} post`);
      }

      // Refresh likers list
      await fetchUsersWhoLiked(postId);
    } catch (error) {
      console.error(`Error ${newHasLiked ? "liking" : "unliking"} post:`, { message: error.message, stack: error.stack });
      alert(`Error: ${error.message}`);
    } finally {
      setIsTogglingLikeMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleFollow = async (userId) => {
    if (isTogglingFollowMap[userId]) return;
    console.log("Toggling follow for userId:", userId);

    // Check for valid userId
    if (!userId || typeof userId !== "string" || !isValidObjectId(userId)) {
      console.error("Invalid or missing user ID:", userId);
      alert("Invalid user ID");
      return;
    }

    setIsTogglingFollowMap((prev) => ({ ...prev, [userId]: true }));
    const newIsFollowing = !followingMap[userId] ?? true; // Default to true if undefined

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found in localStorage");
        alert("You must be logged in to follow/unfollow");
        setIsTogglingFollowMap((prev) => ({ ...prev, [userId]: false }));
        return;
      }

      // Optimistic update
      setFollowingMap((prev) => ({ ...prev, [userId]: newIsFollowing }));

      const url = `${API_URL}/follow/${userId}`;
      const options = {
        method: newIsFollowing ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await fetch(url, options);
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
          errorData = { error: `HTTP error ${res.status}` };
        }
        setFollowingMap((prev) => ({ ...prev, [userId]: !newIsFollowing }));
        throw new Error(errorData.error || `Failed to ${newIsFollowing ? "follow" : "unfollow"} user (Status: ${res.status})`);
      }

      console.log(`Successfully ${newIsFollowing ? "followed" : "unfollowed"} user ${userId}`);
    } catch (error) {
      console.error(`Error ${newIsFollowing ? "following" : "unfollowing"} user ${userId}:`, {
        message: error.message,
        stack: error.stack,
      });
      alert(`Error: ${error.message}`);
    } finally {
      setIsTogglingFollowMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleShowLess = (postId) => {
    console.log(`Show less for post: ${postId}`);
    // Placeholder for future backend integration
    alert("Show less functionality not implemented yet.");
    setShowPopupMap((prev) => ({ ...prev, [postId]: false }));
  };

  const handleSavePost = (postId) => {
    console.log(`Toggling save for post: ${postId}`);
    setSavedPostsMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
    alert(`Post ${savedPostsMap[postId] ? "unsaved" : "saved"}!`);
  };

  const handleTogglePopup = (postId) => {
    console.log(`Toggling popup for post: ${postId}`);
    setShowPopupMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleFollowPublication = (postId) => {
    console.log(`Follow publication for post: ${postId}`);
    alert("Follow publication functionality not implemented yet.");
    setShowPopupMap((prev) => ({ ...prev, [postId]: false }));
  };

  const handleMuteAuthor = (postId) => {
    console.log(`Mute author for post: ${postId}`);
    alert("Mute author functionality not implemented yet.");
    setShowPopupMap((prev) => ({ ...prev, [postId]: false }));
  };

  const handleMutePublication = (postId) => {
    console.log(`Mute publication for post: ${postId}`);
    alert("Mute publication functionality not implemented yet.");
    setShowPopupMap((prev) => ({ ...prev, [postId]: false }));
  };

  const handleReportStory = (postId) => {
    console.log(`Report story for post: ${postId}`);
    alert("Report story functionality not implemented yet.");
    setShowPopupMap((prev) => ({ ...prev, [postId]: false }));
  };

  return (
    <div className="p-2 max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      <div className="flex-1 max-w-5xl">
        <h2 className="text-2xl font-bold mb-6">Blogs</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post, index) => (
              <React.Fragment key={post._id}>
                <li className="rounded-lg p-5 bg-white flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
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
                      className="block text-2xl font-bold text-gray-900 bg-clip-text mt-2"
                      style={{ color: "rgba(0, 0, 0, 0.85)" }}
                    >
                      {post.title}
                    </Link>

                    <p className="text-gray-600 mt-2">{post.content.substring(0, 150)}...</p>

                    <div className="flex items-center justify-between gap-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-6">
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
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => fetchUsersWhoLiked(post._id)}
                            >
                              {post.likesCount || 0}
                            </span>
                          </button>
                          {showLikePopupMap[post._id] && (
                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-pulse transition-all duration-1000 animate-bounce">
                              {showLikePopupMap[post._id]}
                            </span>
                          )}
                          {likersMap[post._id] && (
                            <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded shadow p-2 text-xs max-w-[200px] z-10">
                              {likersMap[post._id].length > 0 ? (
                                likersMap[post._id].map((user) => (
                                  <Link
                                    key={user._id}
                                    to={`/profile/${user._id}`}
                                    className="flex items-center gap-2 hover:underline mb-1"
                                  >
                                    <img
                                      src={user.profileImage}
                                      alt={user.username}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <span>{user.username}</span>
                                  </Link>
                                ))
                              ) : (
                                <span>No likes yet</span>
                              )}
                            </div>
                          )}
                        </div>
                        <span
                          className="flex items-center gap-1 cursor-pointer hover:underline"
                          onClick={() => console.log("Comments clicked")}
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
                      <div className="flex items-center gap-4 text-lg text-gray-500">
                        <button
                          onClick={() => handleShowLess(post._id)}
                          className="bg-transparent hover:text-gray-700 transition-colors duration-200"
                          title="Show less of this post"
                        >
                          <HiMinusCircle />
                        </button>
                        <button
                          onClick={() => handleSavePost(post._id)}
                          className={`bg-transparent transition-colors duration-200 ${
                            savedPostsMap[post._id]
                              ? "text-gray-500 hover:text-gray-700"
                              : "text-gray-500 hover:text-gray-700 opacity-50"
                          }`}
                          title={savedPostsMap[post._id] ? "Unsave post" : "Save post"}
                        >
                          {savedPostsMap[post._id] ? <BsBookmarkFill /> : <BsBookmark />}
                        </button>
                        <div className="relative">
                          <button
                            ref={(el) => (threeDotsRefs.current[post._id] = el)}
                            onClick={() => handleTogglePopup(post._id)}
                            className="bg-transparent text-gray-500 hover:text-zinc-950 transition-colors duration-200"
                            title="More options"
                          >
                            <BsThreeDots />
                          </button>
                          {showPopupMap[post._id] && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 text-sm text-gray-500 w-48 z-10 animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
                              {/* Arrow pointing down */}
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                              
                              {/* Show Less Section */}
                              <div className="px-2">
                                <button
                                  onClick={() => handleShowLess(post._id)}
                                  className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                                >
                                  <HiMinusCircle className="text-lg" />
                                  Show less
                                </button>
                              </div>

                              {/* Separator */}
                              <div className="border-t border-gray-200 my-2"></div>

                              {/* Follow Section */}
                              <div className="px-2">
                                {post.author?._id && (
                                  <button
                                    onClick={() => handleToggleFollow(post.author._id)}
                                    disabled={isTogglingFollowMap[post.author._id]}
                                    className={`flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150 ${
                                      isTogglingFollowMap[post.author._id] ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    {followingMap[post.author._id] ? "Unfollow Author" : "Follow Author"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleFollowPublication(post._id)}
                                  className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                                >
                                  Follow Publication
                                </button>
                              </div>

                              {/* Separator */}
                              <div className="border-t border-gray-200 my-2"></div>

                              {/* Mute Section */}
                              <div className="px-2">
                                <button
                                  onClick={() => handleMuteAuthor(post._id)}
                                  className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                                >
                                  Mute Author
                                </button>
                                <button
                                  onClick={() => handleMutePublication(post._id)}
                                  className="flex items-center gap-2 w-full text-left hover:text-zinc-950 p-1 rounded transition-colors duration-150"
                                >
                                  Mute Publication
                                </button>
                              </div>

                              {/* Separator */}
                              <div className="border-t border-gray-200 my-2"></div>

                              {/* Report Section */}
                              <div className="px-2">
                                <button
                                  onClick={() => handleReportStory(post._id)}
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
                {index < posts.length - 1 && <hr className="border-gray-200" />}
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden md:block border-l border-gray-200"></div>
      <div className="hidden md:block w-48 flex-shrink-0">
        <div className="sticky top-24">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Recommended Topics</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link to="/topics/1" className="hover:underline">Post Title 1</Link></li>
              <li><Link to="/topics/2" className="hover:underline">Post Title 2</Link></li>
              <li><Link to="/topics/3" className="hover:underline">Post Title 3</Link></li>
            </ul>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Who to Follow</h3>
            {users.length === 0 ? (
              <p className="text-gray-500">No users to follow.</p>
            ) : (
              <>
                <ul className="space-y-4">
                  {users.slice(0, 3).map((user) => {
                    console.log("Rendering user:", {
                      id: user._id,
                      username: user.username,
                      email: user.email,
                      bio: user.bio,
                    });
                    return (
                      <li key={user._id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={user.profileImage || "/default-avatar.png"}
                            alt={user.username || "User"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex flex-col min-w-0">
                            <Link
                              to={`/profile/${user._id}`}
                              className="text-sm text-zinc-950 font-bold truncate hover:underline transition-colors duration-200"
                            >
                              {user.username || user.email || "Unknown User"}
                            </Link>
                            {user.bio && (
                              <span className="text-xs text-gray-500 max-w-[140px] line-clamp-2">
                                {user.bio}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFollow(user._id)}
                          disabled={isTogglingFollowMap[user._id]}
                          className={`rounded-full text-sm font-medium transition-colors duration-200 bg-transparent border border-gray-500 px-3 py-1 ${
                            followingMap[user._id]
                              ? "text-gray-500 hover:text-gray-600 hover:border-gray-600"
                              : "text-gray-700 hover:text-gray-800 hover:border-gray-700"
                          } ${isTogglingFollowMap[user._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {followingMap[user._id] ? "Following" : "Follow"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/suggestions"
                  className="block mt-4 text-sm text-purple-900 hover:underline transition-colors duration-200"
                >
                  See more suggestions
                </Link>
              </>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Reading List</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link to="/reading/1" className="hover:underline">Saved Post 1</Link></li>
              <li><Link to="/reading/2" className="hover:underline">Saved Post 2</Link></li>
              <li><Link to="/reading/3" className="hover:underline">Saved Post 3</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Posts;
