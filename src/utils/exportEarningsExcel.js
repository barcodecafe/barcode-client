// ---------------------------------------------------------------------------
// Rider Earnings & Financial Report Exporter for MS Excel / CSV
// ---------------------------------------------------------------------------
import {
  riderCommissionFor,
  cashCollectedFor,
  foodValueFor,
  orderSettlementDate,
  businessDateKey,
} from "./settlement";

/**
 * Filter orders based on a selected period and optional date ranges.
 */
export const filterOrdersByDateRange = (orders, period = "daily", fromDate = "", toDate = "") => {
  const todayKey = businessDateKey(new Date());
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (orders || []).filter((order) => {
    // Only evaluate delivered or completed orders for earnings
    const isDelivered = order.status === "Delivered" || !!order.deliveredAt;
    if (!isDelivered) return false;

    const orderDateStr = order.deliveredAt || order.createdAt;
    if (!orderDateStr) return false;
    const orderDate = new Date(orderDateStr);
    const orderKey = orderSettlementDate(order);

    if (period === "daily") {
      return orderKey === todayKey || orderDate >= startOfToday;
    }
    if (period === "weekly") {
      const weekAgo = new Date(startOfToday);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= weekAgo;
    }
    if (period === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return orderDate >= monthStart;
    }
    if (period === "yearly") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return orderDate >= yearStart;
    }
    if (period === "custom") {
      let matches = true;
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        matches = matches && orderDate >= start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matches = matches && orderDate <= end;
      }
      return matches;
    }
    return true;
  });
};

/**
 * Escape and format values for CSV string
 */
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Download CSV file in browser with UTF-8 BOM so Excel displays Bangla & symbols properly
 */
