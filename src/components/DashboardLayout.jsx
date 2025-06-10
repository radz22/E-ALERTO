import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import PeopleIcon from "@mui/icons-material/People";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useDemoRouter } from "@toolpad/core/internal";
import { assets } from "../assets/assets";
import { useContext, useMemo } from "react";
import { AppContent } from "../context/AppContext";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { MenuList, MenuItem, ListItemText, ListItemIcon } from "@mui/material";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { Popover } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import EmployeesTable from "../pages/EmployeesTable";
import PersonIcon from "@mui/icons-material/Person";
import EngineeringIcon from "@mui/icons-material/Engineering";
import RegUserTable from "../pages/regUserTable";
import WarningIcon from "@mui/icons-material/Warning";
import ResetPasswordIcon from "@mui/icons-material/Lock";
import ReportsTable from "../pages/ReportsTable";
import TrafficChart from "../pages/TrafficChart";
import AccomplishmentChart from "../pages/AccomplishmentChart";
import DashboardHome from "../pages/DashboardHome";
import StarIcon from "@mui/icons-material/Star";
import TimelineIcon from "@mui/icons-material/Timeline";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentsTable from "../pages/AssignmentsTable";
import ActivityLogsTable from "../pages/activityLogsTable";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountInfo from "../pages/AccountInfo";
import PageLock from "../pages/PageLock"; // Add at top
import FeedbackTable from "../pages/FeedbackTable";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DupaCostChart from "../pages/DupaCostChart";

