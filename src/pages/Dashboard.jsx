import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import postBodies from "../pages/RequestModel_PostBodies";
import "../pages/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState(
    postBodies.map((body) => ({
      requestBody: body,
      RequestId: null,
      Status: "Not Started",
      ModelUrl: null,
      PdfUrl: null,
      loading: false,
    }))
  );

  const handleLogout = () => navigate("/login");

  const isFinalStatus = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === "completed" || s === "failed";
  };

  // 🔁 Poll backend for ALL requests with a valid RequestId
  useEffect(() => {
    const interval = setInterval(async () => {
      for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        if (!req.RequestId || isFinalStatus(req.Status)) continue;

        try {
          const res = await axios.get(
            `https://localhost:7201/api/RequestModelStatus/status/${req.RequestId}`
          );
          const data = res.data;

          setRequests((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              Status: data.status ?? data.Status,
              ModelUrl: data.modelUrl ?? data.ModelUrl,
              PdfUrl: data.pdfUrl ?? data.PdfUrl,
              loading: !isFinalStatus(data.status ?? data.Status),
            };
            return updated;
          });
        } catch (err) {
          console.error(`Polling error for ${req.RequestId}:`, err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [requests]);

  // ▶️ Submit a single new request
  const submitRequest = async (reqIndex) => {
    setRequests((prev) => {
      const updated = [...prev];
      updated[reqIndex] = {
        ...updated[reqIndex],
        Status: "Queued",
        loading: true,
        RequestId: null,
        ModelUrl: null,
        PdfUrl: null,
      };
      return updated;
    });

    try {
      const response = await axios.post(
        "https://localhost:7201/api/RequestModelStatus",
        requests[reqIndex].requestBody
      );

      const { requestId, status } = response.data;

      setRequests((prev) => {
        const updated = [...prev];
        updated[reqIndex] = {
          ...updated[reqIndex],
          RequestId: requestId,
          Status: status,
          loading: true,
        };
        return updated;
      });
    } catch (err) {
      console.error("Failed to submit request:", err);
      setRequests((prev) => {
        const updated = [...prev];
        updated[reqIndex] = { ...updated[reqIndex], Status: "Failed", loading: false };
        return updated;
      });
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="logo">Model Requests</h1>
        <div className="profile-menu">
          <FaUserCircle size={30} />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        <div
          className="requests-grid"
          style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "15px",
          }}
        >
          {requests.map((req, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#eef",
                border: "1px solid #99c",
                borderRadius: "6px",
              }}
            >
              <h4>{req.requestBody.PartId}</h4>
              <p>
                <strong>Status:</strong> {req.Status}
              </p>

              <button
                onClick={() => submitRequest(index)}
                disabled={req.loading || ["Processing", "Queued"].includes(req.Status)}
                style={{ marginBottom: "10px" }}
              >
                {req.loading ? "Processing..." : "Load Model"}
              </button>

              {req.ModelUrl && (
                <p>
                  <strong>Download Model:</strong>{" "}
                  <a
                    href={req.ModelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here
                  </a>
                </p>
              )}

              {req.PdfUrl && (
                <p>
                  <strong>Download PDF:</strong>{" "}
                  <a
                    href={req.PdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
