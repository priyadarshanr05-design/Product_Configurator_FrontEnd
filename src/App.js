import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EntryPage from "./pages/EntryPage";
import UserRegistrationForm from "./pages/UserRegistrationForm";
import LoginPage from "./pages/LoginPage"; 
import Dashboard from "./pages/Dashboard";





function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/register" element={<UserRegistrationForm />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* New route */}
      </Routes>
    </Router>
  );
}

export default App;
