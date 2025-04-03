const express = require("express");
const app = express();
const path = require("path");
const nano = require("nano");
const multer = require("multer");
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
								emit([doc.channelID, doc._id], {
									topic: doc.topic,
									channelID: doc.channelID,
									data: doc.data,
									timestamp: doc.timestamp,
									hasImage: !!doc._attachments,
								});
							}
						}.toString(),
					},
					responses_by_parent: {
						map: function (doc) {
							if (doc.type === "response") {
								emit(doc.parentID, {
									parentID: doc.parentID,
									data: doc.data,
									timestamp: doc.timestamp,
									hasImage: !!doc._attachments,
								});
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
			timestamp: new Date().toISOString(),
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
			timestamp: new Date().toLocaleString(),
		};

		const response = await db.insert(newPost);

		// Add images as attachments
		if (req.file) {
			await db.attachment.insert(
				response.id,
				"image",
				req.file.buffer,
				req.file.mimetype,
				{ rev: response.rev }
			);
		}
		if (req.file) res.status(200).json({ success: true, id: response.id });
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
			timestamp: new Date().toLocaleString(),
		};

		// Add images as attachments
		if (req.file) {
			await db.attachment.insert(
				response.id,
				"image",
				req.file.buffer,
				req.file.mimetype,
				{ rev: response.rev }
			);
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
			};
		});

		res.status(200).json({ posts, responses, channelName });
	} catch (err) {
		console.log("Error retreiving channel info", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

app.listen(PORT, HOST, () => {
	console.log(`Server up and running at http://${HOST}:${PORT}`);
});
