import { useState, useEffect } from "react";
import "./AdminComponents.css";

export default function AdminUsers() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await fetch("/admin/users");
			const data = await response.json();

			if (data.success) {
				setUsers(data.users);
			} else {
				setError("Failed to load users");
			}
		} catch (err) {
			setError("An error occurred while fetching users");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const deleteUser = async (userId) => {
		if (!confirm("Are you sure you want to delete this user?")) {
			return;
		}

		try {
			const response = await fetch(`/admin/user/${userId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (data.success) {
				fetchUsers(); // Refresh the user list
			} else {
				setError("Failed to delete user");
			}
		} catch (err) {
			setError("An error occurred while deleting the user");
			console.error(err);
		}
	};

	if (loading) return <div className="loading">Loading users...</div>;
	if (error) return <div className="error">{error}</div>;

	return (
		<div className="admin-component">
			<h2>User Management</h2>

			{users.length === 0 ? (
				<p>No users found.</p>
			) : (
				<div className="admin-table-container">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Username</th>
								<th>Display Name</th>
								<th>Role</th>
								<th>Created At</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user.id}>
									<td>{user.username}</td>
									<td>{user.displayName}</td>
									<td>{user.role}</td>
									<td>{user.createdAt}</td>
									<td>
										<button
											className="delete-button"
											onClick={() => deleteUser(user.id)}
											disabled={user.username === "admin"} // Prevent deleting the main admin
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
