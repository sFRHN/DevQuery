import Login from "../Components/Login/Login";
import Registration from "../Components/Registration/Registration";
import "./LandingPage.css";

export default function LandingPage() {
	return (
		<div className="container">
			<div className="title">
				<h1>DevQuery</h1>
				<p className="subtitle">Ask. Answer. Learn.</p>
			</div>
			<div className="info-box">
				<h2>Your Programming Questions Answered</h2>
				<p className="feature-text">
					Join our community of developers helping each other solve
					coding challenges and share knowledge.
				</p>
				<div className="features">
					<div className="feature">💡 Expert Solutions</div>
					<div className="feature">🏆 Reputation System</div>
					<div className="feature">🚀 Quick Answers</div>
				</div>
			</div>
			<div className="login-register">
				<Login />
				<Registration />
			</div>
		</div>
	);
}
