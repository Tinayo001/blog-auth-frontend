import React from 'react';
import { useNavigate } from 'react-router-dom';
import blogPic from '../images/write.jpg';

const Hero = () => {
  const navigate = useNavigate();

  const handleStartReading = () => {
    navigate('/login');
  };

  return (
    <section className="bg-white border-b border-black px-6 py-24 flex justify-between items-center min-h-[500px]">
      
      {/* Left side: Heading + subheading + button */}
      <div className="py-6 px-3 bg-white text-left max-w-lg flex flex-col">
        <h1 className="font-bold italic font-light text-zinc-900 text-7xl leading-tight">
          Human<br />stories & ideas
        </h1>
        <h2 className="pt-6 font-medium text-zinc-900 text-2xl leading-tight">
          A place to read, write, and deepen your understanding
        </h2>
        <button
          onClick={handleStartReading}
          className="mt-8 bg-black text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition w-max"
        >
          Start Reading
        </button>
      </div>

      {/* Right side: Image */}
      <div className="max-w-md">
        <img
          src={blogPic}
          alt="Blog Visual"
          className="w-full h-auto object-cover rounded-md shadow-lg"
        />
      </div>

    </section>
  );
};

export default Hero;







