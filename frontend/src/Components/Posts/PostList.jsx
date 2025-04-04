import { useState, useEffect } from "react";
import Post from "./Post";
import PostForm from "./PostForm";
import "./Posts.css";

export default function PostList({ channelID }) {
	const [posts, setPosts] = useState([]);
	const [responsesByParent, setResponsesByParent] = useState({});
	const [channelName, setChannelName] = useState("");

	// Load posts on initial render and every 5 seconds
	useEffect(() => {
		loadPosts();
		const intervalID = setInterval(loadPosts, 5000);
		return () => clearInterval(intervalID);
	}, [channelID]);

	const loadPosts = async () => {
		try {
			const response = await fetch(`/channel/${channelID}`);
			const data = await response.json();
			setPosts(data.posts);
			setChannelName(data.channelName);

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
		<div className="posts-container">
			<h1>{channelName || "Channel"}</h1>
			<PostForm onPostCreated={loadPosts} channelID={channelID} />
			<div className="post-list">
				{posts.length > 0 ? (
					posts.map((post) => (
						<Post
							key={post.id}
							post={post}
							responsesByParent={responsesByParent}
							onResponseCreated={loadPosts}
						/>
					))
				) : (
					<div className="no-posts-message">
						<p>
							No posts yet in this channel. Be the first to post!
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
