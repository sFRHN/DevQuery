import ChannelList from "../Components/ChannelList/ChannelList";
import PostList from "../Components/Posts/PostList";
import SearchBar from "../Components/Search/SearchBar";
import SearchResults from "../Components/Search/SearchResults";
import { useState } from "react";
import "./Homepage.css";
import { useAuth } from "../Components/AuthContext";

function HomePage() {
	const [selectedChannel, setSelectedChannel] = useState(null);
	const { user, logout } = useAuth();
	const [searchResults, setSearchResults] = useState(null);
	const [searchType, setSearchType] = useState(null);

	const handleSearch = async (query, type) => {
		try {
			const response = await fetch(
				`/search?query=${encodeURIComponent(query)}&type=${type}`
			);
			const data = await response.json();

			if (data.success) {
				setSearchResults(data.results);
				setSearchType(type);
			}
		} catch (error) {
			console.error("Search failed:", error);
		}
	};

	const clearSearch = () => {
		setSearchResults(null);
		setSearchType(null);
	};

	return (
		<div className="container">
			<div className="title-bar">
				<div>Homepage</div>
				<div className="user-info">
					{user?.displayName}
					{user?.role === "admin" && (
						<span className="admin-tag">(Admin)</span>
					)}
					<button onClick={logout} className="logout-button">
						Logout
					</button>
				</div>
			</div>

			<div className="search-container">
				<SearchBar onSearch={handleSearch} />
				{searchResults && (
					<button onClick={clearSearch} className="clear-search">
						Clear Search
					</button>
				)}
			</div>

			<div className="channel-sidebar">
				<ChannelList
					selectedChannel={selectedChannel}
					setSelectedChannel={(channelId) => {
						setSelectedChannel(channelId);
						setSearchResults(null);
						setSearchType(null);
					}}
				/>
			</div>

			<div className="content-area">
				{searchResults ? (
					<SearchResults results={searchResults} type={searchType} />
				) : selectedChannel ? (
					<PostList channelID={selectedChannel} />
				) : (
					<h1>Select a channel</h1>
				)}
			</div>
		</div>
	);
}

export default HomePage;
