// src/pages/AccountInfo.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Avatar,
  Divider,
  TextField,
  Tooltip,
  IconButton,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
} from "@mui/material";
import { AppContent } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LockIcon from "@mui/icons-material/Lock";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

export default function AccountInfo() {
  const { userData, isLoading, backendUrl, setUserData } =
    useContext(AppContent);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeNumber: "",
    surname: "",
    firstName: "",
    middleName: "",
    suffix: "",
    district: "",
    position: "",
    email: "",
    phone: "", // includes +63 prefix
  });

  // populate formData on load
  useEffect(() => {
    if (userData) {
      setFormData({
        employeeNumber: userData.employeeNumber || "",
        surname: userData.surname || "",
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        suffix: userData.suffix || "",
        district: userData.district || "",
        position: userData.position || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    }
  }, [userData]);

  // build display name
  const displayName = [
    formData.firstName,
    formData.middleName,
    formData.surname,
    formData.suffix,
  ]
    .filter((p) => p && p.trim())
    .join(" ");

  const avatarInitial =
    formData.firstName?.[0]?.toUpperCase() ||
    formData.surname?.[0]?.toUpperCase() ||
    "U";

  const handleVerify = () => navigate("/email-verify");
  const handleResetPwd = () => navigate("/reset-password");

  // cancel edit
  const handleCancelEdit = () => {
    setFormData((f) => ({
      ...f,
      email: userData.email,
      phone: userData.phone,
    }));
    setEditing(false);
  };

  // validation flags
  const isEmailValid = /^[^\s@]+@gmail\.com$/.test(formData.email);
  const phoneDigits = formData.phone.replace(/^\+63/, "");
  const isPhoneValid = /^9\d{9}$/.test(phoneDigits);

  // prepare and send update
  const runSave = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/user/update/${userData._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          district: formData.district,
          position: formData.position,
          email: formData.email,
          phone: formData.phone,
          userId: userData._id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setUserData((u) => ({
        ...u,
        email: formData.email,
        phone: formData.phone,
      }));
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Update failed: " + err.message);
    }
  };

  const handleRequestSave = () => setConfirmOpen(true);
  const handleCloseConfirm = () => setConfirmOpen(false);
  const handleConfirm = () => {
    setConfirmOpen(false);
    runSave();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (!userData) {
    return (
      <Typography color="error">Unable to load account information.</Typography>
    );
  }

  // fields that never change
  const alwaysFields = [
    ["Employee No.", formData.employeeNumber],
    ["Surname", formData.surname],
    ["First Name", formData.firstName],
    ["Middle Name", formData.middleName || ""],
    ["Suffix", formData.suffix || ""],
    ["District", formData.district],
    ["Position", formData.position],
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* header toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Account Information
        </Typography>
        <Box>
          {!userData.isAccountVerified && (
            <Tooltip title="Verify Profile">
              <IconButton onClick={handleVerify}>
                <VerifiedUserIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Reset Password">
            <IconButton onClick={handleResetPwd}>
              <LockIcon />
            </IconButton>
          </Tooltip>
          {editing ? (
            <>
              <Tooltip
                title={
                  isEmailValid && isPhoneValid
                    ? "Save Changes"
                    : "Fix errors before saving"
                }
              >
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleRequestSave}
                    disabled={!isEmailValid || !isPhoneValid}
                  >
                    <CheckIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton onClick={handleCancelEdit}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Edit Information">
              <IconButton onClick={() => setEditing(true)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* avatar + name */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        alignItems="center"
        mb={4}
      >
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: "#263092",
            color: "white",
            fontSize: 40,
          }}
        >
          {avatarInitial}
        </Avatar>
        <Box>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            {displayName || "Unknown"}
            {userData.isAccountVerified && (
              <Chip
                label="Verified"
                color="success"
                size="small"
                icon={<VerifiedUserIcon />}
              />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userData.email}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* cards / fields */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 2,
        }}
      >
        {/* always-read cards or disabled inputs */}
        {alwaysFields.map(([label, value]) => (
          <Box key={label} sx={{ height: "100%" }}>
            {!editing ? (
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {label}
                  </Typography>
                  <Typography variant="body1">{value}</Typography>
                </CardContent>
              </Card>
            ) : (
              <TextField
                label={label}
                fullWidth
                value={value}
                disabled
                variant="standard"
                InputProps={{
                  sx: {
                    "& .Mui-disabled": {
                      color: "text.disabled",
                    },
                  },
                }}
              />
            )}
          </Box>
        ))}

        {/* Email */}
        <Box sx={{ height: "100%" }}>
          {!editing ? (
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ py: 1, px: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Email Address
                </Typography>
                <Typography variant="body1">{formData.email}</Typography>
              </CardContent>
            </Card>
          ) : (
            <TextField
              label="Email Address"
              fullWidth
              value={formData.email}
              onChange={(e) =>
                setFormData((f) => ({ ...f, email: e.target.value }))
              }
              error={!isEmailValid}
              helperText={
                !isEmailValid ? "Must be a valid @gmail.com address" : ""
              }
              variant="standard"
            />
          )}
        </Box>

        {/* Phone */}
        <Box sx={{ height: "100%" }}>
          {!editing ? (
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ py: 1, px: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Phone Number
                </Typography>
                <Typography variant="body1">{formData.phone}</Typography>
              </CardContent>
            </Card>
          ) : (
            <TextField
              label="Phone Number"
              fullWidth
              value={phoneDigits}
              onChange={(e) => {
                const only = e.target.value.replace(/\D/g, "").slice(0, 10);
                setFormData((f) => ({ ...f, phone: `+63${only}` }));
              }}
              error={!isPhoneValid}
              helperText={
                !isPhoneValid
                  ? "Must be 10 digits starting at 9"
                  : ""
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">+63</InputAdornment>
                ),
              }}
              variant="standard"
            />
          )}
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleCloseConfirm}>
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to change your email to{" "}
            <strong>{formData.email}</strong> and phone to{" "}
            <strong>{formData.phone}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained">
            Yes, Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
