import { useState } from "react";
import "./SearchBar.css";

export default function SearchBar({ onSearch }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchType, setSearchType] = useState("content"); // Default search type

	const handleSearch = (e) => {
		e.preventDefault();
		onSearch(searchQuery, searchType);
	};

	return (
		<div className="search-bar">
			<form onSubmit={handleSearch}>
				<input
					type="text"
					placeholder="Search..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<select
					value={searchType}
					onChange={(e) => setSearchType(e.target.value)}
				>
					<option value="content">Content containing</option>
					<option value="user">Content by user</option>
					<option value="most-posts">Users with most posts</option>
					<option value="least-posts">Users with least posts</option>
					<option value="highest-ranking">
						Users with most replies
					</option>
					<option value="lowest-ranking">
						Users with least replies
					</option>
				</select>
				<button type="submit">Search</button>
			</form>
		</div>
	);
}
