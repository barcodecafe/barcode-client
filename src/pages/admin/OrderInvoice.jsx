import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, RefreshCw } from 'lucide-react';
import { recheckPayment } from '../services/paymentsService';
import toast from 'react-hot-toast';

const getOfferText = (offerType) => {
  if (offerType === "bogo_1g1") return "BUY 1 GET 1 FREE";
  if (offerType === "bogo_1g2") return "BUY 1 GET 2 FREE";
  if (offerType === "combo") return "SPECIAL COMBO DEAL";
  return null;
};

const getItemPayableTotal = (item) => {
  const name = String(item.name || "").toLowerCase();
  const price = Number(item.price) || 0;
  const qty = Number(item.quantity) || 0;

  let oType = item.offerType;
  if (!oType && name.includes("fuchka platter") && qty >= 3) oType = "bogo_1g2";

  if (oType === "bogo_1g1") return price * Math.ceil(qty / 2);
  if (oType === "bogo_1g2") return price * Math.ceil(qty / 3);
  return price * qty;
};

export const OrderInvoice = ({ selectedOrderDetails, onClose, onOrderUpdated }) => {
  const invoiceRef = useRef(null);
  const [adjustments, setAdjustments] = useState({});
  const [recheckingOrderId, setRecheckingOrderId] = useState(null);

  if (!selectedOrderDetails) return null;

  const currentOrderId = selectedOrderDetails.id || selectedOrderDetails._id;
  const currentAdjustment = parseFloat(adjustments[currentOrderId]) || 0;
  const orderItems = selectedOrderDetails.items || selectedOrderDetails.cart || [];

  const subTotal = orderItems.reduce((sum, item) => sum + getItemPayableTotal(item), 0);
  const deliveryCharge = selectedOrderDetails.deliveryCharge || 0;
  const grandTotal = subTotal + deliveryCharge + currentAdjustment;

  const handlePrint = (e) => {
    if (e) e.preventDefault();
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const WindowPrt = window.open("", "_blank", "left=0,top=0,width=800,height=900");
    if (!WindowPrt) {
      toast.error("Please allow popups for this website to print.");
      return;
    }
    WindowPrt.document.write("<html><head><title>Barcode Invoice</title>");
    WindowPrt.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    WindowPrt.document.write("<style>body { font-family: Arial, sans-serif; background: #fff; color: #111; }</style>");
    WindowPrt.document.write('</head><body class="p-8">');
    WindowPrt.document.write(printContent.innerHTML);
    WindowPrt.document.write("</body></html>");
    WindowPrt.document.close();
    WindowPrt.focus();
    setTimeout(() => {
      WindowPrt.print();
      WindowPrt.close();
    }, 500);
  };

  const handleRecheck = async (orderId) => {
    try {
      setRecheckingOrderId(orderId);
      const result = await recheckPayment(orderId);
      toast.success(result?.reason || result?.message || "Re-check complete.");
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error("Re-check failed: " + (err.response?.data?.message || err.message));
    } finally {
      setRecheckingOrderId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6"
      >
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 print:hidden">
          <div>
            <h2 className="text-lg font-extrabold text-neutral-800 dark:text-neutral-100">Official Invoice Preview</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Order ID: #{currentOrderId?.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 text-xs font-bold transition-all shadow-xs cursor-pointer">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors ml-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🧾 অফিশিয়াল ইনভয়েস প্রিন্ট লেআউট */}
        <div ref={invoiceRef} className="bg-white text-neutral-800 p-6 space-y-6 text-xs font-sans">
          {/* ১. হেডার সেশন */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-neutral-800 gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-rose-900 uppercase">BARCODE</h1>
              <h2 className="text-sm font-bold tracking-widest text-neutral-800 uppercase">RESTAURANT GROUP</h2>
              <p className="text-[9px] text-neutral-500 tracking-wider mt-0.5">concern of N. MOHAMMAD GROUP</p>
            </div>
            <div className="text-left sm:text-right border-l-2 sm:border-l-2 border-neutral-300 pl-3 sm:pl-4">
              <p className="font-bold text-[11px] text-neutral-800">Head Office: N. Mohammad Engineering Industries Ltd.</p>
              <p className="text-[10px] text-neutral-600">222/250, Paschim Sholasahar, C.D.A Avenue, Muradpur, Chittagong.</p>
              <p className="text-[10px] text-neutral-600">Phone: +88 031 6553558</p>
            </div>
          </div>

          {/* ইনভয়েস টাইটেল */}
          <div className="text-center font-bold text-sm tracking-widest uppercase text-neutral-700 py-1">Invoice</div>

          {/* ২. বিল টু ও ইনভয়েস ইনফো */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div className="space-y-1.5 flex-1">
              <p className="font-bold text-neutral-900 uppercase text-[11px] border-b pb-1 mb-2">Bill To:</p>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-neutral-500 font-medium">Customer Name</span>
                <span className="col-span-2 font-bold text-neutral-800">: {selectedOrderDetails.user?.name || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-neutral-500 font-medium">Mobile</span>
                <span className="col-span-2 font-semibold text-neutral-800">: {selectedOrderDetails.user?.phone || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-neutral-500 font-medium">Address</span>
                <span className="col-span-2 text-neutral-800">: {selectedOrderDetails.user?.address || "N/A"} {selectedOrderDetails.user?.pickArea ? `(${selectedOrderDetails.user?.pickArea})` : ""}</span>
              </div>
            </div>

            <div className="space-y-1.5 w-full sm:w-72">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-neutral-500 font-medium">Invoice Date</span>
                <span className="font-semibold text-neutral-800">: {new Date(selectedOrderDetails.createdAt || Date.now()).toISOString().split("T")[0]}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-neutral-500 font-medium">Invoice #</span>
                <span className="font-bold text-neutral-800 uppercase">: IN-{currentOrderId?.slice(-10)}</span>
              </div>
            </div>
          </div>

          {/* ৩. লজিক্যাল আইটেম টেবিল */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700 uppercase text-[10px] border-b border-neutral-300">
                  <th className="p-2.5 border-r border-neutral-300">Custom Item</th>
                  <th className="p-2.5 border-r border-neutral-300">Description</th>
                  <th className="p-2.5 border-r border-neutral-300 text-right">Unit Price</th>
                  <th className="p-2.5 border-r border-neutral-300 text-center">Quantity</th>
                  <th className="p-2.5 border-r border-neutral-300 text-right">Discount / Free</th>
                  <th className="p-2.5 border-r border-neutral-300 text-right">TAX</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => {
                  const itemName = String(item.name || "").toLowerCase();
                  const qty = Number(item.quantity) || 1;
                  const unitPrice = Number(item.price) || 0;

                  let detectedOfferType = item.offerType;
                  let origUnitPrice = Number(item.originalPrice) || unitPrice;

                  if (!detectedOfferType && itemName.includes("fuchka platter") && qty >= 3) {
                    detectedOfferType = "bogo_1g2";
                    origUnitPrice = 340;
                  } else if (!detectedOfferType && itemName.includes("borhani") && unitPrice === 76) {
                    origUnitPrice = 80;
                  }

                  const offerLabel = getOfferText(detectedOfferType);
                  const fullGross = origUnitPrice * qty;

                  let netPayable = unitPrice * qty;
                  if (detectedOfferType === "bogo_1g1") {
                    netPayable = unitPrice * Math.ceil(qty / 2);
                  } else if (detectedOfferType === "bogo_1g2") {
                    netPayable = unitPrice * Math.ceil(qty / 3);
                  }

                  const freeDiscount = Math.max(0, fullGross - netPayable);

                  return (
                    <tr key={idx} className="border-b border-neutral-200">
                      <td className="p-2.5 border-r border-neutral-300 font-bold">
                        {item.name} {item.selectedSize ? `(${item.selectedSize})` : ""}
                      </td>
                      <td className="p-2.5 border-r border-neutral-300 font-semibold text-purple-700">
                        {offerLabel || (origUnitPrice > unitPrice ? "REGULAR DISCOUNT" : "-")}
                      </td>
                      <td className="p-2.5 border-r border-neutral-300 text-right">৳{origUnitPrice.toFixed(2)}</td>
                      <td className="p-2.5 border-r border-neutral-300 text-center font-bold">{qty}</td>
                      <td className="p-2.5 border-r border-neutral-300 text-right font-extrabold text-emerald-600">
                        {freeDiscount > 0 ? `-৳${freeDiscount.toFixed(2)}` : "0.00"}
                      </td>
                      <td className="p-2.5 border-r border-neutral-300 text-right">0.00</td>
                      <td className="p-2.5 text-right font-extrabold text-neutral-900">৳{netPayable.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ৪. হিসাব-নিকাশ সেকশন */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Total SD:</span>
                <span className="font-medium">0.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Total Tax:</span>
                <span className="font-medium">0.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200 font-extrabold text-neutral-900">
                <span>Sub Total (Including Tax):</span>
                <span>৳{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Service Charge:</span>
                <span className="font-medium">0.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Shipping Charge:</span>
                <span className="font-medium">৳{deliveryCharge.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Adjustment:</span>
                <input
                  type="number"
                  value={adjustments[currentOrderId] !== undefined ? adjustments[currentOrderId] : ""}
                  onChange={(e) => {
                    setAdjustments({ ...adjustments, [currentOrderId]: e.target.value });
                  }}
                  placeholder="0.00"
                  className="w-24 px-2 py-0.5 text-right border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 print:border-none print:bg-transparent"
                />
              </div>

              <div className="flex justify-between py-1.5 border-b-2 border-neutral-800 font-black text-sm text-neutral-900">
                <span>Total:</span>
                <span>৳{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Advance Amount:</span>
                <span className="font-medium">0.00</span>
              </div>
              <div className="flex justify-between py-1.5 font-black text-neutral-900">
                <span>Remaining Amount:</span>
                <span>৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-neutral-600 font-medium">
            Amount in Words (BDT): <span className="italic font-semibold text-neutral-800 uppercase">BDT {grandTotal.toFixed(0)} Taka Only</span>
          </div>

          {/* ৫. ফুটার ব্র্যান্ড লিস্ট */}
          <div className="pt-8 mt-6 border-t border-neutral-200 text-center space-y-3">
            <p className="text-[10px] text-neutral-400 italic">This is a system-generated document and does not require any signature.</p>
            <div className="flex flex-wrap justify-center items-center gap-2 opacity-75 pt-1 text-[9px] font-bold uppercase tracking-wider">
              <span className="px-2 py-1 bg-neutral-100 rounded">Barcode Café</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Burgwich Fusion</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Premium Kabab</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Mezzan Haile Ayun</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Outdoor Catering</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Bakery & Pastry</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Paner Botta</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Premium Burgers</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Food Junction</span>
              <span className="px-2 py-1 bg-neutral-100 rounded">Goram Cha</span>
            </div>
          </div>
        </div>

        {/* Gateway Re-check option */}
        {String(selectedOrderDetails.paymentMethod || "cod").toLowerCase() !== "cod" &&
          selectedOrderDetails.paymentStatus !== "Paid" &&
          selectedOrderDetails.status !== "Rejected" && (
            <div className="pt-2 print:hidden">
              <button
                type="button"
                onClick={() => handleRecheck(currentOrderId)}
                disabled={recheckingOrderId === currentOrderId}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-[10px] uppercase tracking-wide hover:bg-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${recheckingOrderId === currentOrderId ? "animate-spin" : ""}`} />
                {recheckingOrderId === currentOrderId ? "Checking with gateway…" : "Re-check payment with gateway"}
              </button>
            </div>
          )}
      </motion.div>
    </div>
  );
};