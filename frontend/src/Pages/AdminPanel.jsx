import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
import AdminUsers from "../Components/Admin/AdminUsers";
import AdminChannels from "../Components/Admin/AdminChannels";
import AdminPosts from "../Components/Admin/AdminPosts";
import AdminResponses from "../Components/Admin/AdminResponses";
import "./AdminPanel.css";

export default function AdminPanel() {
	const [selectedView, setSelectedView] = useState("users");
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleViewChange = (e) => {
		setSelectedView(e.target.value);
	};

	const goBack = () => {
		navigate("/home");
	};

	return (
		<div className="admin-panel">
			<div className="admin-header">
				<h1>Admin Panel</h1>
				<div className="admin-controls">
					<div className="user-info">
						Logged in as: {user?.displayName}{" "}
						<span className="admin-tag">(Admin)</span>
					</div>
					<button onClick={goBack} className="back-button">
						Back to Main
					</button>
					<button onClick={logout} className="logout-button">
						Logout
					</button>
				</div>
			</div>

			<div className="admin-content">
				<div className="admin-sidebar">
					<select
						value={selectedView}
						onChange={handleViewChange}
						className="admin-selector"
					>
						<option value="users">Users</option>
						<option value="channels">Channels</option>
						<option value="posts">Posts</option>
						<option value="responses">Responses</option>
					</select>
				</div>

				<div className="admin-main-content">
					{selectedView === "users" && <AdminUsers />}
					{selectedView === "channels" && <AdminChannels />}
					{selectedView === "posts" && <AdminPosts />}
					{selectedView === "responses" && <AdminResponses />}
				</div>
			</div>
		</div>
	);
}
