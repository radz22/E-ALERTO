// src/pages/ReportsTable.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  Button,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import DupaBreakdown from "../components/DupaBreakdown";
import { AppContent } from "../context/AppContext"; // Import the context to get user data
import { Circle } from "@mui/icons-material";

const statusColors = {
  Submitted: "#0288d1",
  Accepted: "#1976d2",
  "In-progress": "#fbc02d",
  Completed: "#388e3c",
  Rejected: "#d32f2f",
};

export default function ReportsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);

  const { userData } = useContext(AppContent); // Access user data from the context

  // Check if the user is a District Engineer
  const isEngineer = userData?.position
    ?.toLowerCase()
    .includes("district engineer");

  // Declare the missing state variables
  const [taskOpen, setTaskOpen] = useState(false); // Added useState for taskOpen
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [imgOpen, setImgOpen] = useState(false);

  // Fetch reports from API
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/list-all`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setRows(
          data.reports.map((r) => ({
            id: r.reportNumber,
            reportNumber: r.reportNumber,
            image: r.image,
            classification: r.classification,
            measurement: r.measurement,
            location: r.location,
            district: r.district,
            status: r.status,
            description: r.description,
            timestamp: r.timestamp,
            daysSinceReport: r.daysSinceReport,
            duplicateCounter: r.duplicateCounter,
          }))
        );

        // Count the number of reports for each status
        const statusCounts = data.reports.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {});
        setCounts(statusCounts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const statusColor = (status) => {
    switch (status.toLowerCase()) {
      case "resolved":
      case "completed":
        return "success";
      case "submitted":
        return "info";
      case "in-progress":
      case "in progress":
        return "warning";
      case "rejected":
        return "error";
      case "accepted":
        return "primary";
      default:
        return "default";
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    {
      field: "image",
      headerName: "Img",
      width: 80,
      renderCell: ({ value }) => (
        <img
          src={`${import.meta.env.VITE_BACKEND_URL}/api/reports/image/${value}`}
          alt=""
          style={{
            width: 40,
            height: 40,
            objectFit: "cover",
            borderRadius: 4,
            cursor: "pointer",
          }}
        />
      ),
    },
    { field: "classification", headerName: "Class.", flex: 1 },
    { field: "measurement", headerName: "Measure", flex: 1 },
    { field: "location", headerName: "Location", flex: 2 },
    { field: "district", headerName: "District", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row }) => (
        <Chip
          label={row.status}
          size="small"
          color={statusColor(row.status)}
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    { field: "description", headerName: "Desc.", flex: 2 },
    {
      field: "timestamp",
      headerName: "Date/Time",
      flex: 1,
      renderCell: ({ value }) => new Date(value).toLocaleString(),
    },
    {
      field: "daysSinceReport",
      headerName: "Time Since Submission",
      flex: 1,
      renderCell: ({ value }) => {
        let dotColor = "gray"; // Default color

        if (value >= 0 && value <= 3) {
          dotColor = "green";
        } else if (value >= 4 && value <= 7) {
          dotColor = "yellow";
        } else if (value >= 8 && value <= 10) {
          dotColor = "red";
        }

        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{ height: "100%" }}
          >
            <Circle
              sx={{
                fontSize: 16,
                color: dotColor,
              }}
            />
            <Typography variant="body2">{value} Days</Typography>
          </Box>
        );
      },
    },
    {
      field: "duplicateCounter",
      headerName: "Priority",
      flex: 1,
      align: "center",
      renderCell: ({ value }) => value,
    },
    {
      field: "taskOverview",
      headerName: "Task Overview",
      flex: 1,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setCurrent(params.row);
            setTaskOpen(true); // Open Task Overview dialog
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const filtered = rows.filter((r) =>
    Object.values(r).some((v) =>
      String(v).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleRowClick = ({ row }) => {
    setCurrent(row);
    setDetailOpen(true);
  };

  const exportCSV = () => {
    const csv = [
      [
        "ID",
        "Classification",
        "Measurement",
        "Location",
        "District",
        "Status",
        "Description",
        "Timestamp",
        "Priority",
      ],
      ...rows.map((r) => [
        r.id,
        r.classification,
        r.measurement,
        `"${r.location.replace(/"/g, '""')}"`, // Ensure location is wrapped in quotes
        r.district,
        r.status,
        r.description,
        `"${new Date(r.timestamp).toLocaleString().replace(/"/g, '""')}"`, // Ensure timestamp is wrapped in quotes
        r.duplicateCounter,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Reports
      </Typography>

      {/* Render status cards only for District Engineers */}
      {isEngineer && (
        <Box mb={4} sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {[
            "Submitted",
            "Accepted",
            "In-progress",
            "Completed",
            "Rejected",
          ].map((status) => (
            <Card
              key={status}
              sx={{
                flex: "1 1 calc(20% - 16px)",
                minWidth: 150,
                borderLeft: `5px solid ${statusColors[status]}`,
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {status}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    counts[status] || 0
                  )}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        gap={1}
        flexWrap="wrap" // Add this line
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={fetchReports} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Stack>

      <Paper>
        {loading ? (
          <Box p={4} textAlign="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ minWidth: 1000 }}>
              <DataGrid
                rows={filtered}
                columns={columns}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => setPageSize(newSize)}
                pageSizeOptions={[10, 25, 50, 100]}
                pagination
                autoHeight
                onRowClick={handleRowClick}
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Task Overview Dialog */}
      <Dialog
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Task Overview — Report ID: {current?.reportNumber}
        </DialogTitle>
        <DialogContent>
          {current ? (
            <DupaBreakdown
              reportId={current.id}
              measurement={current.measurement}
              classification={current.classification}
              onMeasurementUpdated={(updatedMeasurement) => {
                fetchReports();
                setCurrent((r) => ({
                  ...r,
                  measurement: updatedMeasurement,
                }));
              }}
            />
          ) : (
            <Typography>No report selected.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setTaskOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Report Details — ID: {current?.id}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1, pb: 2 }}>
          {current && (
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={4}
            >
              <Box flex="1" textAlign="center">
                <Box
                  component="img"
                  src={`${import.meta.env.VITE_BACKEND_URL}/api/reports/image/${current.image}`}
                  alt=""
                  sx={{
                    width: "100%",
                    maxHeight: 300,
                    objectFit: "cover",
                    borderRadius: 2,
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  onClick={() => setImgOpen(true)}
                />
              </Box>
              <Box flex="2" display="flex" flexDirection="column" gap={2}>
                {[
                  ["Classification", current.classification],
                  ["Measurement", current.measurement],
                  ["Location", current.location],
                  ["Status", current.status],
                  ["Description", current.description],
                  ["Date & Time", new Date(current.timestamp).toLocaleString()],
                ].map(([label, val]) => (
                  <Box key={label}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {label}
                    </Typography>
                    {label === "Status" ? (
                      <Chip
                        label={val}
                        size="small"
                        color={statusColor(val)}
                        sx={{ textTransform: "capitalize", mt: 0.5 }}
                      />
                    ) : (
                      <Typography variant="body1" component="div">
                        {val}
                      </Typography>
                    )}
                  </Box>
                ))}
                {/* Add the "Elapsed Days" logic */}
                <Box
                  key="Elapsed Days"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Elapsed Days
                  </Typography>
                  <Circle
                    sx={{
                      fontSize: 16,
                      color:
                        current.daysSinceReport <= 3
                          ? "green"
                          : current.daysSinceReport <= 7
                            ? "yellow"
                            : current.daysSinceReport <= 10
                              ? "red"
                              : "gray",
                    }}
                  />
                  <Typography variant="body1">
                    {current.daysSinceReport} Days
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 2, p: 0 } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            component="img"
            src={`${import.meta.env.VITE_BACKEND_URL}/api/reports/image/${current?.image}`}
            alt="Zoomed report"
            sx={{ width: "100%", height: "auto", display: "block" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
