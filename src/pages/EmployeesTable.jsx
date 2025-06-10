import React, { useContext } from "react";
import PropTypes from "prop-types";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Stack,
  Button,
  Paper,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AppContent } from "../context/AppContext";

const nameRx = /^[A-Za-z\s\-\.]+$/; // letters, spaces, hyphens, periods
const emailRx = /^[^\s@]+@gmail\.com$/; // must end with @gmail.com
const phoneRx = /^\+639\d{9}$/; // +63 and 10 digits

export default function EmployeesTable() {
  const theme = useTheme();

  // Access logged-in user data from context
  const { userData } = useContext(AppContent);

  // table & dialog state
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [pageSize, setPageSize] = React.useState(10);
  const [dialogOpen, setDialogOpen] = React.useState(false); // For New/Edit Employee Form
  const [mode, setMode] = React.useState("new");
  const [current, setCurrent] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState(null);

  // --- State for confirmation dialogs ---
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [rowToDelete, setRowToDelete] = React.useState(null);

  const [confirmEditOpen, setConfirmEditOpen] = React.useState(false); // New state for edit confirmation
  const [rowToEdit, setRowToEdit] = React.useState(null); // New state to hold row for edit confirmation

  // fetch employees
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/list-all`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setRows(json.users.map((u) => ({ id: u.id, ...u })));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // validation logic
  const validate = (f) => {
    const err = {};
    if (!f.surname) err.surname = "Required";
    else if (!nameRx.test(f.surname))
      err.surname = "Letters, spaces, hyphens & periods only";
    if (!f.firstName) err.firstName = "Required";
    else if (!nameRx.test(f.firstName))
      err.firstName = "Letters, spaces, hyphens & periods only";
    if (f.middleName && !nameRx.test(f.middleName))
      err.middleName = "Letters, spaces, hyphens & periods only";
    if (f.suffix && !nameRx.test(f.suffix))
      err.suffix = "Letters, spaces, hyphens & periods only";
    if (!f.district) err.district = "Required";
    if (!f.position) err.position = "Required";

    if (!f.email) err.email = "Required";
    else if (!emailRx.test(f.email))
      err.email = "Must be a valid @gmail.com address";
    // Add uniqueness check for email
    else if (
      rows.some(
        (row) =>
          row.email.toLowerCase() === f.email.toLowerCase() &&
          !(mode === "edit" && row.id === current.id)
      )
    ) {
      err.email = "Email already exists";
    }

    if (!f.phone) err.phone = "Required";
    else if (!phoneRx.test(f.phone))
      err.phone = "Must be 10 digits starting at 9 (e.g., +639XXXXXXXXX)"; // More descriptive
    // Add uniqueness check for phone number
    else if (
      rows.some(
        (row) =>
          row.phone === f.phone && !(mode === "edit" && row.id === current.id)
      )
    ) {
      err.phone = "Phone number already exists";
    }
    return err;
  };

  // immediate field-level validation
  const handleFieldChange = (key) => (e) => {
    const value = e.target.value;
    setCurrent((c) => ({ ...c, [key]: value }));
    const fieldErrs = validate({ ...current, [key]: value });
    setErrors((err) => ({ ...err, [key]: fieldErrs[key] }));
  };

  // --- Dialog Controls ---
  const openNew = () => {
    setMode("new");
    setCurrent({
      surname: "",
      firstName: "",
      middleName: "",
      suffix: "",
      district: "",
      position: "",
      email: "",
      phone: "", // Ensure phone is initialized correctly
    });
    setErrors({});
    setDialogOpen(true);
  };

  // Function to open the main edit form dialog after confirmation
  const openEdit = (row) => {
    // Prevent opening edit for Super Admin
    if (row.position === "Super Admin") {
      toast.info("Super Admin account cannot be edited.");
      return;
    }
    setMode("edit");
    // Ensure phone is stored as +639XXXXXXXXX in `current`
    setCurrent(row);
    setErrors({});
    setDialogOpen(true);
  };

  // Function to open the delete confirmation dialog
  const handleDeleteClick = (event, row) => {
    event.stopPropagation(); // Stop event bubbling to prevent detail dialog from opening
    if (row.position === "Super Admin") {
      toast.info("Super Admin account cannot be deleted.");
      return;
    }
    setRowToDelete(row);
    setConfirmDeleteOpen(true);
  };

  // Function to handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false); // Close the confirmation dialog
    if (!rowToDelete) return;

    // Redundant check, but good for safety
    if (rowToDelete.position === "Super Admin") {
      toast.error("Deletion of Super Admin account is not allowed.");
      setRowToDelete(null); // Clear the rowToDelete state
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/delete/${rowToDelete.id}`,
        { method: "DELETE", credentials: "include" }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message);
        return;
      }
      fetchData();
      toast.success(
        `Employee ${
          rowToDelete.fullName ||
          rowToDelete.firstName + " " + rowToDelete.surname
        } deleted`
      );
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    } finally {
      setRowToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setRowToDelete(null);
  };

  // New functions for Edit Confirmation
  const handleEditClick = (event, row) => {
    event.stopPropagation(); // Stop event bubbling to prevent detail dialog from opening
    if (row.position === "Super Admin") {
      toast.info("Super Admin account cannot be edited.");
      return;
    }
    setRowToEdit(row);
    setConfirmEditOpen(true);
  };

  const handleConfirmEdit = () => {
    setConfirmEditOpen(false); // Close the confirmation dialog
    if (rowToEdit) {
      // Redundant check, but good for safety
      if (rowToEdit.position === "Super Admin") {
        toast.error("Editing Super Admin account is not allowed.");
        setRowToEdit(null);
        return;
      }
      openEdit(rowToEdit); // Open the main edit dialog
    }
    setRowToEdit(null); // Clear the rowToEdit state
  };

  const handleCancelEdit = () => {
    setConfirmEditOpen(false);
    setRowToEdit(null);
  };

  const handleRowClick = ({ row }) => {
    // This will only open if the click was not on an action button
    // Prevent opening detail for Super Admin
    if (row.position === "Super Admin") {
      // You could show a toast here if desired, but often it's just visually disabled
      // toast.info("Details for Super Admin account are not viewable directly.");
      return;
    }
    setDetailRow(row);
    setDetailOpen(true);
  };

  // save handler
  const handleSave = async () => {
    // If we're editing a Super Admin (which shouldn't happen if UI is disabled, but as a safeguard)
    if (mode === "edit" && current.position === "Super Admin") {
      toast.error("Saving changes to Super Admin account is not allowed.");
      return;
    }

    const validationErrors = validate(current);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    try {
      const url =
        mode === "new"
          ? `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`
          : `${import.meta.env.VITE_BACKEND_URL}/api/user/update/${current.id}`;
      const method = mode === "new" ? "POST" : "PUT";
      const body =
        mode === "new" ? { ...current } : { ...current, userId: current.id };

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message);
        return;
      }

      setDialogOpen(false);
      fetchData();
      toast.success(mode === "new" ? "Employee created" : "Employee updated");
    } catch (e) {
      toast.error("Save failed: " + e.message);
    }
  };

  // Handle dropdown options based on logged-in user position
  let positionOptions = ["District Engineer"]; // Default for Admin
  if (userData?.position === "Super Admin") {
    positionOptions = ["District Engineer", "Admin"]; // Super Admin can choose both
  }

  // --- table columns ---
  const columns = [
    { field: "employeeNumber", headerName: "Employee No.", flex: 1 },
    { field: "surname", headerName: "Surname", flex: 1 },
    { field: "firstName", headerName: "First Name", flex: 1 },
    { field: "middleName", headerName: "Middle Name", flex: 1 },
    { field: "suffix", headerName: "Suffix", flex: 1 },
    { field: "district", headerName: "District", flex: 1 },
    { field: "position", headerName: "Position", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: ({ row }) => {
        // Determine if the current row is a Super Admin
        const isSuperAdmin = row.position === "Super Admin";

        return (
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              color="primary"
              onClick={(event) => handleEditClick(event, row)}
              disabled={isSuperAdmin} // Disable if Super Admin
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(event) => handleDeleteClick(event, row)}
              disabled={isSuperAdmin} // Disable if Super Admin
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      },
    },
  ];

  // filter & render
  const filtered = rows.filter((r) =>
    Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Employees
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <Box display="flex" alignItems="center" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const exportToCSV = () => {
                const csvContent = [
                  [
                    "Employee No.",
                    "Surname",
                    "First Name",
                    "Middle Name",
                    "Suffix",
                    "District",
                    "Position",
                    "Email",
                    "Phone",
                  ],
                  ...rows.map((u) => [
                    u.employeeNumber,
                    u.surname,
                    u.firstName,
                    u.middleName,
                    u.suffix,
                    u.district,
                    u.position,
                    u.email,
                    u.phone,
                  ]),
                ]
                  .map((row) => row.join(","))
                  .join("\n");

                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "employees.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              exportToCSV(); // Ensure the function is called
            }}
            disabled={loading}
          >
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            New Employee
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
                autoHeight
                rows={filtered}
                columns={columns}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => setPageSize(newSize)}
                pageSizeOptions={[10, 25, 50, 100]}
                pagination
                onRowClick={handleRowClick}
                sx={{
                  "& .MuiDataGrid-row:nth-of-type(odd)": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: theme.palette.action.selected,
                  },
                  // Visually disable the super admin row (optional, but good UX)
                  "& .super-admin-row": {
                    backgroundColor: theme.palette.grey[200], // A light grey
                    cursor: "not-allowed",
                  },
                }}
                // Add a getRowClassName prop to apply a class to the super admin row
                getRowClassName={(params) =>
                  params.row.position === "Super Admin" ? "super-admin-row" : ""
                }
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Create/Edit Dialog (Main Form) */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {mode === "new" ? "New Employee" : "Edit Employee"}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: 2, pb: 2 }}>
          <Stack spacing={2}>
            {[
              ["Surname", "surname", true],
              ["First Name", "firstName", true],
              ["Middle Name (opt)", "middleName", false],
              ["Suffix (opt)", "suffix", false],
              [
                "District",
                "district",
                true,
                [
                  "District 1",
                  "District 2",
                  "District 3",
                  "District 4",
                  "District 5",
                  "District 6",
                  "Central Comm",
                ],
              ],
              ["Position", "position", true, positionOptions], // Use dynamic options
              ["Email", "email", true],
            ].map(([label, key, req, opts]) => {
              const val = current[key] || "";
              const errMsg = errors[key] || "";
              // Disable position field for Super Admin if editing
              const isPositionDisabled =
                mode === "edit" &&
                current.position === "Super Admin" &&
                key === "position";

              return Array.isArray(opts) ? (
                <TextField
                  key={key}
                  select
                  required={req}
                  label={label}
                  fullWidth
                  value={val}
                  error={!!errMsg}
                  helperText={errMsg}
                  onChange={handleFieldChange(key)}
                  disabled={isPositionDisabled} // Disable position for Super Admin
                >
                  {opts.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  key={key}
                  required={req}
                  label={label}
                  fullWidth
                  value={val}
                  error={!!errMsg}
                  helperText={errMsg}
                  onChange={handleFieldChange(key)}
                  // Disable email field for Super Admin if editing (as email is usually immutable for core admin accounts)
                  disabled={
                    mode === "edit" &&
                    current.position === "Super Admin" &&
                    key === "email"
                  }
                />
              );
            })}
            {/* THIS IS THE CORRECT PHONE FIELD TO KEEP */}
            <TextField
              label="Phone"
              required
              fullWidth
              // Display only the digits, remove +63 for user input convenience
              value={(current.phone || "").replace(/^\+63/, "")}
              error={!!errors.phone}
              helperText={errors.phone}
              onChange={(e) =>
                handleFieldChange("phone")({
                  target: {
                    // Prepend +63 to the entered digits before updating state
                    value: `+63${e.target.value
                      .replace(/\D/g, "") // Remove non-digits
                      .slice(0, 10)}`, // Limit to 10 digits after +63
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">+63</InputAdornment>
                ),
              }}
              // Disable phone field for Super Admin if editing
              disabled={mode === "edit" && current.position === "Super Admin"}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            // Disable save button if editing a Super Admin
            disabled={mode === "edit" && current.position === "Super Admin"}
          >
            {mode === "new" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete employee{" "}
            <strong>
              {rowToDelete?.firstName} {rowToDelete?.surname} (
              {rowToDelete?.employeeNumber})
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Confirmation Dialog (New) */}
      <Dialog
        open={confirmEditOpen}
        onClose={handleCancelEdit}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Edit</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to edit the details for employee{" "}
            <strong>
              {rowToEdit?.firstName} {rowToEdit?.surname} (
              {rowToEdit?.employeeNumber})
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleCancelEdit} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            color="primary"
            variant="contained"
          >
            Edit Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Employee Details</DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: 2, pb: 2 }}>
          <Stack spacing={2}>
            {detailRow &&
              [
                ["Employee No.", detailRow.employeeNumber],
                ["Surname", detailRow.surname],
                ["First Name", detailRow.firstName],
                ["Middle Name", detailRow.middleName],
                ["Suffix", detailRow.suffix],
                ["District", detailRow.district],
                ["Position", detailRow.position],
                ["Email", detailRow.email],
                ["Phone", detailRow.phone],
              ].map(([lbl, val]) => (
                <Paper key={lbl} elevation={1} sx={{ p: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {lbl}
                  </Typography>
                  <Box mt={0.5}>{val}</Box>
                </Paper>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

EmployeesTable.propTypes = {
  window: PropTypes.func,
};
