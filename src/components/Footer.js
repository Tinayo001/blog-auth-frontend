import React from 'react';

const Footer = () => {
  const links = [
    "Help",
    "Status",
    "About",
    "Careers",
    "Press",
    "Blog",
    "Privacy",
    "Rules",
    "Terms",
    "Text to speech"
  ];

  return (
    <footer className="bg-gray-100 border-t border-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-gray-600 text-sm font-medium">
          {links.map((link) => (
            <a 
              key={link} 
              href="#" 
              className="hover:text-gray-900 transition"
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
