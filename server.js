const express = require("express");
const app = express();
const path = require("path");
const nano = require("nano");
const multer = require("multer");
const session = require("express-session");
const PORT = 3000;
const HOST = `0.0.0.0`;

// CouchDB configuration
const couchUrl =
	process.env.COUCHDB_URL || "http://admin:password@localhost:5984";
const couch = nano(couchUrl);
const dbName = "postsdb";

// Set up CouchDB database and views
(async function setup() {
	const maxRetries = 10;
	const retryDelay = 5000; // 5 seconds

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(
				`Attempt ${attempt}/${maxRetries} to set up CouchDB...`
			);

			// Get reference to the database
			const db = couch.use(dbName);
			await db.info(); // Check if we can connect

			// Define design document with views
			const designDoc = {
				_id: "_design/app",
				views: {
					posts: {
						map: function (doc) {
							if (doc.type === "post") {
								emit([doc.channelID, doc._id], doc);
							}
						}.toString(),
					},
					responses_by_parent: {
						map: function (doc) {
							if (doc.type === "response") {
								emit(doc.parentID, doc);
							}
						}.toString(),
					},
					channels: {
						map: function (doc) {
							if (doc.type === "channel") {
								emit(doc._id, doc);
							}
						}.toString(),
					},
					users: {
						map: function (doc) {
							if (doc.type === "user") {
								emit(doc.username, doc);
							}
						}.toString(),
					},
					users_by_id: {
						map: function (doc) {
							if (doc.type === "user") {
								emit(doc._id, doc);
							}
						}.toString(),
					},
					search_content: {
						map: function (doc) {
							if (
								doc.type === "post" ||
								doc.type === "response"
							) {
								var text = "";
								if (doc.type === "post") {
									text = doc.topic + " " + doc.data;
								} else {
									text = doc.data;
								}
								emit(doc._id, {
									text: text.toLowerCase(),
									doc: doc,
								});
							}
						}.toString(),
					},
					posts_count_by_user: {
						map: function (doc) {
							if (doc.type === "post") {
								emit(doc.creatorUsername, 1);
							}
						}.toString(),
						reduce: function (keys, values) {
							return sum(values);
						}.toString(),
					},
					responses_count_by_user: {
						map: function (doc) {
							if (doc.type === "response") {
								emit(doc.creatorUsername, 1);
							}
						}.toString(),
						reduce: function (keys, values) {
							return sum(values);
						}.toString(),
					},
				},
			};

			// Update or create the design document
			try {
				const existingDesignDoc = await db.get("_design/app");
				designDoc._rev = existingDesignDoc._rev;
				await db.insert(designDoc);
				console.log("Design document updated successfully");
			} catch (err) {
				if (err.statusCode === 404) {
					await db.insert(designDoc);
					console.log("Design document created successfully");
				} else {
					throw err;
				}
			}

			// Create an admin for the system
			try {
				const admin = await db.view("app", "users", {
					key: "admin",
				});

				if (admin.rows.length === 0) {
					// Admin doesn't exist, create it
					const adminUser = {
						type: "user",
						username: "admin",
						password: "adminpass",
						displayName: "System Administrator",
						role: "admin",
						createdAt: new Date().toLocaleString("en-US", {
							timeZone: "America/Regina",
							hour12: true,
						}),
					};

					await db.insert(adminUser);
					console.log("Admin user created successfully");
				} else {
					console.log("Admin user already exists");
				}
			} catch (err) {
				console.error("Error checking/creating admin user:", err);
			}

			console.log("CouchDB setup completed successfully!");
			return;
		} catch (err) {
			console.error(`Attempt ${attempt} failed:`, err.message);
			if (attempt === maxRetries) {
				console.error("Max retries reached. Setup failed.");
				process.exit(1);
			}
			console.log(`Retrying in ${retryDelay / 1000} seconds...`);
			await new Promise((resolve) => setTimeout(resolve, retryDelay));
		}
	}
})();

// Get database reference for route handlers
const db = couch.use(dbName);

app.use(express.json());

// Session Middleware
app.use(
	session({
		secret: "cmpt353-project",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
	})
);

// Authentication middleware
const authenticateUser = (req, res, next) => {
	if (!req.session.user) {
		return res
			.status(401)
			.json({ success: false, error: "Authentication required" });
	}
	next();
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
	if (!req.session.user || req.session.user.role !== "admin") {
		return res
			.status(403)
			.json({ success: false, error: "Admin access required" });
	}
	next();
};

// Store files in memory temporarily
const upload = multer({
	storage: multer.memoryStorage(),
});

