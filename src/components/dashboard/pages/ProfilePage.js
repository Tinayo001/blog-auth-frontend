import React, { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL; // from your .env

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");

  // Example: assuming you saved token after login in localStorage
  const token = localStorage.getItem("accessToken");

  // Load profile when page mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setUsername(data.username || "");
        setEmail(data.email || "");
        setBio(data.bio || "");
        setProfileImage(data.profileImage || null);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); // base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile to backend
  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, bio, email, profileImage }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      alert("Profile updated!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* Profile Picture */}
      <div className="flex items-center mb-6">
        <label className="relative cursor-pointer">
          <img
            src={profileImage || "https://via.placeholder.com/100"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover mr-4 border"
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
        <span className="ml-2 text-sm text-gray-500">
          Click image to change
        </span>
      </div>

      {/* Username */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          placeholder="Enter your full name"
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Bio */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          value={bio}
          placeholder="Write something about yourself..."
          onChange={(e) => setBio(e.target.value)}
          rows="4"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <button
        onClick={handleSave}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Save Changes
      </button>
    </div>
  );
};

export default ProfilePage;




