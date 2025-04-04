import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
	// State to manage form data
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const { login } = useAuth();
	const [error, setError] = useState("");

	// Function to handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		const { username, password } = formData;

		if (!username || !password) {
			setError("Please enter both username and password");
		}

		const response = await login(username, password);

		if (!response.success) {
			setError(response.message || "Login failed");
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<h1>Login</h1>
			{error && <p className="error-message">{error}</p>}
			<label htmlFor="username">Username</label>
			<input
				type="text"
				id="username"
				name="username"
				value={formData.username}
				onChange={(e) =>
					setFormData({ ...formData, username: e.target.value })
				}
			/>
			<label htmlFor="password">Password</label>
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