const NAVIGATION = [
  {
    kind: "header",
    title: "Main",
  },
  {
    segment: "dashboard",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "report-management",
    title: "Report Management",
    icon: <DescriptionIcon />,
    children: [
      {
        segment: "reports",
        title: "All Reports",
        icon: <LayersIcon />,
      },
      {
        segment: "assignments",
        title: "Job Order",
        icon: <AssignmentIcon />,
      },
      {
        segment: "feedback",
        title: "Feedback",
        icon: <StarIcon />,
      },
    ],
  },
  {
    segment: "accounts",
    title: "Account Management",
    icon: <PeopleIcon />,
    children: [
      {
        segment: "users",
        title: "Users",
        icon: <PersonIcon />,
      },
      {
        segment: "employees",
        title: "Employees",
        icon: <EngineeringIcon />,
      },
    ],
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Insights",
  },
  {
    segment: "charts",
    title: "Charts",
    icon: <BarChartIcon />,
    children: [
      {
        segment: "accomplishment",
        title: "Accomplishment",
        icon: <StackedLineChartIcon />,
      },
      {
        segment: "traffic",
        title: "Traffic",
        icon: <TimelineIcon />,
      },
      {
        segment: "cost",
        title: "Cost",
        icon: <AttachMoneyIcon />,
      },
    ],
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "System",
  },
  {
    segment: "settings",
    title: "Settings",
    icon: <SettingsIcon />,
    children: [
      {
        segment: "activity_logs",
        title: "Activity Logs",
        icon: <WarningIcon />,
      },
      {
        segment: "profile_information",
        title: "Profile Information",
        icon: <AccountCircleIcon />,
      },
    ],
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function DemoPageContent({ pathname }) {
  return (
    <Box
      sx={{
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography>Dashboard content for {pathname}</Typography>
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

function SidebarFooterAccount({ mini }) {
  const { userData, backendUrl, setUserData, setIsLoggedIn } =
    useContext(AppContent);
  const navigate = useNavigate();

  const first = userData?.firstName || "";
  const middle = userData?.middleName ? ` ${userData.middleName}` : "";
  const surname = userData?.surname || "";
  const displayName = `${first}${middle} ${surname}`.trim() || "Guest";
  const avatarInitial = displayName.charAt(0).toUpperCase() || "U";

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendUrl}/api/auth/logout`);
      if (data.success) {
        setUserData(null);
        setIsLoggedIn(false);
        navigate("/login");
      } else {
        console.error("Logout failed:", data.message);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: { xs: "row", sm: mini ? "column" : "row" },
        gap: 1,
        width: "100%",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Avatar
          sx={{
            bgcolor: "#263092",
            color: "white",
            width: 32,
            height: 32,
            fontSize: 14,
          }}
        >
          {avatarInitial}
        </Avatar>
        {!mini && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={500}
              noWrap
              sx={{ maxWidth: 120 }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ maxWidth: 120 }}
            >
              {userData?.email || ""}
            </Typography>
          </Box>
        )}
      </Stack>
      <IconButton
        onClick={logout}
        size="small"
        title="Logout"
        sx={{
          color: "#555",
          mt: { xs: 0, sm: mini ? 1 : 0 },
          alignSelf: { xs: "flex-end", sm: "center" },
        }}
      >
        <LogoutIcon />
      </IconButton>
    </Box>
  );
}

SidebarFooterAccount.propTypes = { mini: PropTypes.bool.isRequired };

function DashboardLayoutBasic(props) {
  const { window } = props;
  const router = useDemoRouter("/dashboard");
  const demoWindow = window !== undefined ? window() : undefined;
  const { userData } = useContext(AppContent);
  const isVerified = userData?.isAccountVerified;

  const pos = userData?.position?.toLowerCase() || "";
  const isSuperAdmin = pos.includes("super admin");
  const isAdmin = !isSuperAdmin && pos.includes("admin");
  const isEngineer = pos.includes("district engineer");

  const navigation = useMemo(() => {
    if (isSuperAdmin) {
      return NAVIGATION;
    }

    if (isAdmin) {
      return NAVIGATION.reduce((acc, item) => {
        if (item.kind) {
          acc.push(item);
          return acc;
        }
        if (
          item.segment === "dashboard" ||
          item.segment === "report-management" ||
          item.segment === "charts"
        ) {
          acc.push(item);
          return acc;
        }
        if (item.segment === "accounts") {
          const children = item.children.filter(
            (c) => c.segment === "employees"
          );
          if (children.length) acc.push({ ...item, children });
          return acc;
        }
        if (item.segment === "settings") {
          const children = item.children.filter(
            (c) => c.segment === "profile_information"
          );
          if (children.length) acc.push({ ...item, children });
          return acc;
        }
        return acc;
      }, []);
    }
    if (isEngineer) {
      return [
        { kind: "header", title: "Main" },
        {
          ...NAVIGATION.find((i) => i.segment === "report-management"),
          children: NAVIGATION.find(
            (i) => i.segment === "report-management"
          ).children.filter((c) =>
            ["reports", "assignments"].includes(c.segment)
          ),
        },
        { kind: "header", title: "System" },
        {
          ...NAVIGATION.find((i) => i.segment === "settings"),
          children: NAVIGATION.find(
            (i) => i.segment === "settings"
          ).children.filter((c) => c.segment === "profile_information"),
        },
      ];
    }

    return NAVIGATION;
  }, [isSuperAdmin, isAdmin, isEngineer]);

  return (
    <AppProvider
      navigation={navigation}
      router={router}
      theme={demoTheme}
      window={demoWindow}
      branding={{
        logo: <img src={assets.logo} alt="Logo" style={{ height: 32 }} />,
        title: "",
        homeUrl: "/dashboard",
      }}
    >
      <DashboardLayout slots={{ sidebarFooter: SidebarFooterAccount }}>
        {router.pathname === "/report-management/reports" ? (
          isSuperAdmin || isAdmin || isEngineer ? (
            isVerified ? (
              <ReportsTable />
            ) : (
              <PageLock
                title="Reports Locked"
                message="Verify your account to view reports. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Reports Locked"
              message="Verify your account to view reports. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/report-management/assignments" ? (
          isSuperAdmin || isAdmin || isEngineer ? (
            isVerified ? (
              <AssignmentsTable />
            ) : (
              <PageLock
                title="Job Order Locked"
                message="Verify your account to view job orders. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Job Order Locked"
              message="Verify your account to view job orders. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/report-management/feedback" ? (
          isSuperAdmin || isAdmin ? (
            isVerified ? (
              <FeedbackTable />
            ) : (
              <PageLock
                title="Feedback Locked"
                message="Verify your account to view feedback. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Feedback Locked"
              message="Verify your account to view feedback. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/settings/activity_logs" ? (
          isSuperAdmin ? (
            isVerified ? (
              <ActivityLogsTable />
            ) : (
              <PageLock
                title="Activity Logs Locked"
                message="Verify your account to view activity logs. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Activity Logs Locked"
              message="Verify your account to view activity logs. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/accounts/users" ? (
          isSuperAdmin ? (
            isVerified ? (
              <RegUserTable />
            ) : (
              <PageLock
                title="Users Locked"
                message="Verify your account to view users. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Users Locked"
              message="Verify your account to view users. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/accounts/employees" ? (
          isSuperAdmin || isAdmin ? (
            isVerified ? (
              <EmployeesTable />
            ) : (
              <PageLock
                title="Employees Locked"
                message="Verify your account to view employees. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Employees Locked"
              message="Verify your account to view employees. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/settings/profile_information" ? (
          <AccountInfo />
        ) : router.pathname === "/dashboard" ? (
          isEngineer ? (
            // If the user is a District Engineer, route to ReportsTable
            isVerified ? (
              <ReportsTable />
            ) : (
              <PageLock
                title="Reports Locked"
                message="Verify your account to view reports. Go to your profile information page under settings to verify."
              />
            )
          ) : // For Super Admins and Admins, show DashboardHome
          isSuperAdmin || isAdmin ? (
            isVerified ? (
              <DashboardHome />
            ) : (
              <PageLock
                title="Dashboard Locked"
                message="Verify your account to view dashboard. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Dashboard Locked"
              message="Verify your account to view dashboard. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/charts/traffic" ? (
          isSuperAdmin || isAdmin || isEngineer ? (
            isVerified ? (
              <TrafficChart />
            ) : (
              <PageLock
                title="Traffic Chart Locked"
                message="Verify your account to view traffic chart. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Traffic Chart Locked"
              message="Verify your account to view traffic chart. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/charts/accomplishment" ? (
          isSuperAdmin || isAdmin || isEngineer ? (
            isVerified ? (
              <AccomplishmentChart />
            ) : (
              <PageLock
                title="Accomplishment Chart Locked"
                message="Verify your account to view accomplishment chart. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Accomplishment Chart Locked"
              message="Verify your account to view accomplishment chart. Go to your profile information page under settings to verify."
            />
          )
        ) : router.pathname === "/charts/cost" ? (
          isSuperAdmin || isAdmin || isEngineer ? (
            isVerified ? (
              <DupaCostChart />
            ) : (
              <PageLock
                title="Cost Chart Locked"
                message="Verify your account to view cost chart. Go to your profile information page under settings to verify."
              />
            )
          ) : (
            <PageLock
              title="Cost Chart Locked"
              message="Verify your account to view cost chart. Go to your profile information page under settings to verify."
            />
          )
        ) : (
          <DemoPageContent pathname={router.pathname} />
        )}
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutBasic.propTypes = {
  window: PropTypes.func,
};

export default DashboardLayoutBasic;
