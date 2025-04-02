import { useState } from "react";
import ResponseForm from "./ResponseForm";

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
