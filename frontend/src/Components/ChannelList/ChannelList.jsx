import { useState, useEffect } from "react";

export default function ChannelList({ selectedChannel, setSelectedChannel }) {
	const [channels, setChannels] = useState([]);
	const [channelName, setChannelName] = useState("");
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		loadChannels();
	}, []);

	const toggleForm = () => {
		setShowForm(!showForm);
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
			}
		} catch (error) {
			console.error("Error creating channel:", error);
		}
	};

	return (
		<div className="channel-form">
			<h1>Channels</h1>
			<button onClick={toggleForm}>+ Channel</button>
			{showForm && (
				<>
					<input
						type="text"
						placeholder="Enter new channel name"
						value={channelName}
						onChange={(e) => setChannelName(e.target.value)}
					/>
					<button
						onClick={() => {
							createChannel();
							toggleForm();
						}}
					>
						Submit
					</button>
				</>
			)}
			<ul>
				{channels.map((channel) => (
					<li
						key={channel.id}
						className={
							channel.id === selectedChannel ? "selected" : ""
						}
						onClick={() => setSelectedChannel(channel.id)}
					>
						{channel.name}
					</li>
				))}
			</ul>
		</div>
	);
}
