import { useState } from "react";

export default function ResponseForm({ parentID, onResponseCreated }) {
	const [responseText, setResponseText] = useState("");
	const [responseImage, setResponseImage] = useState(null);

	const createResponse = async () => {
		if (!responseText) return;

		try {
			const formData = new FormData();

			formData.append("parentID", parentID);
			formData.append("data", responseText);

			if (responseImage) {
				formData.append("image", responseImage);
			}

			const response = await fetch("/postresponse", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (result.success) {
				setResponseText("");
				setResponseImage(null);
				if (onResponseCreated) onResponseCreated();
			}
		} catch (error) {
			console.error("Failed to create response", error);
		}
	};

	return (
		<div className="response-form">
			<textarea
				value={responseText}
				onChange={(e) => setResponseText(e.target.value)}
				placeholder="Enter a reply!"
			></textarea>
			<div className="response-image-input">
				<input
					type="file"
					accept="image/*"
					onChange={(e) => setResponseImage(e.target.files[0])}
				/>
			</div>
			<button onClick={createResponse}>Submit</button>
		</div>
	);
}
