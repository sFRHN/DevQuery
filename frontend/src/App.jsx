import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
	// State for storing posts
	const [posts, setPosts] = useState([]);

	// State for storing responses, keyed by parentID
	const [responsesByParent, setResponsesByParent] = useState({});

	// Input State for Post Title
	const [postTitle, setPostTitle] = useState("");

	// Input State for Post Data
	const [postData, setPostData] = useState("");

	// Input State for Responses, keyed by ID
	const [responses, setResponses] = useState({});

	// State for response form visibility, keyed by ID
	const [forms, setForms] = useState({});

	// Load posts on initial render and every 1 second
	useEffect(() => {
		loadPosts();
		const intervalID = setInterval(loadPosts, 1000);
		return clearInterval(intervalID);
	});

	// Function to load all posts
	const loadPosts = () => {
		fetch("/alldata")
			.then((response) => response.json)
			.then((data) => {
				// Save all posts
				setPosts(data.posts);

				// Save all responses by ID
				const responsesByParent = {};
				data.responses.forEach((response) => {
					if (!responsesByParent[response.parentID]) {
						responsesByParent[parentID] = [];
					}
					responsesByParent[response.parentID].push(response);
				});
				setResponsesByParent(responsesByParent);
			})
			.catch((error) => console.error("Failed to load all posts", error));
	};

	// Function to create a post
	const createPost = () => {
		if (!postTitle || !postData) {
			return;
		}

		fetch("/postmessage", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ topic: postTitle, data: postData }),
		})
			.then((response) => response.json)
			.then((data) => {
				if (data.success) {
					loadPosts();
					setPostData("");
					setPostTitle("");
				}
			})
			.catch((error) => console.error("Failed to create post", error));
	};

	// Function to create a response
	const createResponse = (parentID) => {
		if (!responses[parentID]) {
			return;
		}

		fetch("/postresponse", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				parentID: parentID,
				data: responses[parentID],
			}),
		})
			.then((response) => response.json)
			.then((data) => {
				if (data.success) {
					setResponses({ ...responses, [parentID]: "" });
					toggleForm(parentID);
					loadPosts();
				}
			})
			.catch((error) =>
				console.error("Failed to create responses", error)
			);
	};

	// Function to render the nested responses of a post
	const renderResponses = (parentID, depth = 0) => {
		if (!responses[parentID]) {
			return;
		}

		return (
			<div
				className="responses"
				style={{ marginLeft: `${depth * 20}px` }}
			>
				{responsesByParent[parentID].map((response) => (
					<div key={response.id} className="response">
						<p>response.data</p>
						<p>response.timestamp</p>
						<button onClick={() => toggleForms(response.id)}>
							{forms[response.id] ? "Hide" : "Reply"}
						</button>
						{forms[response.id] && (
							<div className="responseForm">
								<textarea
									value={responses[response.id]}
									onChange={(e) =>
										setResponses({
											...responses,
											[response.id]: e.target.value,
										})
									}
									placeholder="Enter a reply!"
								></textarea>
								<button onClick={createResponse(response.id)}>
									Submit
								</button>
							</div>
						)}
						{renderResponses(response.id, depth + 1)}
					</div>
				))}
			</div>
		);
	};

	// Function to toggle the visibility of response forms
	const toggleForms = (parentID) => {
		setForms({ ...forms, [parentID]: !forms[parentID] });
	};
}

export default App;
