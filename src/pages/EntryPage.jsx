import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; // make sure App.css is imported

const EntryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="form-wrapper" style={{ textAlign: "center" }}>
        <h1 className="form-title">Welcome</h1>
        <p style={{ marginBottom: "30px", color: "#555", fontSize: "14px" }}>
          Please choose an option to continue
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button className="button" onClick={() => navigate("/login")}>
            
            Login
          </button>
          <button
            className="button"
            style={{
              backgroundColor: "#fff",
              color: "#44c7c7",
              border: "2px solid #44c7c7",
            }}
            onClick={() => navigate("/register")}
          >
            Create User
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryPage;
