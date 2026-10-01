/** 

=========================================================
* Vision UI PRO React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-dashboard-pro-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Visionware.

*/

import { useEffect, useState } from 'react';

// react-router-dom components
import { useLocation, NavLink } from 'react-router-dom';

// prop-types is a library for typechecking of props.
import PropTypes from 'prop-types';

// @mui material components
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Icon from '@mui/material/Icon';

// Vision UI Dashboard PRO React components
import VuiBox from 'components/VuiBox';
import VuiTypography from 'components/VuiTypography';

// Vision UI Dashboard PRO React example components
import SidenavCollapse from 'examples/Sidenav/SidenavCollapse';
import SidenavList from 'examples/Sidenav/SidenavList';
import SidenavItem from 'examples/Sidenav/SidenavItem';
import SidenavCard from 'examples/Sidenav/SidenavCard';

// Logo
import logo from 'assets/images/logos/coachsoccerpro-logo.png';

// Custom styles for the Sidenav
import SidenavRoot from 'examples/Sidenav/SidenavRoot';
import sidenavLogoLabel from 'examples/Sidenav/styles/sidenav';

// Scrollbar component
import { Scrollbars } from 'react-custom-scrollbars-2';

// Scrollbar configs
import { renderThumb, renderTrack, renderTrackRTL, renderView, renderViewRTL } from 'examples/Scrollbar';

// Vision UI Dashboard PRO React context
import { useVisionUIController, setMiniSidenav, setTransparentSidenav } from 'context';

