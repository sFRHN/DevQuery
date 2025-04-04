import { useState, useEffect } from "react";
import "./ChannelList.css";

export default function ChannelList({ selectedChannel, setSelectedChannel }) {
	const [channels, setChannels] = useState([]);
	const [channelName, setChannelName] = useState("");
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		loadChannels();
	}, []);

	const toggleForm = () => {
		setShowForm(!showForm);
		setChannelName(""); // Reset input when toggling form
	};

	const loadChannels = async () => {
		try {
			const response = await fetch("/allchannels");
			const data = await response.json();
			setChannels(data);
		} catch (error) {
			console.error("Error fetching channels:", error);
		}
	};

	const createChannel = async () => {
		if (!channelName.trim()) return;

		try {
			const response = await fetch("/createChannel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelName: channelName }),
			});
			const result = await response.json();
			if (result.success) {
				setChannelName("");
				loadChannels();
				toggleForm();
			}
		} catch (error) {
			console.error("Error creating channel:", error);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			createChannel();
		}
	};

	return (
		<div className="channel-container">
			<div className="channel-header">
				<h1>Channels</h1>
				{!showForm && (
					<button className="add-channel-button" onClick={toggleForm}>
						<span>+</span> Add Channel
					</button>
				)}
			</div>

			{showForm && (
				<div className="channel-form-container">
					<input
						type="text"
						placeholder="Enter new channel name"
						value={channelName}
						onChange={(e) => setChannelName(e.target.value)}
						onKeyPress={handleKeyPress}
						autoFocus
					/>
					<div className="channel-form-buttons">
						<button
							className="submit-button"
							onClick={createChannel}
						>
							Create
						</button>
						<button className="cancel-button" onClick={toggleForm}>
							Cancel
						</button>
					</div>
				</div>
			)}

			{channels.length > 0 ? (
				<ul className="channel-list">
					{channels.map((channel) => (
						<li
							key={channel.id}
							className={`channel-item ${
								channel.id === selectedChannel ? "selected" : ""
							}`}
							onClick={() => setSelectedChannel(channel.id)}
						>
							{channel.name}
						</li>
					))}
				</ul>
			) : (
				<p className="no-channels-message">
					No channels available. Create one to get started!
				</p>
			)}
		</div>
	);
}
