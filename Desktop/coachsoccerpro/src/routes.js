/**
 * CoachSoccerPro Routes Configuration
 *
 * Routes are organized by user type: Coach, Parent, Child
 */

// Coach Layouts
import CoachDashboard from "layouts/coach/dashboard";
import CoachRoster from "layouts/coach/roster";
import AddPlayer from "layouts/coach/roster/add";
import CoachMedia from "layouts/coach/media";
import CoachCalendar from "layouts/coach/calendar";
import CoachAttendance from "layouts/coach/attendance";
import CoachMessages from "layouts/coach/messages";
import CoachQuickTags from "layouts/coach/quicktags";
import CoachBadges from "layouts/coach/badges";
import CoachLeaderboard from "layouts/coach/leaderboard";
import CoachProHabits from "layouts/coach/prohabits";
import CoachPayments from "layouts/coach/payments";
import CoachSettings from "layouts/coach/settings";
import CoachDrills from "layouts/coach/drills";
import TacticsBoard from "layouts/coach/tactics";
import SessionPlanner from "layouts/coach/sessionplanner";
import Checkmatch from "layouts/coach/checkmatch";
import Automation from "layouts/coach/automation";
import Demo from "layouts/coach/demo";
import MyDrills from "layouts/coach/mydrills";
import VideoAnalysis from "layouts/coach/videoanalysis";
import Seats from "layouts/coach/seats";

// Auth Layouts
import CoachSignIn from "layouts/authentication/sign-in/coach";
import CoachSignUp from "layouts/authentication/sign-up/coach";
import ParentSignIn from "layouts/authentication/sign-in/parent";

// Landing redirect — the real landing page is a separate site (:3003).
// Root of this app goes straight to the coach cockpit.
import { Navigate } from "react-router-dom";

// Parent Layouts
import ParentDashboard from "layouts/parent/dashboard";
import ParentSchedule from "layouts/parent/schedule";
import ParentMessages from "layouts/parent/messages";
import ParentPayments from "layouts/parent/payments";

// Child Layouts
import ChildDashboard from "layouts/child/dashboard";
import ChildBadges from "layouts/child/badges";
import ChildLeaderboard from "layouts/child/leaderboard";
import ChildHabits from "layouts/child/habits";

// React icons
import { IoHome, IoPeople, IoCalendar, IoChatbubbles, IoCard, IoTrophy, IoSettings, IoFitness, IoImages, IoFlash, IoGameController, IoCog, IoHelpCircle, IoCreate } from "react-icons/io5";
import { FaMedal, FaChartLine, FaFutbol, FaChessBoard } from "react-icons/fa";

// =============================================
// COACH ROUTES (Sidebar navigation)
// =============================================
const coachRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    nameEs: "Inicio",
    key: "coach-dashboard",
    icon: <IoHome size="15px" color="inherit" />,
    route: "/coach/dashboard",
    component: <CoachDashboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Roster",
    nameEs: "Plantilla",
    key: "coach-roster",
    icon: <IoPeople size="15px" color="inherit" />,
    route: "/coach/roster",
    component: <CoachRoster />,
    noCollapse: true,
  },
  {
    name: "Add Player",
    nameEs: "Agregar Jugador",
    key: "coach-roster-add",
    route: "/coach/roster/add",
    component: <AddPlayer />,
  },
  {
    type: "collapse",
    name: "Media",
    nameEs: "Fotos y Videos",
    key: "coach-media",
    icon: <IoImages size="15px" color="inherit" />,
    route: "/coach/media",
    component: <CoachMedia />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Calendar",
    nameEs: "Calendario",
    key: "coach-calendar",
    icon: <IoCalendar size="15px" color="inherit" />,
    route: "/coach/calendar",
    component: <CoachCalendar />,
    noCollapse: true,
  },
  {
    name: "Take Attendance",
    nameEs: "Tomar Asistencia",
    key: "coach-attendance",
    route: "/coach/attendance/:eventId",
    component: <CoachAttendance />,
  },
  {
    name: "Quick Tags",
    nameEs: "Etiquetas Rápidas",
    key: "coach-quicktags",
    route: "/coach/quicktags/:eventId",
    component: <CoachQuickTags />,
  },
  {
    type: "collapse",
    name: "Messages",
    nameEs: "Mensajes",
    key: "coach-messages",
    icon: <IoChatbubbles size="15px" color="inherit" />,
    route: "/coach/messages",
    component: <CoachMessages />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Badges",
    nameEs: "Insignias",
    key: "coach-badges",
    icon: <FaMedal size="15px" color="inherit" />,
    route: "/coach/badges",
    component: <CoachBadges />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Pro Habits",
    nameEs: "Hábitos Pro",
    key: "coach-prohabits",
    icon: <IoFitness size="15px" color="inherit" />,
    route: "/coach/prohabits",
    component: <CoachProHabits />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Leaderboard",
    nameEs: "Tabla",
    key: "coach-leaderboard",
    icon: <FaChartLine size="15px" color="inherit" />,
    route: "/coach/leaderboard",
    component: <CoachLeaderboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Payments",
    nameEs: "Pagos",
    key: "coach-payments",
    icon: <IoCard size="15px" color="inherit" />,
    route: "/coach/payments",
    component: <CoachPayments />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Seats",
    nameEs: "Asientos",
    key: "coach-seats",
    icon: <IoTrophy size="15px" color="inherit" />,
    route: "/coach/seats",
    component: <Seats />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Drill Library",
    nameEs: "Ejercicios",
    key: "coach-drills",
    icon: <FaFutbol size="15px" color="inherit" />,
    route: "/coach/drills",
    component: <CoachDrills />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "My Drills",
    nameEs: "Mis Ejercicios",
    key: "coach-mydrills",
    icon: <IoCreate size="15px" color="inherit" />,
    route: "/coach/mydrills",
    component: <MyDrills />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Tactics Board",
    nameEs: "Tablero Táctico",
    key: "coach-tactics",
    icon: <FaChessBoard size="15px" color="inherit" />,
    route: "/coach/tactics",
    component: <TacticsBoard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Session Planner",
    nameEs: "Plan de Sesión",
    key: "coach-session",
    icon: <IoFlash size="15px" color="inherit" />,
    route: "/coach/session",
    component: <SessionPlanner />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Checkmatch",
    nameEs: "Checkmatch",
    key: "coach-checkmatch",
    icon: <IoGameController size="15px" color="inherit" />,
    route: "/coach/checkmatch",
    component: <Checkmatch />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Automation",
    nameEs: "Automatización",
    key: "coach-automation",
    icon: <IoCog size="15px" color="inherit" />,
    route: "/coach/automation",
    component: <Automation />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "How To Use",
    nameEs: "Cómo Usar",
    key: "coach-demo",
    icon: <IoHelpCircle size="15px" color="inherit" />,
    route: "/coach/demo",
    component: <Demo />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Video Analysis",
    nameEs: "Análisis de Video",
    key: "coach-video",
    icon: <IoImages size="15px" color="inherit" />,
    route: "/coach/video",
    component: <VideoAnalysis />,
    noCollapse: true,
  },
  { type: "divider", key: "divider-settings" },
  {
    type: "collapse",
    name: "Settings",
    nameEs: "Ajustes",
    key: "coach-settings",
    icon: <IoSettings size="15px" color="inherit" />,
    route: "/coach/settings",
    component: <CoachSettings />,
    noCollapse: true,
  },
];

