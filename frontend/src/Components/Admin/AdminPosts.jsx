import { useState, useEffect } from "react";
import "./AdminComponents.css";

export default function AdminPosts() {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [channels, setChannels] = useState({});

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);

			// Fetch all posts
			const postsResponse = await fetch("/alldata");
			const postsData = await postsResponse.json();

			// Fetch all channels to get names
			const channelsResponse = await fetch("/allchannels");
			const channelsData = await channelsResponse.json();

			// Create a map of channel IDs to channel names
			const channelMap = {};
			channelsData.forEach((channel) => {
				channelMap[channel.id] = channel.name;
			});

			setChannels(channelMap);
			setPosts(postsData.posts);
		} catch (err) {
			setError("An error occurred while fetching data");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const deletePost = async (postId) => {
		if (
			!confirm(
				"Are you sure you want to delete this post? All associated responses will be orphaned."
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/admin/post/${postId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (data.success) {
				fetchData(); // Refresh the post list
			} else {
				setError("Failed to delete post");
			}
		} catch (err) {
			setError("An error occurred while deleting the post");
			console.error(err);
		}
	};

	if (loading) return <div className="loading">Loading posts...</div>;
	if (error) return <div className="error">{error}</div>;

	return (
		<div className="admin-component">
			<h2>Post Management</h2>

			{posts.length === 0 ? (
				<p>No posts found.</p>
			) : (
				<div className="admin-table-container">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Topic</th>
								<th>Content</th>
								<th>Channel</th>
								<th>Created At</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{posts.map((post) => (
								<tr key={post.id}>
									<td>{post.topic}</td>
									<td className="content-cell">
										{post.data}
									</td>
									<td>
										{channels[post.channelID] || "Unknown"}
									</td>
									<td>{post.timestamp}</td>
									<td>
										<button
											className="delete-button"
											onClick={() => deletePost(post.id)}
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
