import { useState } from "react";

export default function Registration() {
	// State to manage form data
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	return (
		<form>
			<h1>Registration</h1>
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
		</form>
	);
}
