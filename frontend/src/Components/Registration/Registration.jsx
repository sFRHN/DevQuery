import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export default function Registration() {
	// State to manage form data
	const [formData, setFormData] = useState({
		username: "",
		displayName: "",
		password: "",
	});
	const { register } = useAuth();
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		const { username, displayName, password } = formData;

		if (!username || !password || !displayName) {
			setError("Please fill in all the fields");
		}

		const response = await register(username, password, displayName);

		if (!response.success) {
			setError(response.message || "Registration failed");
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<h1>Registration</h1>
			{error && <p className="error-message">{error}</p>}
			<label for="username">Username</label>
			<input
				type="text"
				id="username"
				name="username"
				value={formData.username}
				onChange={(e) =>
					setFormData({ ...formData, username: e.target.value })
				}
			/>
			<label for="displayName">Display Name</label>
			<input
				type="text"
				id="displayName"
				name="displayName"
				value={formData.displayName}
				onChange={(e) =>
					setFormData({ ...formData, displayName: e.target.value })
				}
			/>
			<label for="password">Password</label>
			<input
				type="text"
				id="password"
				name="password"
				value={formData.password}
				onChange={(e) =>
					setFormData({ ...formData, password: e.target.value })
				}
			/>
			<button type="submit">Submit</button>
		</form>
	);
}