// =============================================
// PARENT ROUTES
// =============================================
const parentRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    nameEs: "Inicio",
    key: "parent-dashboard",
    icon: <IoHome size="15px" color="inherit" />,
    route: "/parent/dashboard",
    component: <ParentDashboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Schedule",
    nameEs: "Calendario",
    key: "parent-schedule",
    icon: <IoCalendar size="15px" color="inherit" />,
    route: "/parent/schedule",
    component: <ParentSchedule />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Messages",
    nameEs: "Mensajes",
    key: "parent-messages",
    icon: <IoChatbubbles size="15px" color="inherit" />,
    route: "/parent/messages",
    component: <ParentMessages />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Payments",
    nameEs: "Pagos",
    key: "parent-payments",
    icon: <IoCard size="15px" color="inherit" />,
    route: "/parent/payments",
    component: <ParentPayments />,
    noCollapse: true,
  },
];

// =============================================
// CHILD ROUTES
// =============================================
const childRoutes = [
  {
    type: "collapse",
    name: "My Card",
    nameEs: "Mi Tarjeta",
    key: "child-card",
    icon: <IoHome size="15px" color="inherit" />,
    route: "/player/card",
    component: <ChildDashboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Badges",
    nameEs: "Insignias",
    key: "child-badges",
    icon: <FaMedal size="15px" color="inherit" />,
    route: "/player/badges",
    component: <ChildBadges />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Leaderboard",
    nameEs: "Tabla",
    key: "child-leaderboard",
    icon: <IoTrophy size="15px" color="inherit" />,
    route: "/player/leaderboard",
    component: <ChildLeaderboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Habits",
    nameEs: "Hábitos",
    key: "child-habits",
    icon: <IoFitness size="15px" color="inherit" />,
    route: "/player/habits",
    component: <ChildHabits />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Schedule",
    nameEs: "Calendario",
    key: "child-schedule",
    icon: <IoCalendar size="15px" color="inherit" />,
    route: "/player/schedule",
    component: <ChildDashboard />,
    noCollapse: true,
  },
];

// =============================================
// AUTH ROUTES (not in sidebar)
// =============================================
const authRoutes = [
  {
    name: "Coach Sign In",
    key: "coach-sign-in",
    route: "/auth/sign-in",
    component: <CoachSignIn />,
  },
  {
    name: "Coach Sign Up",
    key: "coach-sign-up",
    route: "/auth/sign-up/coach",
    component: <CoachSignUp />,
  },
  {
    name: "Parent Sign In",
    key: "parent-sign-in",
    route: "/auth/parent",
    component: <ParentSignIn />,
  },
  {
    name: "Root",
    key: "root-redirect",
    route: "/",
    component: <Navigate to="/coach/dashboard" replace />,
  },
  // TODO: Add password reset
];

// Export route groups
export { coachRoutes, parentRoutes, childRoutes, authRoutes };

// Default export: all routes for the main router
const routes = [...coachRoutes, ...authRoutes];

export default routes;
