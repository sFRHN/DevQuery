import { useState } from "react";

export default function ResponseForm({ parentID, onResponseCreated }) {
	const [responseText, setResponseText] = useState("");

	const createResponse = async () => {
		if (!responseText) return;

		try {
			const response = await fetch("/postresponse", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					parentID: parentID,
					data: responseText,
				}),
			});
			const result = await response.json();

			if (result.success) {
				setResponseText("");
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
			<button onClick={createResponse}>Submit</button>
		</div>
	);
}
