import { useState } from "react";
import { Link } from "react-router-dom";
import { useStickyHeader } from "../../utils/hooks/useStickyHeader";
import NavList from "./NavList";

interface HeaderStyle4Props {
	logo: string;
	logoUrl: string;
}

const HeaderStyle4: React.FC<HeaderStyle4Props> = ({ logo, logoUrl }) => {
	const [mobileToggle, setMobileToggle] = useState<boolean>(false);
	const {isSticky} = useStickyHeader();

	return (
		<header
			className={`cs_site_header cs_style_1 cs_type_2 cs_sticky_header${isSticky ? " cs_fixed_active" : ""}`}
			role="banner"
			style={{ backgroundColor: '#2d5a1b' }}
		>
			<div className="cs_main_header cs_fs_18 cs_white_color">
				<div className="container">
					<div className="cs_main_header_in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
						<div className="cs_main_header_left" style={{ maxWidth: '400px', flexShrink: 0 }}>
							<Link
								className="cs_site_branding"
								to={logoUrl}
								aria-label="Go to homepage"
							>
								<img
									src="/img/coachsoccerpronewlogo.png"
									alt="SoccerCoachPro"
									style={{ width: '100%', height: '260px', objectFit: 'contain', objectPosition: 'left center' }}
								/>
							</Link>
						</div>
						<div className="cs_main_header_center" style={{ color: '#ffffff' }}>
							<div className="cs_nav">
								<NavList
									setMobileToggle={setMobileToggle}
									mobileToggle={mobileToggle}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

export default HeaderStyle4;
