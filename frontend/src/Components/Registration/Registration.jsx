import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import "./Registration.css";

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
			return;
		}

		const response = await register(username, password, displayName);

		if (!response.success) {
			setError(response.message || "Registration failed");
		}
	};

	return (
		<div className="registration-container">
			<h2>Create Account</h2>
			{error && <p className="error-message">{error}</p>}
			<form onSubmit={handleSubmit} className="registration-form">
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
						placeholder="Choose a username"
					/>
				</div>

				<div className="form-group">
					<label htmlFor="displayName">Display Name</label>
					<input
						type="text"
						id="displayName"
						name="displayName"
						value={formData.displayName}
						onChange={(e) =>
							setFormData({
								...formData,
								displayName: e.target.value,
							})
						}
						placeholder="Your public display name"
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
						placeholder="Create a password"
					/>
				</div>

				<button type="submit" className="register-button">
					Sign Up
				</button>

				<p className="form-footer">
					By signing up, you agree to join our community of developers
				</p>
			</form>
		</div>
	);
}
