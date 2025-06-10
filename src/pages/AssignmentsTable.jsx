// src/pages/AssignmentsTable.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Stack,
  Button,
  Paper,
  Chip,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AppContent } from "../context/AppContext";
import DownloadIcon from "@mui/icons-material/Download";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify styles

const statusColor = (status) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "info";
    case "accepted":
      return "primary";
    case "in-progress":
      return "warning";
    case "completed":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

export default function AssignmentsTable() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const { userData } = useContext(AppContent);
  const currentUserId = userData?.id || userData?._id;

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [dialogRow, setDialogRow] = useState(null);
  const [dialogEmpId, setDialogEmpId] = useState("");
  const [dialogDesiredStatus, setDialogDesiredStatus] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMsg, setErrorDialogMsg] = useState("");
  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, uRes, aRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/list-all`, {
          credentials: "include",
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/list-all`, {
          credentials: "include",
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/assignments/list-all`, {
          credentials: "include",
        }),
      ]);
      const [rData, uData, aData] = await Promise.all([
        rRes.json(),
        uRes.json(),
        aRes.json(),
      ]);

      if (uData.success) {
        const filtered = uData.users.filter(
          (u) =>
            u.position?.toLowerCase().includes("district engineer") &&
            u.role?.toLowerCase() !== "admin"
        );
        setEmployees(filtered);
      }

      if (rData.success && aData.success) {
        // Map assignments by reportNumber instead of report ID
        const assignMap = aData.assignments.reduce((m, a) => {
          m[a.reportNumber] = a; // Use reportNumber as key
          return m;
        }, {});

        setRows(
          rData.reports.map((r) => {
            const a = assignMap[r.reportNumber] || {}; // Match by reportNumber
            return {
              id: r.reportNumber, // Use reportNumber as id for the row
              reportNumber: r.reportNumber,
              status: a.status || r.status,
              assignedTo: a.assignedTo || "",
              assignmentId: a._id || "",
              assignmentNumber: a.assignmentNumber || "",
              timestamp: a.createdAt || "",
              siteInspectionReport: a.siteInspectionReport || "",
              originalFileName: a.originalFileName || "",
              accomplishmentDate: a.accomplishmentDate || "",
            };
          })
        );
      }
    } catch (err) {
      console.error(err);
      showError("Load failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // API helpers
  const upsertAssignment = async ({ id, reportNumber, status, assignedTo }) => {
    const url = id
      ? `/api/assignments/update/${id}`
      : `/api/assignments/create`;
    const res = await fetch(import.meta.env.VITE_BACKEND_URL + url, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reportNumber, status, assignedTo }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.assignment;
  };

  const deleteAssignment = async (id) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/assignments/delete/${id}`,
      { method: "DELETE", credentials: "include" }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  };

  const uploadReport = async (assignmentId, file, status) => {
    const form = new FormData();
    form.append("report", file);
    form.append("status", status);
    form.append("userId", currentUserId);
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/assignments/upload-report/${assignmentId}`,
      { method: "POST", credentials: "include", body: form }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.assignment;
  };

  const showError = (msg) => {
    setErrorDialogMsg(msg);
    setErrorDialogOpen(true);
  };

  // handlers
  const handleStatusChange = (rowId, newStatus) => {
    const row = rows.find((r) => r.id === rowId);
    const statusLower = newStatus.toLowerCase();

    if (
      (statusLower === "completed" || statusLower === "rejected") &&
      !row.assignmentId
    ) {
      return showError("Please assign someone first.");
    }

    if (statusLower === "completed" || statusLower === "rejected") {
      setDialogRow(row);
      setDialogDesiredStatus(newStatus); // <--- CHANGE THIS LINE: Use newStatus instead of statusLower
      setCompleteDialogOpen(statusLower === "completed");
      setRejectDialogOpen(statusLower === "rejected");
      return;
    }
    if (statusLower === "submitted" && row.assignmentId) {
      deleteAssignment(row.assignmentId)
        .then(() => {
          toast.success("Status set to Submitted. Assignment cleared.");
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    status: "Submitted",
                    assignedTo: "",
                    assignmentId: "",
                    assignmentNumber: "",
                    timestamp: "",
                    siteInspectionReport: "",
                    accomplishmentDate: "",
                  }
                : r
            )
          );
        })
        .catch((e) => {
          toast.error("Delete failed: " + e.message);
          showError("Delete failed: " + e.message);
        });
      return;
    }
    if (!row.assignedTo) {
      return showError("Please assign someone first.");
    }
    upsertAssignment({
      id: row.assignmentId,
      reportNumber: row.reportNumber,
      status: newStatus,
      assignedTo: row.assignedTo,
    })
      .then((assignment) => {
        toast.success("Status updated successfully!");
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  status: assignment.status,
                  assignmentId: assignment._id,
                  assignmentNumber: assignment.assignmentNumber,
                  timestamp: assignment.createdAt || new Date().toISOString(),
                }
              : r
          )
        );
      })
      .catch((e) => {
        toast.error("Save failed: " + e.message);
        showError("Save failed: " + e.message);
      });
  };

  // Dialog actions
  const confirmComplete = () => {
    setCompleteDialogOpen(false);
    setUploadDialogOpen(true);
  };
  const cancelComplete = () => setCompleteDialogOpen(false);
  const confirmReject = () => {
    setRejectDialogOpen(false);
    setUploadDialogOpen(true);
  };
  const cancelReject = () => setRejectDialogOpen(false);

  const handleUpload = () => {
    uploadReport(dialogRow.assignmentId, reportFile, dialogDesiredStatus)
      .then((assignment) => {
        toast.success("Report uploaded successfully.");
        setRows((prev) =>
          prev.map((r) =>
            r.id === dialogRow.id
              ? {
                  ...r,
                  status:
                    dialogDesiredStatus.charAt(0).toUpperCase() +
                    dialogDesiredStatus.slice(1),
                  assignmentId: assignment._id,
                  assignmentNumber: assignment.assignmentNumber,
                  siteInspectionReport: assignment.siteInspectionReport,
                  originalFileName: assignment.originalFileName,
                  accomplishmentDate: assignment.accomplishmentDate,
                }
              : r
          )
        );
      })
      .catch((e) => {
        toast.error("Upload failed: " + e.message);
        showError("Upload failed: " + e.message);
      })
      .finally(() => {
        setUploadDialogOpen(false);
        setReportFile(null);
      });
  };

  const handleAssignClick = (rowId, newEmpId) => {
    if (newEmpId === "") {
      const row = rows.find((r) => r.id === rowId);
      if (row.assignmentId) {
        deleteAssignment(row.assignmentId)
          .then(() => {
            toast.success("Assignment removed successfully.");
            setRows((prev) =>
              prev.map((r) =>
                r.id === rowId
                  ? {
                      ...r,
                      status: "Submitted",
                      assignedTo: "",
                      assignmentId: "",
                      assignmentNumber: "",
                      timestamp: "",
                      siteInspectionReport: "",
                      accomplishmentDate: "",
                    }
                  : r
              )
            );
          })
          .catch((e) => {
            toast.error("Unassign failed: " + e.message);
            showError("Unassign failed: " + e.message);
          });
      }
      return;
    }
    setDialogRow(rows.find((r) => r.id === rowId));
    setDialogEmpId(newEmpId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAssign = () => {
    setConfirmDialogOpen(false);
    const { id: rowId, reportNumber, status } = dialogRow;
    upsertAssignment({
      id: dialogRow.assignmentId,
      reportNumber,
      status,
      assignedTo: dialogEmpId,
    })
      .then((assignment) => {
        toast.success(
          "Assigned to " + employees.find((u) => u.id === dialogEmpId)?.fullName
        );
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  assignedTo: assignment.assignedTo,
                  assignmentId: assignment._id,
                  assignmentNumber: assignment.assignmentNumber,
                  timestamp: assignment.createdAt || new Date().toISOString(),
                }
              : r
          )
        );
      })
      .catch((e) => {
        toast.error("Save failed: " + e.message);
        showError("Save failed: " + e.message);
      });
  };

  const handleCancelAssign = () => setConfirmDialogOpen(false);

  // --- CSV export helper ---
  const exportCSV = () => {
    // Only export what the grid is showing (post-search)
    const filtered = rows.filter((r) =>
      Object.values(r).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    const header = [
      "Report ID",
      "Status",
      "Assigned To",
      "Job Order No.",
      "Assigned At",
      "Site Inspection Report",
      "Completion Date",
    ];
    const csvRows = filtered.map((r) => [
      r.reportNumber,
      r.status,
      // map assignedTo id → name
      r.assignedTo
        ? employees.find((u) => u.id === r.assignedTo)?.fullName
        : "",
      r.assignmentNumber,
      r.timestamp,
      r.originalFileName || r.siteInspectionReport || "",
      r.accomplishmentDate || "",
    ]);
    const csvContent = [header, ...csvRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { field: "reportNumber", headerName: "Report ID", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row }) => (
        <TextField
          disabled={["completed", "rejected"].includes(
            row.status.toLowerCase()
          )}
          select
          size="small"
          variant="standard"
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          SelectProps={{
            displayEmpty: true,
            renderValue: (v) => (
              <Chip label={v} size="small" color={statusColor(v)} />
            ),
          }}
        >
          {[
            "Submitted",
            "Accepted",
            "In-progress",
            "Completed",
            "Rejected",
          ].map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      field: "assignedTo",
      headerName: "Assigned To",
      flex: 1,
      renderCell: ({ row }) => (
        <TextField
          disabled={userData?.position
            ?.toLowerCase()
            .includes("district engineer")}
          select
          size="small"
          variant="standard"
          value={row.assignedTo}
          onChange={(e) => handleAssignClick(row.id, e.target.value)}
          SelectProps={{
            displayEmpty: true,
            renderValue: (v) =>
              v ? (
                <Chip
                  label={employees.find((u) => u.id === v)?.fullName || ""}
                  size="small"
                />
              ) : (
                <em>Unassigned</em>
              ),
          }}
        >
          <MenuItem value="">
            <em>Unassigned</em>
          </MenuItem>
          {employees.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.fullName}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    { field: "assignmentNumber", headerName: "Job Order No.", flex: 1 },
    {
      field: "timestamp",
      headerName: "Assigned At",
      flex: 1,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleString() : "-",
    },
    {
      field: "siteInspectionReport",
      headerName: "Site Inspection Report",
      flex: 1,
      renderCell: ({ value, row }) =>
        value ? (
          <a
            href={`${import.meta.env.VITE_BACKEND_URL}/uploads/${value}`}
            target="_blank"
          >
            {row.originalFileName || value}
          </a>
        ) : (
          "-"
        ),
    },
    {
      field: "accomplishmentDate",
      headerName: "Completion Date",
      flex: 1,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleString() : "-",
    },
  ];

  const filteredRows = rows.filter((r) =>
    Object.values(r).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Job Order
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        gap={1}
        flexWrap="wrap"
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search…"
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
          <IconButton onClick={fetchData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          onClick={exportCSV} // ← wire up the CSV export
          startIcon={<DownloadIcon />}
          disabled={loading}
        >
          Export CSV
        </Button>
      </Stack>
      <Paper>
        {loading ? (
          <Box p={4} textAlign="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            {/* adjust minWidth to sum of your column widths or experiment */}
            <Box sx={{ minWidth: 800 }}>
              <DataGrid
                autoHeight
                rows={filteredRows}
                columns={columns}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => setPageSize(newSize)}
                pageSizeOptions={[10, 25, 50, 100]}
                pagination
                onRowClick={(params) => {
                  setSelectedRow(params.row);
                  setRowDialogOpen(true);
                }}
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Row Detail Dialog */}
      {/* Row Detail Dialog */}
      <Dialog
        open={rowDialogOpen}
        onClose={() => setRowDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Assignment Details — Report ID: {selectedRow?.reportNumber}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2, px: 2, pb: 2 }}>
          <Stack spacing={2}>
            {selectedRow &&
              [
                [
                  "Status",
                  <Chip
                    key="status"
                    label={selectedRow.status}
                    size="small"
                    color={statusColor(selectedRow.status)}
                    sx={{ textTransform: "capitalize" }}
                  />,
                ],
                [
                  "Assigned To",
                  selectedRow.assignedTo
                    ? employees.find((u) => u.id === selectedRow.assignedTo)
                        ?.fullName
                    : "Unassigned",
                ],
                ["Job Order No.", selectedRow.assignmentNumber || "-"],
                [
                  "Assigned At",
                  selectedRow.timestamp
                    ? new Date(selectedRow.timestamp).toLocaleString()
                    : "-",
                ],
                [
                  "Site Inspection Report",
                  selectedRow.siteInspectionReport ? (
                    <a
                      key="report"
                      href={`${import.meta.env.VITE_BACKEND_URL}/uploads/${selectedRow.siteInspectionReport}`}
                      target="_blank"
                      style={{ display: "inline-block", marginTop: 4 }}
                    >
                      {selectedRow.originalFileName ||
                        selectedRow.siteInspectionReport}
                    </a>
                  ) : (
                    "None"
                  ),
                ],
                [
                  "Completion Date",
                  selectedRow.accomplishmentDate
                    ? new Date(selectedRow.accomplishmentDate).toLocaleString()
                    : "-",
                ],
              ].map(([label, value]) => (
                <Paper key={label} elevation={1} sx={{ p: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {label}
                  </Typography>
                  <Box mt={0.5}>{value}</Box>
                </Paper>
              ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setRowDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Assignment */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelAssign}>
        <DialogTitle>Confirm Assignment</DialogTitle>
        <DialogContent>
          Assign report <strong>{dialogRow?.reportNumber}</strong> to{" "}
          <strong>
            {employees.find((u) => u.id === dialogEmpId)?.fullName}
          </strong>
          ?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAssign}>No</Button>
          <Button onClick={handleConfirmAssign} variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Completion */}
      <Dialog open={completeDialogOpen} onClose={cancelComplete}>
        <DialogTitle>Confirm Completion</DialogTitle>
        <DialogContent>
          Mark report <strong>{dialogRow?.reportNumber}</strong> as completed?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelComplete}>No</Button>
          <Button onClick={confirmComplete} variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Rejection */}
      <Dialog open={rejectDialogOpen} onClose={cancelReject}>
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>
          Mark report <strong>{dialogRow?.reportNumber}</strong> as rejected?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelReject}>No</Button>
          <Button onClick={confirmReject} variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Site Inspection Report */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Upload Site Inspection Report
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: 2, pb: 1 }}>
          <Box
            sx={{
              border: "2px dashed",
              borderColor: reportFile ? "primary.main" : "text.secondary",
              borderRadius: 1,
              p: 2,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": { backgroundColor: "action.hover" },
            }}
            onClick={() => document.getElementById("file-input").click()}
          >
            {reportFile ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1}
              >
                <AttachFileIcon color="primary" />
                <Typography>{reportFile.name}</Typography>
              </Stack>
            ) : (
              <Stack direction="column" alignItems="center" spacing={1}>
                <UploadFileIcon fontSize="large" color="disabled" />
                <Typography variant="body2" color="textSecondary">
                  Click to select PDF
                </Typography>
              </Stack>
            )}
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => setReportFile(e.target.files[0])}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!reportFile}
            startIcon={<UploadFileIcon />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>{errorDialogMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
