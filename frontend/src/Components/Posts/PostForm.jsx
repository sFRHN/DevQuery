import { useState } from "react";

export default function PostForm({ onPostCreated, channelID }) {
	const [postTitle, setPostTitle] = useState("");
	const [postData, setPostData] = useState("");

	const createPost = async () => {
		if (!postTitle || !postData) {
			return;
		}

		try {
			const response = await fetch("/postmessage", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					topic: postTitle,
					data: postData,
					channelID: channelID,
				}),
			});

			const result = await response.json();

			if (result.success) {
				setPostTitle("");
				setPostData("");
				if (onPostCreated) onPostCreated();
			}
		} catch (error) {
			console.error("Failed to create post", error);
		}
	};

	return (
		<div className="create-post">
			<input
				type="text"
				placeholder="Enter a title"
				value={postTitle}
				onChange={(e) => setPostTitle(e.target.value)}
			/>
			<input
				type="text"
				placeholder="Enter the data"
				value={postData}
				onChange={(e) => setPostData(e.target.value)}
			/>
			<button onClick={createPost}>Submit Post</button>
		</div>
	);
}
