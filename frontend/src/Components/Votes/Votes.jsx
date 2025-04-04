import { useAuth } from "../AuthContext";
import { useState } from "react";
import "./Votes.css";

export default function Votes({ item, refresh }) {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	// Initialize local state with the current vote counts
	const [localUpvotes, setLocalUpvotes] = useState(
		item.votes?.upvotes?.length || 0
	);
	const [localDownvotes, setLocalDownvotes] = useState(
		item.votes?.downvotes?.length || 0
	);
	const [localUserUpvoted, setLocalUserUpvoted] = useState(
		item.votes?.upvotes?.includes(user?.id)
	);
	const [localUserDownvoted, setLocalUserDownvoted] = useState(
		item.votes?.downvotes?.includes(user?.id)
	);

	const handleVote = async (voteType) => {
		if (!user) return;
		setIsLoading(true);

		// Store previous state for rollback
		const prevUpvotes = localUpvotes;
		const prevDownvotes = localDownvotes;
		const prevUserUpvoted = localUserUpvoted;
		const prevUserDownvoted = localUserDownvoted;

		try {
			let endpoint = "/vote";
			let body = { itemID: item.id, voteType };

			if (voteType === "upvote") {
				if (localUserUpvoted) {
					// Removing upvote
					setLocalUpvotes(localUpvotes - 1);
					setLocalUserUpvoted(false);
					endpoint = "/unvote";
					body = { itemID: item.id };
				} else {
					// Adding upvote
					setLocalUpvotes(localUpvotes + 1);
					setLocalUserUpvoted(true);

					// If already downvoted, remove downvote
					if (localUserDownvoted) {
						setLocalDownvotes(localDownvotes - 1);
						setLocalUserDownvoted(false);
					}
				}
			} else if (voteType === "downvote") {
				if (localUserDownvoted) {
					// Removing downvote
					setLocalDownvotes(localDownvotes - 1);
					setLocalUserDownvoted(false);
					endpoint = "/unvote";
					body = { itemID: item.id };
				} else {
					// Adding downvote
					setLocalDownvotes(localDownvotes + 1);
					setLocalUserDownvoted(true);

					// If already upvoted, remove upvote
					if (localUserUpvoted) {
						setLocalUpvotes(localUpvotes - 1);
						setLocalUserUpvoted(false);
					}
				}
			}

			// Make the API call
			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error("Vote operation failed");
			}

			const result = await response.json();
			if (!result.success) {
				throw new Error("Server returned error");
			}
		} catch (error) {
			console.error("Error voting:", error);
			setLocalUpvotes(prevUpvotes);
			setLocalDownvotes(prevDownvotes);
			setLocalUserUpvoted(prevUserUpvoted);
			setLocalUserDownvoted(prevUserDownvoted);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="vote-controls">
			<button
				onClick={() => handleVote("upvote")}
				className={localUserUpvoted ? "voted" : ""}
				disabled={isLoading}
			>
				👍 {localUpvotes}
			</button>
			<button
				onClick={() => handleVote("downvote")}
				className={localUserDownvoted ? "voted" : ""}
				disabled={isLoading}
			>
				👎 {localDownvotes}
			</button>
		</div>
	);
}
