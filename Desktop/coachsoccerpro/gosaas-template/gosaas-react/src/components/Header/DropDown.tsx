import { useState } from "react";
import { Link } from "react-router-dom";

interface MenuItem {
	title: string;
	linkUrl: string;
}

const DropDown: React.FC<{ items: MenuItem[] }> = ({ items }) => {
	const [mobileToggle, setMobileToggle] = useState(false);
	const handleMobileToggle = () => {
		setMobileToggle(!mobileToggle);
	};
	return (
		<>
			<span
				className={`cs_menu_dropdown_toggle ${mobileToggle ? "active" : ""}`}
				onClick={handleMobileToggle}
			>
				<span></span>
			</span>
			<ul className={`${!mobileToggle ? "d-none" : "d-block"}`}>
				{items?.map((item, index) => (
					<li key={index}>
						<Link to={item.linkUrl} onClick={() => setMobileToggle(false)}>
							{item.title}
						</Link>
					</li>
				))}
			</ul>
		</>
	);
};
export default DropDown;
