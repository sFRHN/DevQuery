import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		// Check if user is already logged in
		const checkLoginStatus = async () => {
			try {
				const response = await fetch("/current-user");
				const data = await response.json();

				if (data.success && data.user) {
					setUser(data.user);
				}
			} catch (error) {
				console.error("Failed to check auth status", error);
			}
		};

		checkLoginStatus();
	}, []);

	const login = async (username, password) => {
		try {
			const response = await fetch("/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();

			if (data.success) {
				setUser(data.user);
				navigate("/home");
				return { success: true };
			} else {
				return { success: false, message: data.message };
			}
		} catch (error) {
			console.error("Login error", error);
			return {
				success: false,
				message: "An error occurred. Please try again.",
			};
		}
	};

	const register = async (username, password, displayName) => {
		try {
			const response = await fetch("/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password, displayName }),
			});

			const data = await response.json();

			if (data.success) {
				setUser(data.user);
				navigate("/home");
				return { success: true };
			} else {
				return { success: false, message: data.message };
			}
		} catch (error) {
			console.error("Registration error", error);
			return {
				success: false,
				message: "An error occurred. Please try again.",
			};
		}
	};

	const logout = async () => {
		try {
			await fetch("/logout", { method: "POST" });
			setUser(null);
			navigate("/");
		} catch (error) {
			console.error("Logout error", error);
		}
	};

	return (
		<AuthContext.Provider value={{ user, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
