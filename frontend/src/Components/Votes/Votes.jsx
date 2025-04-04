import { useAuth } from "../AuthContext";
import "./Votes.css";

export default function Votes({ item, refresh }) {
	const { user } = useAuth();

	// Calculate vote counts and user's current vote
	const upvotes = item.votes?.upvotes?.length || 0;
	const downvotes = item.votes?.downvotes?.length || 0;
	const userUpvoted = item.votes?.upvotes?.includes(user?.id);
	const userDownvoted = item.votes?.downvotes?.includes(user?.id);

	const handleVote = async (voteType) => {
		try {
			let endpoint = "/vote";
			let body = { itemID: item.id, voteType };

			if (
				(voteType === "upvote" && userUpvoted) ||
				(voteType === "downvote" && userDownvoted)
			) {
				endpoint = "/unvote";
				body = { itemID: item.id };
			}

			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (response.ok) {
				refresh();
			}
		} catch (error) {
			console.error("Error voting:", error);
		}
	};

	return (
		<div className="vote-controls">
			<button
				onClick={() => handleVote("upvote")}
				className={userUpvoted ? "voted" : ""}
			>
				👍 {upvotes}
			</button>
			<button
				onClick={() => handleVote("downvote")}
				className={userDownvoted ? "voted" : ""}
			>
				👎 {downvotes}
			</button>
		</div>
	);
}
