import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Chip,
  IconButton,
  TextField,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Ensure Toastify styles are included

// Constants
const OUTPUT_PER_HOUR = 70; // m²/h

// Configuration data
const labourConfig = [
  { label: "Construction Foreman", persons: 1, rate: 170.29 },
  { label: "Skilled Laborer", persons: 4, rate: 123.12 },
  { label: "Unskilled Laborer", persons: 12, rate: 94.96 },
];
const equipmentConfig = [
  { label: "Transit Mixer (5 cu.m.)", units: 4, rate: 1461 },
  { label: "Concrete Vibrator", units: 2, rate: 57.17 },
  { label: "Batch Plant (30 cu.m.)", units: 1, rate: 1759.5 },
  { label: "Payloader (1.50 cu.m.)", units: 1, rate: 1733 },
  { label: "Screeder (5.5 hp)", units: 1, rate: 545 },
  { label: "Water Truck/Pump (16000 L)", units: 1, rate: 2450 },
  { label: "Concrete Saw (14' blade)", units: 1, rate: 32.64 },
  { label: "Bar Cutter", units: 1, rate: 105.47 },
];
const materialConfig = [
  { label: "Reinforcing Steel Bar", unit: "kg", perSqm: 0.43, unitCost: 70.2 },
  { label: "Curing Compound", unit: "L", perSqm: 0.29, unitCost: 70 },
  { label: "Asphalt Sealant", unit: "L", perSqm: 0.12, unitCost: 50 },
  { label: "Steel Forms (Rental)", unit: "m", perSqm: 0.46, unitCost: 50 },
  { label: "Sand", unit: "cu.m.", perSqm: 0.1265, unitCost: 615 },
  { label: "Gravel", unit: "cu.m.", perSqm: 0.23, unitCost: 1605 },
  { label: "Cement", unit: "bag", perSqm: 2.19, unitCost: 250 },
  { label: "Concrete Saw Blade", unit: "pc", perSqm: 0.00015, unitCost: 8000 },
  { label: "Pipe Sleeve", unit: "m", perSqm: 0.0071, unitCost: 383.33 },
  { label: "Grease/Tar", unit: "L", perSqm: 0.0087, unitCost: 300 },
];

export default function DupaBreakdown({
  reportId,
  measurement,
  classification,
  onMeasurementUpdated,
}) {
  const [localMeasurement, setLocalMeasurement] = useState(measurement);
  const [editing, setEditing] = useState(false);

  const area = parseFloat(localMeasurement) || 0;
  const batches = area / OUTPUT_PER_HOUR;
  const estTime = batches.toFixed(2);

  const saveMeasurement = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/update/${reportId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ measurement: localMeasurement }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onMeasurementUpdated(localMeasurement);
      setEditing(false);
      toast.success("Measurement updated successfully!"); // Success notification
    } catch (err) {
      console.error("Failed to save measurement:", err);
      toast.error("Could not save measurement. Please try again."); // Error notification
    }
  };

  const handleCancelEdit = () => {
    setLocalMeasurement(measurement); // Revert back to the original measurement
    setEditing(false);
    toast.info("Edit canceled, original measurement restored."); // Info notification for cancel
  };

  // Calculate labor costs
  const labourRows = labourConfig.map(({ label, persons, rate }) => {
    const hours = persons * batches;
    return {
      label,
      detail: `${persons}× ${hours.toFixed(2)} h`, // Round for display
      cost: hours * rate,
    };
  });
  const labourTotal = labourRows.reduce((sum, r) => sum + r.cost, 0);

  // Calculate equipment costs
  const equipmentRows = equipmentConfig.map(({ label, units, rate }) => {
    const hours = units * batches;
    return {
      label,
      detail: `${units}× ${hours.toFixed(2)} h`, // Round for display
      cost: hours * rate,
    };
  });
  const minorToolsCost = labourTotal * 0.05;
  const equipmentTotal =
    equipmentRows.reduce((sum, r) => sum + r.cost, 0) + minorToolsCost;

  // Calculate material costs
  const materialRows = materialConfig.map(
    ({ label, unit, perSqm, unitCost }) => {
      const qty = perSqm * area;
      return {
        label,
        detail: `${qty.toFixed(2)} ${unit}`, // Round for display
        cost: qty * unitCost,
      };
    }
  );
  const materialTotal = materialRows.reduce((sum, r) => sum + r.cost, 0);

  // Calculate VAT and grand total
  const vat = (labourTotal + equipmentTotal + materialTotal) * 0.05;
  const grandTotal = labourTotal + equipmentTotal + materialTotal + vat;

  // Crew chips for display
  const crewChips = labourConfig.map(({ label, persons }, i) => (
    <Chip
      key={i}
      label={`${persons} ${label}${persons > 1 ? "s" : ""}`}
      size="small"
      sx={{ mr: 1, mb: 1 }}
    />
  ));

  const sections = [
    { title: "Labour", rows: labourRows, subtotal: labourTotal },
    {
      title: "Equipment",
      rows: equipmentRows,
      extra: { label: "Minor Tools", cost: minorToolsCost },
      subtotal: equipmentTotal,
    },
    { title: "Materials", rows: materialRows, subtotal: materialTotal },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Card>
        <CardHeader
          title={classification}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 700 }}
          subheaderTypographyProps={{ variant: "caption", fontWeight: 500 }}
          subheader={
            editing ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Area (m²)"
                  size="small"
                  value={localMeasurement}
                  onChange={(e) => setLocalMeasurement(e.target.value)}
                />
                <IconButton size="small" onClick={saveMeasurement}>
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setLocalMeasurement(measurement);
                    setEditing(false);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>
                  {area.toFixed(2)} m² • {estTime} h est.
                </Typography>
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
            )
          }
        />
        <Divider />
        <CardContent sx={{ display: "flex", flexWrap: "wrap" }}>
          {crewChips}
        </CardContent>
      </Card>

      {sections.map(({ title, rows, extra, subtotal }) => (
        <Card key={title}>
          <CardHeader
            title={title}
            titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
          />
          <Divider />
          <CardContent>
            {rows.map((r, idx) => (
              <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                • {r.label}: {r.detail} → ₱{r.cost.toLocaleString()}
              </Typography>
            ))}
            {extra && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                • {extra.label}: ₱{extra.cost.toLocaleString()}
              </Typography>
            )}
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant="subtitle2">
              Subtotal: ₱{subtotal.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader
          title="Totals"
          titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
        />
        <Divider />
        <CardContent>
          <Typography variant="body2">
            VAT (5%): ₱{vat.toLocaleString()}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            Grand Total: ₱{grandTotal.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
