import { useState, useRef } from "react";
import { FiMoreHorizontal, FiImage } from "react-icons/fi";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      setImage(file);
    }
  };

  const handlePublish = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("You must be logged in to publish a post.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      alert("Please enter both a title and content.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (image) formData.append("image", image);

      const res = await fetch(`${process.env.REACT_APP_API_URL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create post");
      }

      alert("Post published successfully!");
      setTitle("");
      setContent("");
      setImage(null);
    } catch (err) {
      console.error(err);
      alert("Error publishing post: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePublish}
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading ? "Publishing..." : "Publish"}
          </button>

          {/* Add Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-2 rounded-full hover:bg-gray-200 transition"
          >
            <FiImage size={22} />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
        <FiMoreHorizontal size={24} className="cursor-pointer" />
      </div>

      {/* Image Preview */}
      {image && (
        <div className="mb-4">
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="max-h-64 rounded border"
          />
        </div>
      )}

      {/* Title input */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-4xl font-bold outline-none border-none mb-4 placeholder-gray-400"
      />

      {/* Content textarea */}
      <textarea
        placeholder="Write your blog here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[400px] outline-none text-lg placeholder-gray-400"
      />
    </div>
  );
}



