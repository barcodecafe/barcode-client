// ---------------------------------------------------------------------------
// Total Sales & Financial Revenue Exporter for MS Excel / CSV
// ---------------------------------------------------------------------------
import { businessDateKey, formatDateKey } from "./settlement";

/**
 * Filter orders based on period, custom date range, and order status.
 */
export const filterSalesOrders = (
  orders = [],
  period = "daily",
  fromDate = "",
  toDate = "",
  statusFilter = "delivered_only" // 'delivered_only' | 'all_active_completed' | 'all'
) => {
  const todayKey = businessDateKey(new Date());
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (orders || []).filter((order) => {
    if (!order) return false;

    // 1. Status Filter
    const currentStatus = String(order.status || "").trim();
    const isAwaiting = currentStatus.toLowerCase() === "awaiting payment" || currentStatus.toLowerCase() === "awaiting_payment";
    if (isAwaiting) return false; // Ignore unpaid gateway attempts

    const isDelivered = currentStatus === "Delivered" || !!order.deliveredAt;
    const isRejected = currentStatus === "Rejected";

    if (statusFilter === "delivered_only" && !isDelivered) return false;
    if (statusFilter === "all_active_completed" && isRejected) return false;

    // 2. Date Filter
    const dateStr = order.deliveredAt || order.createdAt;
    if (!dateStr) return false;
    const orderDate = new Date(dateStr);
    const orderKey = businessDateKey(orderDate);

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
    if (period === "all") {
      return true;
    }

    return true;
  });
};

/**
 * Escape and wrap values for CSV
 */
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Trigger download in browser with UTF-8 BOM
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

const getPeriodLabel = (period, fromDate, toDate) => {
  const periodLabelMap = {
    daily: "Today (Daily)",
    weekly: "Last 7 Days (Weekly)",
    monthly: "This Month (Monthly)",
    yearly: "This Year (Yearly)",
    custom: `Custom Range (${fromDate || "Start"} to ${toDate || "End"})`,
    all: "All-Time Lifetime Sales",
  };
  return periodLabelMap[period] || period;
};

/**
 * 1. Export Itemized Order-by-Order Detailed Sales Excel
 */
export const exportItemizedSalesExcel = ({
  orders = [],
  period = "daily",
  fromDate = "",
  toDate = "",
  statusFilter = "delivered_only",
}) => {
  const filtered = filterSalesOrders(orders, period, fromDate, toDate, statusFilter);
  const periodLabel = getPeriodLabel(period, fromDate, toDate);

  const rows = [
    ["BARCODE RESTAURANT - ITEMIZED SALES & ORDER REPORT"],
    [`Report Period: ${periodLabel}`],
    [`Status Scope: ${statusFilter === "delivered_only" ? "Delivered Only (Realized Sales)" : "All Orders"}`],
    [`Generated Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`],
    [`Total Matching Orders: ${filtered.length}`],
    [],
    [
      "SL",
      "Order ID / Invoice #",
      "Date & Time",
      "Customer Name",
      "Customer Phone",
      "Delivery Area & Address",
      "Ordered Items (Qty x Price)",
      "Total Items Qty",
      "Food Subtotal (BDT)",
      "Discount / Promo (BDT)",
      "Points Redeemed (BDT)",
      "Delivery Fee (BDT)",
      "Grand Total Invoice (BDT)",
      "Payment Mode",
      "Payment Status",
      "Order Status",
      "Assigned Rider",
    ],
  ];

  let totalItemsCount = 0;
  let totalSubtotal = 0;
  let totalDiscount = 0;
  let totalPoints = 0;
  let totalDelivery = 0;
  let grandTotalSales = 0;

  filtered.forEach((ord, index) => {
    const shortId = `#${String(ord._id || ord.id || ord.orderId || "").slice(-6).toUpperCase()}`;
    const orderDateFormatted = new Date(ord.deliveredAt || ord.createdAt).toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const items = Array.isArray(ord.items) ? ord.items : Array.isArray(ord.cart) ? ord.cart : [];
    const itemsSummary = items
      .map((item) => `${item.name || "Item"} (x${item.quantity || 1})`)
      .join("; ");
    const itemsQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    const subtotal = Number(ord.subtotal) || Math.max(0, (Number(ord.total) || 0) - (Number(ord.deliveryCharge) || 0));
    const discount = Number(ord.couponDiscount || ord.discountAmount || ord.discount || 0);
    const points = Number(ord.pointsRedeemed || 0);
    const delivery = Number(ord.deliveryCharge || 0);
    const total = Number(ord.total || 0);

    totalItemsCount += itemsQty;
    totalSubtotal += subtotal;
    totalDiscount += discount;
    totalPoints += points;
    totalDelivery += delivery;
    grandTotalSales += total;

    const paymentMode =
      ord.paymentMethod || (ord.paymentStatus === "Paid" ? "Online Gateway" : "Cash on Delivery");

    rows.push([
      index + 1,
      shortId,
      orderDateFormatted,
      ord.user?.name || ord.customerName || "Customer",
      ord.deliveryPhone || ord.user?.phone || ord.customerPhone || "N/A",
      `${ord.deliveryAddress || ""}${ord.deliveryArea ? ` (${ord.deliveryArea})` : ""}`,
      itemsSummary || "Dishes",
      itemsQty,
      subtotal.toFixed(2),
      discount.toFixed(2),
      points.toFixed(2),
      delivery.toFixed(2),
      total.toFixed(2),
      paymentMode,
      ord.paymentStatus || "Pending",
      ord.status || "Delivered",
      ord.riderName || ord.rider?.name || "Unassigned",
    ]);
  });

  rows.push([]);
  rows.push([
    "TOTAL",
    `Total Orders: ${filtered.length}`,
    "-",
    "-",
    "-",
    "-",
    "-",
    totalItemsCount,
    totalSubtotal.toFixed(2),
    totalDiscount.toFixed(2),
    totalPoints.toFixed(2),
    totalDelivery.toFixed(2),
    grandTotalSales.toFixed(2),
    "-",
    "-",
    "-",
    "-",
  ]);

  const csvString = rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
  const fileName = `Barcode_Sales_Itemized_${period}_${businessDateKey(new Date())}.csv`;
  triggerDownload(csvString, fileName);
};

