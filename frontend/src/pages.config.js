/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import FindProperties from './pages/FindProperties';
import GuestDashboard from './pages/GuestDashboard';
import GuestProfile from './pages/GuestProfile';
import Home from './pages/Home';
import HostDashboard from './pages/HostDashboard';
import HostProfile from './pages/HostProfile';
import Messages from './pages/Messages';
import MyListings from './pages/MyListings';
import MySwaps from './pages/MySwaps';
import Notifications from './pages/Notifications';
import PropertyDetails from './pages/PropertyDetails';
import Settings from './pages/Settings';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Dashboard": Dashboard,
    "FindProperties": FindProperties,
    "GuestDashboard": GuestDashboard,
    "GuestProfile": GuestProfile,
    "Home": Home,
    "HostDashboard": HostDashboard,
    "HostProfile": HostProfile,
    "Messages": Messages,
    "MyListings": MyListings,
    "MySwaps": MySwaps,
    "Notifications": Notifications,
    "PropertyDetails": PropertyDetails,
    "Settings": Settings,
    "SubscriptionPlans": SubscriptionPlans,
    "Documentation": Documentation,
    "Login": Login,
    "ResetPassword": ResetPassword,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};