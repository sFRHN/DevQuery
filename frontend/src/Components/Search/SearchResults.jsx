import "./SearchResults.css";

export default function SearchResults({ results, type }) {
	if (!results || results.length === 0) {
		return <div className="search-results empty">No results found</div>;
	}

	switch (type) {
		case "content":
		case "user":
			return (
				<div className="search-results">
					<h3>Search Results</h3>
					{results.map((item) => (
						<div key={item.id} className="search-result-item">
							{item.type === "post" ? (
								<div className="post-result">
									<h4>{item.topic}</h4>
									<p>{item.data}</p>
									<p>
										By: {item.creatorDisplayName} ·{" "}
										{item.timestamp}
									</p>
									{item.channelName && (
										<p>Channel: {item.channelName}</p>
									)}
								</div>
							) : (
								<div className="response-result">
									<p>{item.data}</p>
									<p>
										Reply by: {item.creatorDisplayName} ·{" "}
										{item.timestamp}
									</p>
								</div>
							)}
						</div>
					))}
				</div>
			);

		case "most-posts":
		case "least-posts":
		case "highest-ranking":
		case "lowest-ranking":
			return (
				<div className="search-results">
					<h3>User Rankings</h3>
					<ol className="ranking-list">
						{results.map((user) => (
							<li key={user.id}>
								<span className="user-name">
									{user.displayName}
								</span>
								:<span className="count">{user.count}</span>
								{type.includes("posts") ? "posts" : "replies"}
							</li>
						))}
					</ol>
				</div>
			);

		default:
			return <div>Unknown search type</div>;
	}
}