/**
 * 2. Export Periodic Day-by-Day or Month-by-Month Sales Summary Excel
 */
export const exportPeriodicDailySummaryExcel = ({
  orders = [],
  period = "daily",
  fromDate = "",
  toDate = "",
  statusFilter = "delivered_only",
}) => {
  const filtered = filterSalesOrders(orders, period, fromDate, toDate, statusFilter);
  const periodLabel = getPeriodLabel(period, fromDate, toDate);

  // Group by Date Key (YYYY-MM-DD)
  const byDayMap = new Map();

  filtered.forEach((ord) => {
    const dKey = businessDateKey(ord.deliveredAt || ord.createdAt);
    if (!dKey) return;

    if (!byDayMap.has(dKey)) {
      byDayMap.set(dKey, {
        dateKey: dKey,
        orderCount: 0,
        foodValue: 0,
        deliveryFees: 0,
        discounts: 0,
        totalSales: 0,
        codSales: 0,
        onlineSales: 0,
      });
    }

    const current = byDayMap.get(dKey);
    const subtotal = Number(ord.subtotal) || Math.max(0, (Number(ord.total) || 0) - (Number(ord.deliveryCharge) || 0));
    const delivery = Number(ord.deliveryCharge || 0);
    const discount = Number(ord.couponDiscount || ord.discountAmount || ord.discount || 0);
    const total = Number(ord.total || 0);
    const isPaidOnline = ord.paymentStatus === "Paid" || ord.paymentMethod?.toLowerCase().includes("online");

    current.orderCount += 1;
    current.foodValue += subtotal;
    current.deliveryFees += delivery;
    current.discounts += discount;
    current.totalSales += total;
    if (isPaidOnline) {
      current.onlineSales += total;
    } else {
      current.codSales += total;
    }
  });

  const sortedDays = Array.from(byDayMap.values()).sort((a, b) => (a.dateKey > b.dateKey ? -1 : 1));

  const rows = [
    ["BARCODE RESTAURANT - PERIODIC SALES SUMMARY REPORT"],
    [`Report Period: ${periodLabel}`],
    [`Status Scope: ${statusFilter === "delivered_only" ? "Delivered Only (Realized Sales)" : "All Orders"}`],
    [`Generated Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`],
    [],
    [
      "SL",
      "Date",
      "Date Display",
      "Total Orders",
      "Food Value (BDT)",
      "Discounts Given (BDT)",
      "Delivery Revenue (BDT)",
      "Gross Sales Revenue (BDT)",
      "Cash on Delivery Sales (BDT)",
      "Online Gateway Sales (BDT)",
      "Average Order Value (AOV) (BDT)",
    ],
  ];

  let sumOrders = 0;
  let sumFood = 0;
  let sumDiscounts = 0;
  let sumDelivery = 0;
  let sumTotalSales = 0;
  let sumCod = 0;
  let sumOnline = 0;

  sortedDays.forEach((day, index) => {
    const aov = day.orderCount > 0 ? day.totalSales / day.orderCount : 0;
    sumOrders += day.orderCount;
    sumFood += day.foodValue;
    sumDiscounts += day.discounts;
    sumDelivery += day.deliveryFees;
    sumTotalSales += day.totalSales;
    sumCod += day.codSales;
    sumOnline += day.onlineSales;

    rows.push([
      index + 1,
      day.dateKey,
      formatDateKey(day.dateKey),
      day.orderCount,
      day.foodValue.toFixed(2),
      day.discounts.toFixed(2),
      day.deliveryFees.toFixed(2),
      day.totalSales.toFixed(2),
      day.codSales.toFixed(2),
      day.onlineSales.toFixed(2),
      aov.toFixed(2),
    ]);
  });

  const grandAov = sumOrders > 0 ? sumTotalSales / sumOrders : 0;

  rows.push([]);
  rows.push([
    "TOTAL",
    "GRAND TOTAL",
    "-",
    sumOrders,
    sumFood.toFixed(2),
    sumDiscounts.toFixed(2),
    sumDelivery.toFixed(2),
    sumTotalSales.toFixed(2),
    sumCod.toFixed(2),
    sumOnline.toFixed(2),
    grandAov.toFixed(2),
  ]);

  const csvString = rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
  const fileName = `Barcode_Sales_Periodic_Summary_${period}_${businessDateKey(new Date())}.csv`;
  triggerDownload(csvString, fileName);
};

