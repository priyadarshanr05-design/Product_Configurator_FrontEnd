import React, { useState, useEffect, useRef } from "react";
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
      ApiStatus: null,      // NEW: API status text
      ApiResponse: null,    // NEW: full API response JSON
      loading: false,
      lastChecked: Date.now(),
    }))
  );

  // 🔒 Use ref to store polling interval duration for exponential backoff
  const pollingDelayRef = useRef(3000);

  const handleLogout = () => navigate("/login");

  const isFinalStatus = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === "completed" || s === "failed";
  };

  // 🧠 Polling Effect — uses exponential backoff to reduce load
  useEffect(() => {
  let isMounted = true;

  const poll = async () => {
    try {
      // Get the latest state safely
      setRequests((prevRequests) => {
        // Create a shallow copy to mutate inside async
        const current = [...prevRequests];

        current.forEach(async (req, i) => {
          if (!req.RequestId || isFinalStatus(req.Status)) return;

          try {
            const res = await axios.get(
              `https://localhost:7201/api/RequestModelStatus/status/${req.RequestId}`
            );

            const data = res.data;
            const newStatus = data.status ?? data.Status;
            const nextLoading = !isFinalStatus(newStatus);

            if (!isMounted) return;

            setRequests((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                Status: newStatus,
                ModelUrl: data.modelUrl ?? updated[i].ModelUrl,
                PdfUrl: data.pdfUrl ?? updated[i].PdfUrl,
                ApiStatus: data.ApiStatus ?? updated[i].ApiStatus,     // update API status
                ApiResponse: JSON.stringify(data, null, 2),        // store full response as string
                loading: nextLoading,
                lastChecked: Date.now(),
              };
              return updated;
            });
          } catch (err) {
            console.error(`Polling error for ${req.RequestId}:`, err);
          }
        });

        return current;
      });
    } catch (err) {
      console.error("Polling loop error:", err);
    }

    // Exponential backoff logic
    const hasActive = requests.some(
      (r) => !isFinalStatus(r.Status) && r.RequestId
    );
    if (hasActive) {
      pollingDelayRef.current = Math.min(pollingDelayRef.current * 1.25, 15000);
    } else {
      pollingDelayRef.current = 3000;
    }

    if (isMounted) {
      setTimeout(poll, pollingDelayRef.current);
    }
  };

  poll();

  return () => {
    isMounted = false;
  };
}, []);

  // ▶️ Submit a single new request
  const submitRequest = async (reqIndex) => {
    // 1️⃣ Set request to Queued immediately
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
      // 2️⃣ Call backend
      const response = await axios.post(
        "https://localhost:7201/api/RequestModelStatus",
        requests[reqIndex].requestBody
      );

      const { requestId, status } = response.data;

      // 3️⃣ Update state with RequestId and initial status
      setRequests((prev) => {
        const updated = [...prev];
        updated[reqIndex] = {
          ...updated[reqIndex],
          RequestId: requestId,
          Status: status ?? "Queued",
          loading: true,
        };
        return updated;
      });
    } catch (err) {
      console.error("Failed to submit request:", err);
      setRequests((prev) => {
        const updated = [...prev];
        updated[reqIndex] = {
          ...updated[reqIndex],
          Status: "Failed",
          loading: false,
        };
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
          {requests.map((req, index) => {
            const statusColor =
              req.Status === "Completed"
                ? "#4caf50"
                : req.Status === "Failed"
                ? "#f44336"
                : req.Status === "Queued"
                ? "#ff9800"
                : "#3f51b5";

            return (
              <div
                key={index}
                style={{
                  padding: "15px",
                  backgroundColor: "#f9f9ff",
                  border: `2px solid ${statusColor}`,
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease-in-out",
                }}
              >
                <h4>{req.requestBody.PartId}</h4>
                <p>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: statusColor }}>{req.Status}</span>
                </p>

                <button
                  onClick={() => submitRequest(index)}
                  disabled={req.loading || ["Processing", "Queued"].includes(req.Status)}
                  style={{
                    marginBottom: "10px",
                    backgroundColor: req.loading ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    cursor: req.loading ? "not-allowed" : "pointer",
                  }}
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

                {req.ApiStatus && (
  <p>
    <strong>API Status:</strong> {req.ApiStatus}
  </p>
)}

{req.ApiResponse && (
  <details style={{ maxHeight: "200px", overflow: "auto" }}>
    <summary>Full API Response</summary>
    <pre>{req.ApiResponse}</pre>
  </details>
)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
