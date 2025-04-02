import { useState, useEffect } from "react";
import Post from "./Post";
import PostForm from "./PostForm";

export default function PostList() {
	const [posts, setPosts] = useState([]);
	const [responsesByParent, setResponsesByParent] = useState({});

	// Load posts on initial render and every 5 seconds
	useEffect(() => {
		loadPosts();
		const intervalID = setInterval(loadPosts, 5000);
		return () => clearInterval(intervalID);
	}, []);

	const loadPosts = async () => {
		try {
			const response = await fetch("/alldata");
			const data = await response.json();
			setPosts(data.posts);

			// Organize responses by parent ID
			const responseMap = {};
			data.responses.forEach((response) => {
				if (!responseMap[response.parentID]) {
					responseMap[response.parentID] = [];
				}
				responseMap[response.parentID].push(response);
			});
			setResponsesByParent(responseMap);
		} catch (error) {
			console.error("Failed to load posts", error);
		}
	};

	return (
		<>
			<h1>Programming Channels</h1>
			<PostForm onPostCreated={loadPosts} />
			<div className="Post-Container">
				{posts.map((post) => (
					<Post
						key={post.id}
						post={post}
						responsesByParent={responsesByParent}
						onResponseCreated={loadPosts}
					/>
				))}
			</div>
		</>
	);
}