/**
 * 3. Export Dish & Category Performance Sales Excel
 */
export const exportCategoryDishSalesExcel = ({
  orders = [],
  period = "daily",
  fromDate = "",
  toDate = "",
  statusFilter = "delivered_only",
}) => {
  const filtered = filterSalesOrders(orders, period, fromDate, toDate, statusFilter);
  const periodLabel = getPeriodLabel(period, fromDate, toDate);

  const dishMap = new Map();
  let totalRevenue = 0;
  let totalUnits = 0;

  filtered.forEach((ord) => {
    const items = Array.isArray(ord.items) ? ord.items : Array.isArray(ord.cart) ? ord.cart : [];
    items.forEach((item) => {
      const name = item.name || "Unknown Item";
      const category = item.category || "General";
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const itemTotal = price * qty;

      if (!dishMap.has(name)) {
        dishMap.set(name, {
          name,
          category,
          unitPrice: price,
          unitsSold: 0,
          revenue: 0,
        });
      }

      const entry = dishMap.get(name);
      entry.unitsSold += qty;
      entry.revenue += itemTotal;
      totalUnits += qty;
      totalRevenue += itemTotal;
    });
  });

  const sortedDishes = Array.from(dishMap.values()).sort((a, b) => b.revenue - a.revenue);

  const rows = [
    ["BARCODE RESTAURANT - DISH & CATEGORY SALES PERFORMANCE REPORT"],
    [`Report Period: ${periodLabel}`],
    [`Status Scope: ${statusFilter === "delivered_only" ? "Delivered Only (Realized Sales)" : "All Orders"}`],
    [`Generated Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`],
    [],
    [
      "SL",
      "Dish / Item Name",
      "Category",
      "Unit Price (BDT)",
      "Total Units Sold",
      "Total Revenue Generated (BDT)",
      "% Share of Total Food Revenue",
    ],
  ];

  sortedDishes.forEach((dish, index) => {
    const sharePct = totalRevenue > 0 ? ((dish.revenue / totalRevenue) * 100).toFixed(1) + "%" : "0%";
    rows.push([
      index + 1,
      dish.name,
      dish.category,
      dish.unitPrice.toFixed(2),
      dish.unitsSold,
      dish.revenue.toFixed(2),
      sharePct,
    ]);
  });

  rows.push([]);
  rows.push([
    "TOTAL",
    `Unique Dishes Sold: ${sortedDishes.length}`,
    "-",
    "-",
    totalUnits,
    totalRevenue.toFixed(2),
    "100%",
  ]);

  const csvString = rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
  const fileName = `Barcode_Dish_Sales_Performance_${period}_${businessDateKey(new Date())}.csv`;
  triggerDownload(csvString, fileName);
};
