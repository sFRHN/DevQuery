import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Homepage from "./Pages/Homepage.jsx";
import LandingPage from "./Pages/LandingPage.jsx";
import { AuthProvider } from "./Components/AuthContext.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import AdminPanel from "./Pages/AdminPanel.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RouterProvider
			router={createBrowserRouter([
				{
					path: "/",
					element: (
						<AuthProvider>
							<LandingPage />
						</AuthProvider>
					),
				},
				{
					path: "/home",
					element: (
						<AuthProvider>
							<ProtectedRoute>
								<Homepage />
							</ProtectedRoute>
						</AuthProvider>
					),
				},
				{
					path: "/admin",
					element: (
						<AuthProvider>
							<ProtectedRoute adminOnly={true}>
								<AdminPanel />
							</ProtectedRoute>
						</AuthProvider>
					),
				},
			])}
		/>
	</StrictMode>
);
