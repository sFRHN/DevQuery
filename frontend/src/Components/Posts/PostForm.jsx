import { useState } from "react";

export default function PostForm({ onPostCreated, channelID }) {
	const [postTitle, setPostTitle] = useState("");
	const [postData, setPostData] = useState("");
	const [postImage, setPostImage] = useState(null);

	const createPost = async () => {
		if (!postTitle || !postData) {
			return;
		}

		try {
			const formData = new FormData();

			formData.append("topic", postTitle);
			formData.append("data", postData);
			formData.append("channelID", channelID);

			if (postImage) {
				formData.append("image", postImage);
			}

			const response = await fetch("/postmessage", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (result.success) {
				setPostTitle("");
				setPostData("");
				setPostImage(null);
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
			<div className="post-image-input">
				<input
					type="file"
					accept="image/*"
					onChange={(e) => setPostImage(e.target.files[0])}
				/>
			</div>
			<button onClick={createPost}>Submit Post</button>
		</div>
	);
}
