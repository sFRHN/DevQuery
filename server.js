const express = require("express");
const app = express();
const path = require("path");
// Import nano for CouchDB connections
const nano = require("nano");
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
								emit(doc._id, doc);
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

// Serve React Frontend
app.use(express.static(path.join(__dirname, "frontend/build")));

// Endpoint to add a post
app.post("/postMessage", async (req, res) => {
	const { topic, data } = req.body;

	if (!topic || !data) {
		return res
			.status(400)
			.json({ success: false, error: "Missing topic/data" });
	}

	try {
		const newPost = {
			type: "post",
			topic: topic,
			data: data,
			timestamp: new Date().toLocaleString(),
		};

		const response = await db.insert(newPost);
		res.status(200).json({ success: true, id: response.id });
	} catch (err) {
		console.error("Error creating post:", err);
		res.status(500).json({ success: false, error: "Database error" });
	}
});

// Endpoint to add a response
app.post("/postResponse", async (req, res) => {
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

app.listen(PORT, HOST, () => {
	console.log(`Server up and running at http://${HOST}:${PORT}`);
});
