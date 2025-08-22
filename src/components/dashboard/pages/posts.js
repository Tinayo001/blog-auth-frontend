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
  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isTogglingFollowMap, setIsTogglingFollowMap] = useState({});
  const [likersMap, setLikersMap] = useState({});
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
          const likeStatuses = await Promise.all(likeStatusPromises);
          const likeStatusMap = likeStatuses.reduce((acc, { postId, hasLiked }) => {
            acc[postId] = hasLiked;
            return acc;
          }, {});
          console.log("Updated hasLikedMap:", likeStatusMap);
          setHasLikedMap(likeStatusMap);
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
    if (!isValidObjectId(userId)) {
      alert("Invalid user ID");
      return;
    }
    setIsTogglingFollowMap((prev) => ({ ...prev, [userId]: true }));
    const newIsFollowing = !followingMap[userId];

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to follow/unfollow");
        setIsTogglingFollowMap((prev) => ({ ...prev, [userId]: false }));
        return;
      }

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
        setFollowingMap((prev) => ({ ...prev, [userId]: !newIsFollowing }));
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${newIsFollowing ? "follow" : "unfollow"} user`);
      }
    } catch (error) {
      console.error(`Error ${newIsFollowing ? "following" : "unfollowing"} user:`, { message: error.message, stack: error.stack });
      alert(`Error: ${error.message}`);
    } finally {
      setIsTogglingFollowMap((prev) => ({ ...prev, [userId]: false }));
    }
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
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => fetchUsersWhoLiked(post._id)}
                          >
                            {post.likesCount || 0}
                          </span>
                        </button>
                        {showLikePopupMap[post._id] && (
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-popup">
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
          <div className="mb-6 who-to-follow">
            <h3 className="text-lg font-semibold mb-4">Who to Follow</h3>
            {users.length === 0 ? (
              <p className="text-gray-500">No users to follow.</p>
            ) : (
              <>
                <ul className="space-y-4">
                  {users.slice(0, 4).map((user) => {
                    console.log("Rendering user:", {
                      id: user._id,
                      username: user.username,
                      email: user.email,
                      bio: user.bio,
                    });
                    return (
                      <li key={user._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profileImage || "/default-avatar.png"}
                            alt={user.username || "User"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex flex-col">
                            <Link
                              to={`/profile/${user._id}`}
                              className="text-sm !text-zinc-950 !font-bold hover:underline"
                            >
                              {user.username || user.email || "Unknown User"}
                            </Link>
                            {user.bio && (
                              <span className="text-xs text-gray-500 max-w-[150px] truncate">
                                {user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFollow(user._id)}
                          disabled={isTogglingFollowMap[user._id]}
                          className={`ml-8 rounded-full text-base font-medium transition-colors duration-200 bg-transparent border border-gray-500 ${
                            followingMap[user._id]
                              ? "px-6 py-1 text-gray-500 hover:text-gray-600 hover:border-gray-600"
                              : "px-4 py-1 text-gray-700 hover:text-gray-800 hover:border-gray-700"
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
                  className="block mt-4 text-sm text-purple-900 hover:underline"
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

      <style>
        {`
          .animate-popup {
            animation: popup 1s ease-out forwards;
          }
          @keyframes popup {
            0% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
          .who-to-follow a {
            color: #09090b !important; /* zinc-950 */
            font-weight: 700 !important; /* bold */
          }
        `}
      </style>
    </div>
  );
};

export default Posts;

