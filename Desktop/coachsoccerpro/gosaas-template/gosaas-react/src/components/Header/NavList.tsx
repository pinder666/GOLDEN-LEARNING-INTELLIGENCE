import { Link } from "react-router-dom";

interface NavListProps {
	setMobileToggle: (value: boolean) => void;
	mobileToggle: boolean;
}

const NavList: React.FC<NavListProps> = ({ setMobileToggle, mobileToggle }) => {
	return (
		<>
			<ul className={`cs_nav_list ${mobileToggle ? "cs_active" : ""}`}>
				<li>
					<Link to="/features" style={{ color: '#ffffff' }}>Features</Link>
				</li>
				<li>
					<Link to="/#how-it-works" style={{ color: '#ffffff' }}>How It Works</Link>
				</li>
				<li>
					<Link to="/pricing" style={{ color: '#ffffff' }}>Pricing</Link>
				</li>
				<li>
					<Link to="/#for-coaches" style={{ color: '#ffffff' }}>For Coaches</Link>
				</li>
				<li>
					<Link to="/login" style={{ color: '#ffffff' }}>Sign In</Link>
				</li>
				<li>
					<Link
						to="/register"
						className="cs_btn cs_style_1"
						style={{ backgroundColor: '#2d5a1b', color: '#ffffff', padding: '10px 20px', borderRadius: '5px' }}
					>
						Get Started
					</Link>
				</li>
			</ul>

			{/* Mobile menu toggle */}
			<span
				className={`cs_menu_toggle ${mobileToggle ? "cs_toggle_active" : ""}`}
				onClick={() => setMobileToggle(!mobileToggle)}
			>
				<span></span>
			</span>
		</>
	);
};

export default NavList;