function Sidenav({ color, brand, brandName, routes, ...rest }) {
	const [ openCollapse, setOpenCollapse ] = useState(false);
	const [ openNestedCollapse, setOpenNestedCollapse ] = useState(false);
	const [ controller, dispatch ] = useVisionUIController();
	const { miniSidenav, transparentSidenav } = controller;
	const location = useLocation();
	const { pathname } = location;
	const collapseName = pathname.split('/').slice(1)[0];
	const itemName = pathname.split('/').slice(1)[1];

	const closeSidenav = () => setMiniSidenav(dispatch, true);

	useEffect(
		() => {
			// A function that sets the mini state of the sidenav.
			function handleMiniSidenav() {
				setMiniSidenav(dispatch, window.innerWidth < 1200);
			}

			/** 
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
			window.addEventListener('resize', handleMiniSidenav);

			// Call the handleMiniSidenav function to set the state with the initial value.
			handleMiniSidenav();

			// Remove event listener on cleanup
			return () => window.removeEventListener('resize', handleMiniSidenav);
		},
		[ dispatch, location ]
	);

	useEffect(() => {
		if (window.innerWidth < 1440) {
			setTransparentSidenav(dispatch, false);
		}
	}, []);

	// Render all the nested collapse items from the routes.js
	const renderNestedCollapse = (collapse) => {
		const template = collapse.map(
			({ name, path, key, href }) =>
				href ? (
					<Link key={key} href={href} target='_blank' rel='noreferrer' sx={{ textDecoration: 'none' }}>
						<SidenavItem color={color} name={name} nested />
					</Link>
				) : (
					<NavLink to={path} key={key} sx={{ textDecoration: 'none' }}>
						<SidenavItem color={color} name={name} active={path === pathname} nested />
					</NavLink>
				)
		);

		return template;
	};

	// Render the all the collpases from the routes.js
	const renderCollapse = (collapses) =>
		collapses.map(({ name, collapse, path, href, key }) => {
			let returnValue;

			if (collapse) {
				returnValue = (
					<SidenavItem
						color={color}
						key={key}
						name={name}
						active={key === itemName}
						open={openNestedCollapse === name}
						onClick={() =>
							openNestedCollapse === name ? setOpenNestedCollapse(false) : setOpenNestedCollapse(name)}>
						{renderNestedCollapse(collapse)}
					</SidenavItem>
				);
			} else {
				returnValue = href ? (
					<Link href={href} key={key} target='_blank' rel='noreferrer' sx={{ textDecoration: 'none' }}>
						<SidenavItem color={color} name={name} active={key === itemName} />
					</Link>
				) : (
					<NavLink to={path} key={key} sx={{ textDecoration: 'none' }}>
						<SidenavItem color={color} name={name} active={key === itemName} />
					</NavLink>
				);
			}
			return <SidenavList key={key}>{returnValue}</SidenavList>;
		});

	// Render all the routes from the routes.js (All the visible items on the Sidenav)
	const renderRoutes = routes.map(({ type, name, icon, title, collapse, noCollapse, key, href, route }) => {
		let returnValue;

		if (type === 'collapse') {
			returnValue = href ? (
				<Link href={href} key={key} target='_blank' rel='noreferrer' sx={{ textDecoration: 'none' }}>
					<SidenavCollapse
						color={color}
						name={name}
						icon={icon}
						active={key === collapseName}
						noCollapse={noCollapse}
					/>
				</Link>
			) : noCollapse && route ? (
				// Flat item with its own page: the whole row IS the link
				<NavLink to={route} key={key} style={{ textDecoration: 'none' }}>
					<SidenavCollapse
						color={color}
						name={name}
						icon={icon}
						active={pathname === route}
						noCollapse={noCollapse}
					/>
				</NavLink>
			) : (
				<SidenavCollapse
					color={color}
					key={key}
					name={name}
					icon={icon}
					active={key === collapseName}
					open={openCollapse === name}
					onClick={() => (openCollapse === name ? setOpenCollapse(false) : setOpenCollapse(name))}>
					{collapse ? renderCollapse(collapse) : null}
				</SidenavCollapse>
			);
		} else if (type === 'title') {
			returnValue = (
				<VuiTypography
					key={key}
					display='block'
					variant='caption'
					fontWeight='bold'
					color='white'
					textTransform='uppercase'
					pl={3}
					my={3}
					ml={1}>
					{title}
				</VuiTypography>
			);
		} else if (type === 'divider') {
			returnValue = <Divider key={key} />;
		}

		return returnValue;
	});

	return (
		<SidenavRoot {...rest} variant='permanent' ownerState={{ miniSidenav, transparentSidenav }}>
			{/* No scroll on sidebar — everything fits on one screen */}
			<VuiBox
				display='flex'
				sx={{ flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
				<VuiBox pt={0.5} pb={0} px={1} textAlign='center'>
					<VuiBox
						display={{ xs: 'block', xl: 'none' }}
						position='absolute'
						top={0}
						right={0}
						p={0.5}
						onClick={closeSidenav}
						sx={{ cursor: 'pointer' }}>
						<VuiTypography variant='body2' color='white'>
							<Icon sx={{ fontWeight: 'bold', fontSize: 16 }}>close</Icon>
						</VuiTypography>
					</VuiBox>
					<VuiBox component={NavLink} to='/' display='flex' alignItems='center'>
						<VuiBox sx={{ display: 'flex', alignItems: 'center', margin: '0 auto' }}>
							<VuiBox
								component="img"
								src={logo}
								alt="CoachSoccerPro"
								sx={{
									width: miniSidenav ? '36px' : '140px',
									transition: 'width 0.3s ease',
								}}
							/>
						</VuiBox>
					</VuiBox>
					<Divider light sx={{ my: 0.25 }} />
				</VuiBox>
				<List sx={{ flex: 1, overflow: 'hidden', py: 0, mt: 0 }}>{renderRoutes}</List>
			</VuiBox>
		</SidenavRoot>
	);
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
	color: 'info',
	brand: ''
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
	color: PropTypes.oneOf([ 'primary', 'secondary', 'info', 'success', 'warning', 'error', 'dark' ]),
	brand: PropTypes.string,
	brandName: PropTypes.string.isRequired,
	routes: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Sidenav;
