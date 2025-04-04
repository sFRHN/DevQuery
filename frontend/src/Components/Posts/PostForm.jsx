import { useState } from "react";

export default function PostForm({ onPostCreated, channelID }) {
	const [postTitle, setPostTitle] = useState("");
	const [postData, setPostData] = useState("");
	const [postImage, setPostImage] = useState(null);
	const [selectedFileName, setSelectedFileName] = useState("");

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setPostImage(file);
			setSelectedFileName(file.name);
		} else {
			setPostImage(null);
			setSelectedFileName("");
		}
	};

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
				setSelectedFileName("");
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
				placeholder="Title your question or topic"
				value={postTitle}
				onChange={(e) => setPostTitle(e.target.value)}
			/>
			<input
				type="text"
				placeholder="Describe your question or share knowledge"
				value={postData}
				onChange={(e) => setPostData(e.target.value)}
			/>
			<div className="post-image-input">
				<input
					type="file"
					accept="image/*"
					onChange={handleFileChange}
				/>
				{selectedFileName && (
					<p className="file-name">{selectedFileName}</p>
				)}
			</div>
			<button onClick={createPost}>Post Question</button>
		</div>
	);
}
