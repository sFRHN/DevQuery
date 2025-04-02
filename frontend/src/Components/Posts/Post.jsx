import { useState } from "react";
import ResponseList from "../Responses/ResponseList";
import ResponseForm from "../Responses/ResponseForm";

export default function Post({ post, responsesByParent, onResponseCreated }) {
	const [showForm, setShowForm] = useState(false);

	const toggleForm = () => {
		setShowForm(!showForm);
	};

	return (
		<div className="post">
			<h2>{post.topic}</h2>
			<p>{post.data}</p>
			<p>{post.timestamp}</p>
			<button onClick={toggleForm}>{showForm ? "Hide" : "Reply"}</button>

			{showForm && (
				<ResponseForm
					parentID={post.id}
					onResponseCreated={() => {
						onResponseCreated();
						toggleForm();
					}}
				/>
			)}

			<ResponseList
				parentID={post.id}
				responsesByParent={responsesByParent}
				onResponseCreated={onResponseCreated}
			/>
		</div>
	);
}
