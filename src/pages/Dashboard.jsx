import React, { useState } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../pages/Dashboard.css";

const ModelViewer = ({ modelUrl }) => {
  const { scene } = useGLTF(modelUrl); // load GLTF/GLB model
  return <primitive object={scene} scale={1} />;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    navigate("/login");
  };

  const handleSubmit = async () => {
    setLoading(true);

    const postBody = {
      PartId: "MIS 17",
      DomainName: "motor",
      OutputFormat: "glb", // request 3D model
      PartNumber: "",
      Parameters: [
        { Name: "SIZE", Value: "MIS173S (0.40Nm) - Radial Connector", ParamType: "String", IsMandatory: true },
        { Name: "C_SHAFT", Value: "Ø 6.35x20; Shaft: IP65 Sealing, Motor: IP65 Painted", ParamType: "String", IsMandatory: true },
        { Name: "CONNECTION", Value: "Profinet", ParamType: "String", IsMandatory: true },
        { Name: "ENCODER", Value: "Absolute multiturn encoder and magnetic encoder. Closed loop.", ParamType: "String", IsMandatory: true },
        { Name: "supply", Value: "SMC66 Controller, Coated PCB with STO", ParamType: "String", IsMandatory: true }
      ],
      IsDebugMode: false,
      IsVersion2: true
    };

    try {
      const response = await axios.post("https://localhost:7201/api/ExternalModel", postBody);
      console.log("API Response:", response.data);

      // Assuming the API returns { modelUrl: "https://..." }
      setModelUrl(response.data.modelUrl);
    } catch (err) {
      console.error("Error fetching model:", err);
      alert("Failed to load model.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="logo">Model Request</h1>
        <div className="profile-menu">
          <FaUserCircle size={30} />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        <h2>Welcome to the Dashboard</h2>

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Loading..." : "Load 3D Model"}
        </button>

        {modelUrl && (
          <div style={{ height: "400px", width: "600px", border: "1px solid #ccc", marginTop: "20px" }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <ModelViewer modelUrl={modelUrl} />
              <OrbitControls />
            </Canvas>
            <a href={modelUrl} download style={{ marginTop: "10px", display: "inline-block" }}>
              Download Model
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
