import { useState, useEffect } from "react";
import "./AdminComponents.css";

export default function AdminResponses() {
	const [responses, setResponses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [postMap, setPostMap] = useState({});

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);

			// Fetch all data
			const dataResponse = await fetch("/alldata");
			const data = await dataResponse.json();

			// Create a map of post IDs to post titles for context
			const posts = {};
			data.posts.forEach((post) => {
				posts[post.id] = post.topic;
			});

			setPostMap(posts);
			setResponses(data.responses);
		} catch (err) {
			setError("An error occurred while fetching data");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const deleteResponse = async (responseId) => {
		if (!confirm("Are you sure you want to delete this response?")) {
			return;
		}

		try {
			const response = await fetch(`/admin/response/${responseId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (data.success) {
				fetchData(); // Refresh the response list
			} else {
				setError("Failed to delete response");
			}
		} catch (err) {
			setError("An error occurred while deleting the response");
			console.error(err);
		}
	};

	const getParentDescription = (parentId) => {
		// Check if the parent is a post (we have its topic)
		if (postMap[parentId]) {
			return `Post: ${postMap[parentId]}`;
		}

		// Otherwise, it's a response to another response
		return `Response: ${parentId.substring(0, 8)}...`;
	};

	if (loading) return <div className="loading">Loading responses...</div>;
	if (error) return <div className="error">{error}</div>;

	return (
		<div className="admin-component">
			<h2>Response Management</h2>

			{responses.length === 0 ? (
				<p>No responses found.</p>
			) : (
				<div className="admin-table-container">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Content</th>
								<th>Parent</th>
								<th>Created At</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{responses.map((response) => (
								<tr key={response.id}>
									<td className="content-cell">
										{response.data}
									</td>
									<td>
										{getParentDescription(
											response.parentID
										)}
									</td>
									<td>{response.timestamp}</td>
									<td>
										<button
											className="delete-button"
											onClick={() =>
												deleteResponse(response.id)
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