// Serve React Frontend
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.post("/createChannel", authenticateUser, async (req, res) => {
	const { channelName } = req.body;
	const user = req.session.user;

	if (!channelName) {
		return res
			.status(400)
			.json({ success: false, error: "Missing channel name" });
	}

	try {
		const newChannel = {
			type: "channel",
			name: channelName,
			creatorID: user.id,
			creatorUsername: user.username,
			creatorDisplayName: user.displayName,
			timestamp: new Date().toLocaleString("en-US", {
				timeZone: "America/Regina",
				hour12: true,
			}),
		};

		const response = await db.insert(newChannel);
		res.status(200).json({ success: true, id: response.id });
	} catch (err) {
		console.error("Error creating posts", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to add a post
app.post(
	"/postmessage",
	authenticateUser,
	upload.single("image"),
	async (req, res) => {
		const { topic, data, channelID } = req.body;
		const user = req.session.user;

		if (!topic || !data || !channelID) {
			return res
				.status(400)
				.json({ success: false, error: "Missing topic/data/channel" });
		}

		try {
			const newPost = {
				type: "post",
				topic: topic,
				data: data,
				channelID: channelID,
				creatorID: user.id,
				creatorUsername: user.username,
				creatorDisplayName: user.displayName,
				image: null,
				timestamp: new Date().toLocaleString("en-US", {
					timeZone: "America/Regina",
					hour12: true,
				}),
				votes: null,
			};

			if (req.file) {
				newPost.image = {
					originalname: req.file.originalname,
					mimetype: req.file.mimetype,
					buffer: req.file.buffer.toString("base64"),
				};
			}

			const response = await db.insert(newPost);
			res.status(200).json({ success: true, id: response.id });
		} catch (err) {
			console.error("Error creating post:", err);
			res.status(500).json({ success: false, error: "Database error" });
		}
	}
);

// Endpoint to add a response
app.post(
	"/postresponse",
	authenticateUser,
	upload.single("image"),
	async (req, res) => {
		const { parentID, data } = req.body;
		const user = req.session.user;

		if (!parentID || !data) {
			return res
				.status(400)
				.json({ success: false, error: "Missing parentID/data" });
		}

		try {
			// Verify the parent (post or response) exists
			try {
				await db.get(parentID);
			} catch (err) {
				return res
					.status(404)
					.json({ success: false, error: "Parent not found" });
			}

			const newResponse = {
				type: "response",
				parentID: parentID,
				data: data,
				creatorID: user.id,
				creatorUsername: user.username,
				creatorDisplayName: user.displayName,
				image: null,
				timestamp: new Date().toLocaleString("en-US", {
					timeZone: "America/Regina",
					hour12: true,
				}),
				votes: null,
			};

			if (req.file) {
				newResponse.image = {
					originalname: req.file.originalname,
					mimetype: req.file.mimetype,
					buffer: req.file.buffer.toString("base64"),
				};
			}

			const response = await db.insert(newResponse);
			res.status(200).json({ success: true, responseID: response.id });
		} catch (err) {
			console.error("Error creating response:", err);
			res.status(500).json({ success: false, error: "Database error" });
		}
	}
);

// Endpoint to retrieve all data
app.get("/alldata", authenticateUser, async (req, res) => {
	try {
		// Get all posts
		const postsResult = await db.view("app", "posts");
		const posts = postsResult.rows.map((row) => {
			const post = row.value;
			return {
				id: row.id,
				topic: post.topic,
				data: post.data,
				timestamp: post.timestamp,
			};
		});

		// Get all responses
		const responsesResult = await db.view("app", "responses_by_parent");
		const responses = responsesResult.rows.map((row) => {
			const response = row.value;
			return {
				id: row.id,
				parentID: response.parentID,
				data: response.data,
				timestamp: response.timestamp,
			};
		});

		res.status(200).json({ posts, responses });
	} catch (err) {
		console.error("Error retrieving data:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to retrieve all channels
app.get("/allchannels", authenticateUser, async (req, res) => {
	try {
		const channelResult = await db.view("app", "channels");
		const channels = channelResult.rows.map((row) => {
			const channel = row.value;
			return {
				id: row.id,
				name: channel.name,
				timestamp: channel.timestamp,
			};
		});
		res.status(200).json(channels);
	} catch (err) {
		console.error("Error retrieving channels:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to retrieve channel data
app.get("/channel/:channelID", authenticateUser, async (req, res) => {
	const { channelID } = req.params;
	const user = req.session.user;

	if (!channelID) {
		return res
			.status(400)
			.json({ success: false, error: "Missing channelID" });
	}

	try {
		const postsResult = await db.view("app", "posts");
		const posts = postsResult.rows
			.map((row) => {
				const post = row.value;
				return {
					id: row.id,
					topic: post.topic,
					data: post.data,
					timestamp: post.timestamp,
					channelID: post.channelID,
					creatorID: post.creatorID,
					creatorUsername: post.creatorUsername,
					creatorDisplayName: post.creatorDisplayName,
					hasImage: post.image !== null,
					imageType: post.image?.mimetype || null,
					imageName: post.image?.originalname || null,
					votes: post.votes || { upvotes: [], downvotes: [] },
				};
			})
			.filter((post) => post.channelID === channelID);

		const channel = await db.get(channelID);
		const channelName = channel.name;

		// Get all responses
		const responsesResult = await db.view("app", "responses_by_parent");
		const responses = responsesResult.rows.map((row) => {
			const response = row.value;
			return {
				id: row.id,
				parentID: response.parentID,
				data: response.data,
				creatorID: response.creatorID,
				creatorUsername: response.creatorUsername,
				creatorDisplayName: response.creatorDisplayName,
				timestamp: response.timestamp,
				hasImage: response.image !== null,
				imageType: response.image?.mimetype || null,
				imageName: response.image?.originalname || null,
				votes: response.votes || { upvotes: [], downvotes: [] },
			};
		});

		res.status(200).json({ posts, responses, channelName });
	} catch (err) {
		console.log("Error retrieving channel info", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to serve files
app.get("/image/:id", authenticateUser, async (req, res) => {
	try {
		const { id } = req.params;
		const doc = await db.get(id);

		if (!doc.image) {
			return res
				.status(404)
				.json({ success: false, error: "No file found" });
		}

		res.setHeader("Content-Type", doc.image.mimetype);
		res.setHeader(
			"Content-Disposition",
			`inline; filename="${doc.image.originalname}"`
		);

		try {
			const image = Buffer.from(doc.image.buffer, "base64");
			res.send(image);
		} catch (error) {
			console.error("Buffer error:", error);
			res.status(500).json({
				success: false,
				error: "Conversion error",
			});
		}
	} catch (err) {
		console.error("File not found", err);
		res.status(500).json({
			success: false,
			error: "Database Error",
		});
	}
});

// Registration Endpoint
app.post("/register", async (req, res) => {
	const { username, password, displayName } = req.body;

	if (!username || !password || !displayName) {
		return res.status(400).json({
			success: false,
			error: "Missing required fields",
		});
	}

	try {
		// Check if username already exists
		const result = await db.view("app", "users", { key: username });
		if (result.rows.length !== 0) {
			return res.status(400).json({
				success: false,
				error: "Username already exists",
			});
		}

		// Create new user
		const newUser = {
			type: "user",
			username,
			displayName,
			password,
			role: "user",
			createdAt: new Date().toLocaleString("en-US", {
				timeZone: "America/Regina",
				hour12: true,
			}),
		};

		const response = await db.insert(newUser);

		// Create session for the new user (add this!)
		req.session.user = {
			id: response.id,
			username: newUser.username,
			displayName: newUser.displayName,
			role: newUser.role,
		};

		// Return user data in response
		res.status(200).json({
			success: true,
			user: req.session.user,
		});
	} catch (err) {
		console.error("Error registering users:", err);
		res.status(500).json({
			success: false,
			error: "Database error",
		});
	}
});

// Login endpoint
app.post("/login", async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({
			success: false,
			error: "Missing required fields",
		});
	}

	try {
		const results = await db.view("app", "users", { key: username });

		if (results.rows.length === 0) {
			return res.status(400).json({
				success: false,
				error: "User does not exist",
			});
		}

		const user = results.rows[0].value;

		// Check password match
		if (user.password !== password) {
			return res.status(400).json({
				success: false,
				error: "Invalid Password",
			});
		}

		// Create a new session
		req.session.user = {
			id: results.rows[0].id,
			username: user.username,
			displayName: user.displayName,
			role: user.role,
		};

		res.status(200).json({
			success: true,
			user: req.session.user,
		});
	} catch (err) {
		console.error("Error logging in");
		res.status(500).json({
			success: false,
			error: "Session creation failed",
		});
	}
});

// Logout endpoint
app.post("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res
				.status(500)
				.json({ success: false, error: "Logout failed" });
		}
		res.status(200).json({
			success: true,
			message: "Logged out successfully",
		});
	});
});

// Get current user info
app.get("/current-user", (req, res) => {
	if (!req.session.user) {
		return res.status(401).json({
			success: false,
			error: "Not authenticated",
		});
	}

	res.status(200).json({
		success: true,
		user: req.session.user,
	});
});

// Admin endpoint - Get all users
app.get("/admin/users", authenticateAdmin, async (req, res) => {
	try {
		const results = await db.view("app", "users_by_id");
		const users = results.rows.map((row) => {
			const user = row.value;
			return {
				id: row.id,
				username: user.username,
				displayName: user.displayName,
				role: user.role,
				createdAt: user.createdAt,
			};
		});

		res.status(200).json({
			success: true,
			users,
		});
	} catch (err) {
		console.error("Error retrieving users:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Admin endpoint - Delete user
app.delete("/admin/user/:userID", authenticateAdmin, async (req, res) => {
	const { userID } = req.params;

	if (!userID) {
		return res.status(400).json({
			success: false,
			error: "Missing user ID",
		});
	}

	try {
		const user = await db.get(userID);
		await db.destroy(user._id, user._rev);
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (err) {
		console.error("Error deleting user:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Admin enpoint - Delete a channel
app.delete("/admin/channel/:channelID", authenticateAdmin, async (req, res) => {
	const { channelID } = req.params;

	if (!channelID) {
		return res.status(400).json({
			success: false,
			error: "Missing channel ID",
		});
	}

	try {
		const channel = await db.get(channelID);
		await db.destroy(channel._id, channel._rev);
		res.status(200).json({
			success: true,
			message: "Channel deleted successfully",
		});
	} catch (err) {
		console.error("Error deleting channel:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Admin endpoint - Delete a post
app.delete("/admin/post/:postID", authenticateAdmin, async (req, res) => {
	const { postID } = req.params;

	if (!postID) {
		return res.status(400).json({
			success: false,
			error: "Missing post ID",
		});
	}

	try {
		const post = await db.get(postID);
		await db.destroy(post._id, post._rev);
		res.status(200).json({
			success: true,
			message: "Post deleted successfully",
		});
	} catch (err) {
		console.error("Error deleting post:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Admin endpoint - Delete a response
app.delete(
	"/admin/response/:responseID",
	authenticateAdmin,
	async (req, res) => {
		const { responseID } = req.params;

		if (!responseID) {
			return res.status(400).json({
				success: false,
				error: "Missing response ID",
			});
		}

		try {
			const response = await db.get(responseID);
			await db.destroy(response._id, response._rev);
			res.status(200).json({
				success: true,
				message: "Response deleted successfully",
			});
		} catch (err) {
			console.error("Error deleting response:", err);
			res.status(500).json({ success: false, error: "Database error" });
		}
	}
);

// Search endpoint
app.get("/search", authenticateUser, async (req, res) => {
	const { query, type } = req.query;

	if (
		!query &&
		![
			"most-posts",
			"least-posts",
			"highest-ranking",
			"lowest-ranking",
		].includes(type)
	) {
		return res
			.status(400)
			.json({ success: false, error: "Invalid search parameters" });
	}

	try {
		let results = [];

		switch (type) {
			case "content": {
				// Search for content containing specific strings
				const postResults = await db.view("app", "posts");
				const responseResults = await db.view(
					"app",
					"responses_by_parent"
				);

				// Get channel names for context
				const channelsResult = await db.view("app", "channels");
				const channelsMap = {};
				channelsResult.rows.forEach((row) => {
					channelsMap[row.id] = row.value.name;
				});

				// Combine and filter results
				const allContent = [
					...postResults.rows.map((row) => {
						const post = row.value;
						return {
							...post,
							id: row.id,
							channelName: channelsMap[post.channelID],
						};
					}),
					...responseResults.rows.map((row) => ({
						...row.value,
						id: row.id,
					})),
				];

				results = allContent.filter((item) => {
					let content = "";
					if (item.type === "post") {
						content = `${item.topic} ${item.data}`.toLowerCase();
					} else {
						content = item.data.toLowerCase();
					}
					return content.includes(query.toLowerCase());
				});
				break;
			}

			case "user": {
				// Search for content created by specific user
				const userResults = await db.view("app", "users", {
					startkey: query,
					endkey: query + "\ufff0",
				});

				if (userResults.rows.length === 0) {
					return res.status(200).json({ success: true, results: [] });
				}

				// Get all content and filter by found users
				const usernames = userResults.rows.map((row) => row.key);

				// Get all posts
				const postResults = await db.view("app", "posts");
				const responseResults = await db.view(
					"app",
					"responses_by_parent"
				);

				// Get channel names for context
				const channelsResult = await db.view("app", "channels");
				const channelsMap = {};
				channelsResult.rows.forEach((row) => {
					channelsMap[row.id] = row.value.name;
				});

				// Combine and filter by username
				const allContent = [
					...postResults.rows.map((row) => {
						const post = row.value;
						return {
							...post,
							id: row.id,
							channelName: channelsMap[post.channelID],
						};
					}),
					...responseResults.rows.map((row) => ({
						...row.value,
						id: row.id,
					})),
				];

				results = allContent.filter((item) =>
					usernames.includes(item.creatorUsername)
				);
				break;
			}

			case "most-posts":
			case "least-posts": {
				// Get users with most or least posts
				const postCounts = await db.view("app", "posts_count_by_user", {
					group: true,
				});

				// Get user details
				const userDetails = {};
				const allUsers = await db.view("app", "users_by_id");

				allUsers.rows.forEach((row) => {
					userDetails[row.value.username] = {
						id: row.id,
						displayName: row.value.displayName,
					};
				});

				// Format results
				results = postCounts.rows
					.map((row) => ({
						id: userDetails[row.key]?.id || "unknown",
						username: row.key,
						displayName:
							userDetails[row.key]?.displayName || row.key,
						count: row.value,
					}))
					.sort((a, b) =>
						type === "most-posts"
							? b.count - a.count
							: a.count - b.count
					)
					.slice(0, 10); // Limit to top 10
				break;
			}

			case "highest-ranking":
			case "lowest-ranking": {
				// Get users with highest or lowest response counts
				const responseCounts = await db.view(
					"app",
					"responses_count_by_user",
					{ group: true }
				);

				// Get user details
				const userDetails = {};
				const allUsers = await db.view("app", "users_by_id");

				allUsers.rows.forEach((row) => {
					userDetails[row.value.username] = {
						id: row.id,
						displayName: row.value.displayName,
					};
				});

				// Format results
				results = responseCounts.rows
					.map((row) => ({
						id: userDetails[row.key]?.id || "unknown",
						username: row.key,
						displayName:
							userDetails[row.key]?.displayName || row.key,
						count: row.value,
					}))
					.sort((a, b) =>
						type === "highest-ranking"
							? b.count - a.count
							: a.count - b.count
					)
					.slice(0, 10); // Limit to top 10
				break;
			}

			default:
				return res
					.status(400)
					.json({ success: false, error: "Invalid search type" });
		}

		res.status(200).json({
			success: true,
			results,
		});
	} catch (err) {
		console.error("Search error:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// POST endpoint for handling post/reply approvals
app.post("/vote", authenticateUser, async (req, res) => {
	const { itemID, voteType } = req.body;

	if (!itemID || !["upvote", "downvote"].includes(voteType)) {
		return res.status(400).json({
			success: false,
			error: "Missing item ID or invalid vote type",
		});
	}

	try {
		const userID = req.session.user.id;
		const item = await db.get(itemID);

		if (!item.votes) {
			item.votes = { upvotes: [], downvotes: [] };
		}

		item.votes.upvotes = item.votes.upvotes.filter((id) => id !== userID);
		item.votes.downvotes = item.votes.downvotes.filter(
			(id) => id !== userID
		);

		if (voteType === "upvote") {
			item.votes.upvotes.push(userID);
		} else {
			item.votes.downvotes.push(userID);
		}

		await db.insert(item);

		res.json({
			success: true,
			upvotes: item.votes.upvotes.length,
			downvotes: item.votes.downvotes.length,
		});
	} catch (err) {
		console.error("Error voting on item:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// POST endpoint for removing a vote
app.post("/unvote", authenticateUser, async (req, res) => {
	const { itemID } = req.body;

	if (!itemID) {
		return res
			.status(400)
			.json({ success: false, error: "Missing item ID" });
	}

	try {
		const userID = req.session.user.id;
		const item = await db.get(itemID);

		if (!item.votes) {
			item.votes = { upvotes: [], downvotes: [] };
		}

		item.votes.upvotes = item.votes.upvotes.filter((id) => id !== userID);
		item.votes.downvotes = item.votes.downvotes.filter(
			(id) => id !== userID
		);

		await db.insert(item);

		res.status(200).json({
			success: true,
			votes: item.votes,
		});
	} catch (err) {
		console.error("Error removing vote:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

app.listen(PORT, HOST, () => {
	console.log(`Server up and running at http://${HOST}:${PORT}`);
});
