import ChannelList from "../Components/ChannelList/ChannelList";
import PostList from "../Components/Posts/PostList";
import { useState } from "react";
import "./Homepage.css";
import { useAuth } from "../Components/AuthContext";

function HomePage() {
	const [selectedChannel, setSelectedChannel] = useState(null);
	const { user, logout } = useAuth();

	return (
		<div className="container">
			<div className="title-bar">
				<div>Homepage</div>
				<div className="user-info">
					{user.displayName}
					{user.isAdmin && <span className="admin-tag">(Admin)</span>}
					<button onClick={logout} className="logout-button">
						Logout
					</button>
				</div>
			</div>
			<div className="channel-sidebar">
				<ChannelList
					selectedChannel={selectedChannel}
					setSelectedChannel={setSelectedChannel}
				/>
			</div>
			<div className="content-area">
				{selectedChannel ? (
					<PostList channelID={selectedChannel} />
				) : (
					<h1>Select a channel</h1>
				)}
			</div>
		</div>
	);
}

export default HomePage;
