import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute";

describe("ProtectedRoute", () => {
  it("renders loading spinner while Firebase auth state is resolving", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute isLoggedIn={false} authLoading={true} setShowForm={() => {}}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating secure session/i)).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated visitors to landing and prompts login form", () => {
    const setShowForm = vi.fn();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isLoggedIn={false} authLoading={false} setShowForm={setShowForm}>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Landing Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Landing Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(setShowForm).toHaveBeenCalledWith(true);
  });

  it("renders protected child content when user is logged in and auth is ready", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute isLoggedIn={true} authLoading={false} setShowForm={() => {}}>
          <div data-testid="dashboard-view">Welcome to FinSight Dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId("dashboard-view")).toBeInTheDocument();
    expect(screen.getByText("Welcome to FinSight Dashboard")).toBeInTheDocument();
  });
});
