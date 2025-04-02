import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Homepage from "./Pages/Homepage.jsx";
import LandingPage from "./Pages/LandingPage.jsx";

const router = createBrowserRouter([
	{ path: "/", element: <LandingPage /> },
	{ path: "/home", element: <Homepage /> },
]);

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
);
