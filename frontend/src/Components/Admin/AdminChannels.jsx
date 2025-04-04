import { useState, useEffect } from "react";
import "./AdminComponents.css";

export default function AdminChannels() {
	const [channels, setChannels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchChannels();
	}, []);

	const fetchChannels = async () => {
		try {
			setLoading(true);
			const response = await fetch("/allchannels");
			const data = await response.json();

			if (data) {
				setChannels(data);
			} else {
				setError("Failed to load channels");
			}
		} catch (err) {
			setError("An error occurred while fetching channels");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const deleteChannel = async (channelId) => {
		if (
			!confirm(
				"Are you sure you want to delete this channel? All associated posts will be orphaned."
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/admin/channel/${channelId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (data.success) {
				fetchChannels(); // Refresh the channel list
			} else {
				setError("Failed to delete channel");
			}
		} catch (err) {
			setError("An error occurred while deleting the channel");
			console.error(err);
		}
	};

	if (loading) return <div className="loading">Loading channels...</div>;
	if (error) return <div className="error">{error}</div>;

	return (
		<div className="admin-component">
			<h2>Channel Management</h2>

			{channels.length === 0 ? (
				<p>No channels found.</p>
			) : (
				<div className="admin-table-container">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Created At</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{channels.map((channel) => (
								<tr key={channel.id}>
									<td>{channel.name}</td>
									<td>{channel.timestamp}</td>
									<td>
										<button
											className="delete-button"
											onClick={() =>
												deleteChannel(channel.id)
											}
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
