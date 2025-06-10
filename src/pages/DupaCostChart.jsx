import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormHelperText,
  useTheme,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Color psychology:
// Labor (human effort) → Orange (#FFA726)
// Equipment (trust, reliability) → Blue (#42A5F5)
// Materials (earth, stability) → Brown (#8D6E63)
const COLORS = {
  Labor: { stroke: "#FB8C00", fill: "#FFA726" },
  Equipment: { stroke: "#1E88E5", fill: "#42A5F5" },
  Materials: { stroke: "#6D4C41", fill: "#8D6E63" },
};

export default function DupaCostChart() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");
  const [error, setError] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const tickColor = isDark ? "#e0e0e0" : "#333";
  const gridColor = isDark ? "#444" : "#ccc";

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = [];
      if (startDate && endDate)
        params.push(`start=${startDate}`, `end=${endDate}`);
      const query = params.length ? `?${params.join("&")}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/analytics/dupa${query}`,
        { credentials: "include" }
      );
      const result = await res.json();
      if (result.success) {
        // Expected result.data = [{ label: '2025-06-01', laborCost: 1000, equipmentCost: 500, materialCost: 200 }, ...]
        setData(
          result.data.map((item) => ({
            rawDate: item.label,
            name: new Date(item.label).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            Labor: parseFloat(item.laborCost.toFixed(2)),
            Equipment: parseFloat(item.equipmentCost.toFixed(2)),
            Materials: parseFloat(item.materialCost.toFixed(2)),
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const open = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setError("");
    setDialogOpen(true);
  };
  const close = () => setDialogOpen(false);
  const apply = () => {
    if (!tempStart || !tempEnd) return setError("Please select both dates");
    if (new Date(tempEnd) < new Date(tempStart))
      return setError("‘To’ must be same or after ‘From’");
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setDialogOpen(false);
  };

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h6" fontWeight={600}>
            DUPA Cost Breakdown
          </Typography>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={open}
          >
            Filter
          </Button>
        </Stack>

        {loading ? (
          <CircularProgress />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
            >
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: tickColor }} />
              <YAxis tick={{ fill: tickColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#222" : "#fff",
                  border: "1px solid #888",
                }}
              />
              <Legend />

              <Area
                type="monotone"
                dataKey="Labor"
                stackId="1"
                stroke={COLORS.Labor.stroke}
                fill={COLORS.Labor.fill}
              />

              <Area
                type="monotone"
                dataKey="Equipment"
                stackId="1"
                stroke={COLORS.Equipment.stroke}
                fill={COLORS.Equipment.fill}
              />

              <Area
                type="monotone"
                dataKey="Materials"
                stackId="1"
                stroke={COLORS.Materials.stroke}
                fill={COLORS.Materials.fill}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>Filter by Date</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              type="date"
              label="From"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={tempStart}
              onChange={(e) => setTempStart(e.target.value)}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={tempEnd}
              onChange={(e) => setTempEnd(e.target.value)}
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={apply} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
