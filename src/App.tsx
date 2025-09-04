import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import { DoctorRoomPage } from "./pages/DoctorRoomPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor" element={<DoctorRoomPage />} />
          <Route path="/doctor/*" element={<DoctorRoomPage />} />
          <Route path="/doctor.html" element={<Navigate to="/doctor" replace />} />
          
          {/* Utility Routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;