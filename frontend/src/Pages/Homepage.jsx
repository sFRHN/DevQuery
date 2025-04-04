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
		<div className="homepage-container">
			<div className="homepage-header">
				<div className="header-left">
					<h1>DevQuery</h1>
					<p className="header-subtitle">Ask. Answer. Learn.</p>
				</div>
				<div className="header-center">
					<SearchBar onSearch={handleSearch} />
					{searchResults && (
						<button
							onClick={clearSearch}
							className="clear-search-button"
						>
							Clear
						</button>
					)}
				</div>
				<div className="header-right">
					<div className="user-info">
						{user?.displayName}
						{user?.role === "admin" && (
							<span className="admin-tag">(Admin)</span>
						)}
					</div>
					<button onClick={logout} className="logout-button">
						Logout
					</button>
				</div>
			</div>

			<div className="homepage-content">
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
						<SearchResults
							results={searchResults}
							type={searchType}
						/>
					) : selectedChannel ? (
						<PostList channelID={selectedChannel} />
					) : (
						<div className="welcome-message">
							<h2>Welcome to DevQuery</h2>
							<p>
								Select a channel to view posts or create your
								own
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default HomePage;
