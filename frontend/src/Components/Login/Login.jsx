import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import "./Login.css";

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
			return;
		}

		const response = await login(username, password);

		if (!response.success) {
			setError(response.message || "Login failed");
		}
	};

	return (
		<div className="login-container">
			<h2>Sign In</h2>
			{error && <p className="error-message">{error}</p>}
			<form onSubmit={handleSubmit} className="login-form">
				<div className="form-group">
					<label htmlFor="username">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						value={formData.username}
						onChange={(e) =>
							setFormData({
								...formData,
								username: e.target.value,
							})
						}
						placeholder="Enter your username"
					/>
				</div>

				<div className="form-group">
					<label htmlFor="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						value={formData.password}
						onChange={(e) =>
							setFormData({
								...formData,
								password: e.target.value,
							})
						}
						placeholder="Enter your password"
					/>
				</div>

				<button type="submit" className="login-button">
					Sign In
				</button>

				<p className="form-footer">
					Access your DevQuery account to start collaborating
				</p>
			</form>
		</div>
	);
}
