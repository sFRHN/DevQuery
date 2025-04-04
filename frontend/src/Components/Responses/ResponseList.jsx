import { useState } from "react";
import ResponseForm from "./ResponseForm";
import Votes from "../Votes/Votes";

export default function ResponseList({
	parentID,
	responsesByParent,
	onResponseCreated,
	depth = 0,
}) {
	const [visibleForms, setVisibleForms] = useState({});

	if (!responsesByParent[parentID]) {
		return null;
	}

	const toggleForm = (responseId) => {
		setVisibleForms({
			...visibleForms,
			[responseId]: !visibleForms[responseId],
		});
	};

	return (
		<div className="responses" style={{ marginLeft: `${depth * 20}px` }}>
			{responsesByParent[parentID].map((response) => (
				<div key={response.id} className="response">
					<p>{response.data}</p>
					<p>{response.timestamp}</p>

					<Votes
						item={response}
						onResponseCreated={onResponseCreated}
					/>

					{response.hasImage && (
						<div className="response-image">
							<img
								src={`/image/${response.id}`}
								alt="Response Attachment"
								style={{ width: "200px", height: "200px" }}
							/>
						</div>
					)}

					<button onClick={() => toggleForm(response.id)}>
						{visibleForms[response.id] ? "Hide" : "Reply"}
					</button>

					{visibleForms[response.id] && (
						<ResponseForm
							parentID={response.id}
							onResponseCreated={() => {
								onResponseCreated();
								toggleForm(response.id);
							}}
						/>
					)}

					<ResponseList
						parentID={response.id}
						responsesByParent={responsesByParent}
						onResponseCreated={onResponseCreated}
						depth={depth + 1}
					/>
				</div>
			))}
		</div>
	);
}