const triggerDownload = (csvContent, fileName) => {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export All Riders Earnings Summary Report to Excel / CSV
 */
export const exportAllRidersSummaryExcel = ({
  riders = [],
  orders = [],
  period = "daily",
  fromDate = "",
  toDate = "",
}) => {
  const filteredOrders = filterOrdersByDateRange(orders, period, fromDate, toDate);

  const periodLabelMap = {
    daily: "Today (Daily)",
    weekly: "Last 7 Days (Weekly)",
    monthly: "This Month (Monthly)",
    yearly: "This Year (Yearly)",
    custom: `Custom Range (${fromDate || "Start"} to ${toDate || "End"})`,
  };
  const periodLabel = periodLabelMap[period] || period;

  // CSV Header Metadata
  const rows = [
    ["BARCODE RESTAURANT - RIDERS EARNINGS & SETTLEMENT REPORT"],
    [`Report Period: ${periodLabel}`],
    [`Generated Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`],
    [`Total Active Fleet: ${riders.length} Riders`],
    [], // Blank line
    [
      "SL",
      "Rider Name",
      "Phone Number",
      "Vehicle",
      "Employment Type",
      "Commission Rate (%)",
      "Agency Name",
      "Delivered Orders",
      "Total Food Value (BDT)",
      "Total Delivery Fee (BDT)",
      "Total Invoice Bill (BDT)",
      "Cash Collected (COD) (BDT)",
      "Online Paid (BDT)",
      "Rider Earnings / Commission (BDT)",
      "Net Due to Restaurant (BDT)",
      "Settlement Status",
      "Current Duty Status",
    ],
  ];

  let grandTotalOrders = 0;
  let grandTotalFood = 0;
  let grandTotalDelivery = 0;
  let grandTotalInvoice = 0;
  let grandTotalCash = 0;
  let grandTotalOnline = 0;
  let grandTotalRiderEarnings = 0;
  let grandTotalNetDue = 0;

  riders.forEach((rider, index) => {
    const rId = String(rider.id || rider._id || "");
    const rOrders = filteredOrders.filter(
      (o) => String(o.riderId || o.rider?._id || o.rider?.id || "") === rId
    );

    const deliveredCount = rOrders.length;
    const totalFood = rOrders.reduce((sum, o) => sum + foodValueFor(o), 0);
    const totalDelivery = rOrders.reduce((sum, o) => sum + Number(o.deliveryCharge || 0), 0);
    const totalInvoice = rOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalCash = rOrders.reduce((sum, o) => sum + cashCollectedFor(o), 0);
    const totalOnline = rOrders.reduce(
      (sum, o) => sum + (o.paymentStatus === "Paid" ? Number(o.total || 0) : 0),
      0
    );
    const totalEarnings = rOrders.reduce((sum, o) => sum + riderCommissionFor(o), 0);
    const netDue = Math.max(0, totalCash - totalEarnings);

    const isFreelance = rider.employmentType === "freelance";
    const commissionRate = isFreelance ? `${rider.commissionRate ?? 15}%` : "0% (Salary)";
    const dutyStatus = rider.riderStatus === "Available" ? "Online" : "On Break / Busy";

    // Check if any order is unsettled
    const hasUnsettled = rOrders.some((o) => !o.settled && !o.isSettled && cashCollectedFor(o) > 0);
    const settlementStatus = deliveredCount === 0 ? "No Deliveries" : hasUnsettled ? "Pending Settlement" : "Settled";

    grandTotalOrders += deliveredCount;
    grandTotalFood += totalFood;
    grandTotalDelivery += totalDelivery;
    grandTotalInvoice += totalInvoice;
    grandTotalCash += totalCash;
    grandTotalOnline += totalOnline;
    grandTotalRiderEarnings += totalEarnings;
    grandTotalNetDue += netDue;

    rows.push([
      index + 1,
      rider.name || "N/A",
      rider.phone || "N/A",
      rider.vehicle || "Motorbike",
      isFreelance ? "Freelance / Agency" : "Permanent (In-House)",
      commissionRate,
      rider.agencyName || "N/A",
      deliveredCount,
      totalFood.toFixed(2),
      totalDelivery.toFixed(2),
      totalInvoice.toFixed(2),
      totalCash.toFixed(2),
      totalOnline.toFixed(2),
      totalEarnings.toFixed(2),
      netDue.toFixed(2),
      settlementStatus,
      dutyStatus,
    ]);
  });

  // Summary / Grand Total Row
  rows.push([]);
  rows.push([
    "TOTAL",
    "GRAND TOTAL FLEET",
    "-",
    "-",
    "-",
    "-",
    "-",
    grandTotalOrders,
    grandTotalFood.toFixed(2),
    grandTotalDelivery.toFixed(2),
    grandTotalInvoice.toFixed(2),
    grandTotalCash.toFixed(2),
    grandTotalOnline.toFixed(2),
    grandTotalRiderEarnings.toFixed(2),
    grandTotalNetDue.toFixed(2),
    "-",
    "-",
  ]);

  const csvString = rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
  const fileName = `Riders_Fleet_Earnings_Summary_${period}_${businessDateKey(new Date())}.csv`;
  triggerDownload(csvString, fileName);
};

/**
 * Export Single Rider Detailed Itemized Deliveries Report to Excel / CSV
 */
export const exportSingleRiderDetailedExcel = ({
  rider,
  orders = [],
  period = "daily",
  fromDate = "",
  toDate = "",
}) => {
  if (!rider) return;
  const rId = String(rider.id || rider._id || "");
  const filteredOrders = filterOrdersByDateRange(orders, period, fromDate, toDate).filter(
    (o) => String(o.riderId || o.rider?._id || o.rider?.id || "") === rId
  );

  const periodLabelMap = {
    daily: "Today (Daily)",
    weekly: "Last 7 Days (Weekly)",
    monthly: "This Month (Monthly)",
    yearly: "This Year (Yearly)",
    custom: `Custom Range (${fromDate || "Start"} to ${toDate || "End"})`,
  };
  const periodLabel = periodLabelMap[period] || period;

  const isFreelance = rider.employmentType === "freelance";
  const commissionRate = isFreelance ? `${rider.commissionRate ?? 15}%` : "0% (Monthly Salary)";

  const rows = [
    [`BARCODE RESTAURANT - INDIVIDUAL RIDER EARNINGS & TRIP REPORT`],
    [`Rider Name: ${rider.name}`, `Phone: ${rider.phone}`],
    [`Employment Model: ${isFreelance ? "Freelance / Agency" : "Permanent In-House"}`, `Rate: ${commissionRate}`],
    [`Report Period: ${periodLabel}`],
    [`Generated Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`],
    [],
    [
      "SL",
      "Order ID / Invoice #",
      "Date & Time",
      "Customer Name",
      "Customer Phone",
      "Delivery Address & Area",
      "Payment Mode",
      "Payment Status",
      "Food Value (BDT)",
      "Delivery Charge (BDT)",
      "Invoice Total (BDT)",
      "Cash Collected (BDT)",
      "Rider Earnings / Commission (BDT)",
      "Net Due to Admin (BDT)",
      "Delivery Status",
      "Settlement Status",
    ],
  ];

  let totalFood = 0;
  let totalDelivery = 0;
  let totalInvoice = 0;
  let totalCash = 0;
  let totalEarnings = 0;
  let totalNetDue = 0;

  filteredOrders.forEach((ord, index) => {
    const fVal = foodValueFor(ord);
    const dCharge = Number(ord.deliveryCharge || 0);
    const invTotal = Number(ord.total || 0);
    const cash = cashCollectedFor(ord);
    const earn = riderCommissionFor(ord);
    const net = Math.max(0, cash - earn);

    totalFood += fVal;
    totalDelivery += dCharge;
    totalInvoice += invTotal;
    totalCash += cash;
    totalEarnings += earn;
    totalNetDue += net;

    const shortId = `#${String(ord._id || ord.id || "").slice(-6).toUpperCase()}`;
    const orderDateFormatted = new Date(ord.deliveredAt || ord.createdAt).toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isSettled = !!(ord.settled || ord.isSettled);

    rows.push([
      index + 1,
      shortId,
      orderDateFormatted,
      ord.user?.name || ord.customerName || "Customer",
      ord.deliveryPhone || ord.user?.phone || "N/A",
      `${ord.deliveryAddress || ""}${ord.deliveryArea ? ` (${ord.deliveryArea})` : ""}`,
      ord.paymentMethod || (ord.paymentStatus === "Paid" ? "Online / Gateway" : "Cash on Delivery"),
      ord.paymentStatus || "Pending",
      fVal.toFixed(2),
      dCharge.toFixed(2),
      invTotal.toFixed(2),
      cash.toFixed(2),
      earn.toFixed(2),
      net.toFixed(2),
      ord.status || "Delivered",
      isSettled ? "Settled" : "Pending Handover",
    ]);
  });

  rows.push([]);
  rows.push([
    "TOTAL",
    `Total Deliveries: ${filteredOrders.length}`,
    "-",
    "-",
    "-",
    "-",
    "-",
    "-",
    totalFood.toFixed(2),
    totalDelivery.toFixed(2),
    totalInvoice.toFixed(2),
    totalCash.toFixed(2),
    totalEarnings.toFixed(2),
    totalNetDue.toFixed(2),
    "-",
    "-",
  ]);

  const safeRiderName = (rider.name || "Rider").replace(/[^a-zA-Z0-9]/g, "_");
  const csvString = rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
  const fileName = `Rider_Earnings_${safeRiderName}_${period}_${businessDateKey(new Date())}.csv`;
  triggerDownload(csvString, fileName);
};
