import ChannelList from "../Components/ChannelList/ChannelList";
import PostList from "../Components/Posts/PostList";
import { useState } from "react";
import "./Homepage.css";

function HomePage() {
	const [selectedChannel, setSelectedChannel] = useState(null);

	return (
		<div className="container">
			<div className="title">Homepage</div>
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
