import Login from "../Components/Login/Login";
import Registration from "../Components/Registration/Registration";
import "./LandingPage.css";

export default function LandingPage() {
	return (
		<div className="container">
			<div className="title">My Project</div>
			<div className="info-box">Welcome to the website</div>
			<div className="login-register">
				<Login />
				<Registration />
			</div>
		</div>
	);
}
