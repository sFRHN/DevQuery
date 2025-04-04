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
						createdAt: new Date().toLocaleString(),
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

app.post("/createChannel", async (req, res) => {
	const { channelName } = req.body;

	if (!channelName) {
		return res
			.status(400)
			.json({ success: false, error: "Missing channel name" });
	}

	try {
		const newChannel = {
			type: "channel",
			name: channelName,
			timestamp: new Date().toLocaleString(),
		};

		const response = await db.insert(newChannel);
		res.status(200).json({ success: true, id: response.id });
	} catch (err) {
		console.error("Error creating posts", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to add a post
app.post("/postmessage", upload.single("image"), async (req, res) => {
	const { topic, data, channelID } = req.body;

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
			image: null,
			timestamp: new Date().toLocaleString(),
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
});

// Endpoint to add a response
app.post("/postresponse", upload.single("image"), async (req, res) => {
	const { parentID, data } = req.body;

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
			image: null,
			timestamp: new Date().toLocaleString(),
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
});

// Endpoint to retrieve all data
app.get("/alldata", async (req, res) => {
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
app.get("/allchannels", async (req, res) => {
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
app.get("/channel/:channelID", async (req, res) => {
	const { channelID } = req.params;

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
					hasImage: post.image !== null,
					imageType: post.image?.mimetype || null,
					imageName: post.image?.originalname || null,
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
				timestamp: response.timestamp,
				hasImage: response.image !== null,
				imageType: response.image?.mimetype || null,
				imageName: response.image?.originalname || null,
			};
		});

		res.status(200).json({ posts, responses, channelName });
	} catch (err) {
		console.log("Error retreiving channel info", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to serve files
app.get("/image/:id", async (req, res) => {
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
		if (result.rows.length != 0) {
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
			createdAt: new Date().toLocaleString(),
		};

		const response = await db.insert(newUser);
		res.status(200).json({
			success: true,
			id: response.id,
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

		if (results.row.length === 0) {
			return res.status(400).json({
				success: false,
				error: "User does not exist",
			});
		}

		const user = results.row[0].value;

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
	} catch (err) {
		console.error("Error loggin in");
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
app.get("/user", (req, res) => {
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

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

app.listen(PORT, HOST, () => {
	console.log(`Server up and running at http://${HOST}:${PORT}`);
});
