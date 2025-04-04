import { useState } from "react";
import ResponseList from "../Responses/ResponseList";
import ResponseForm from "../Responses/ResponseForm";
import Votes from "../Votes/Votes";

export default function Post({ post, responsesByParent, onResponseCreated }) {
	const [showForm, setShowForm] = useState(false);

	const toggleForm = () => {
		setShowForm(!showForm);
	};

	return (
		<div className="post">
			<h2>{post.topic}</h2>
			<p className="post-content">{post.data}</p>
			<p className="post-timestamp">
				Posted by {post.creatorDisplayName} • {post.timestamp}
			</p>

			<Votes item={post} onResponseCreated={onResponseCreated} />

			{post.hasImage && (
				<div className="post-image">
					<img src={`/image/${post.id}`} alt="Post Attachment" />
				</div>
			)}

			<button onClick={toggleForm}>
				{showForm ? "Cancel Reply" : "Reply"}
			</button>

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
