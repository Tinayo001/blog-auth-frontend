import React from 'react';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";

function App() {
  return (
     <Router>
      <Navbar />
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}

export default App;

