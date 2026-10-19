/* AZOM STORE order list. Set API_BASE to your deployed Python API URL. */
const WHATSAPP_NUMBER = "8801300435611"; // country code, no + and no leading 0
const API_BASE = ""; // Example: "https://your-api.onrender.com"
const LOCAL_STORAGE_KEY = "azom_store_customer_orders_v1";
const $ = (id) => document.getElementById(id);
let allOrders = [];

function money(value) {
  return "৳" + (Number(value) || 0).toLocaleString("en-BD");
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}
function localOrders() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (_) { return []; }
}
function normalizeOrder(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    ...o,
    orderId: o.orderId || o.order_id || "AZ-ORDER",
    date: o.date || o.created_at || "",
    customerName: o.customerName || o.customer_name || "",
    customerPhone: o.customerPhone || o.customer_phone || "",
    address: o.address || "",
    paymentMethod: o.paymentMethod || o.payment_method || "",
    paymentSender: o.paymentSender || o.payment_sender || "",
    paymentTrx: o.paymentTrx || o.payment_trx || "",
    subtotal: Number(o.subtotal ?? 0),
    delivery: Number(o.delivery ?? 0),
    total: Number(o.total ?? 0),
    items: items.map(x => ({...x, name:x.name || x.product_name || "পণ্য", qty:Number(x.qty ?? x.quantity ?? 1), price:Number(x.price ?? 0)}))
  };
}
async function loadOrders() {
  $("notice").classList.remove("error");
  $("notice").textContent = "অর্ডার লোড হচ্ছে…";
  const source = $("source").value;
  try {
    if (source === "server") {
      if (!API_BASE) {
        allOrders = localOrders().map(normalizeOrder);
        $("notice").textContent = "Python API URL সেট করা হয়নি। আপাতত এই ডিভাইসের অর্ডার দেখানো হচ্ছে। সব ক্রেতার অর্ডার পেতে orders.js ফাইলে API_BASE-এ আপনার deployed API URL বসান।";
      } else {
        const response = await fetch(`${API_BASE.replace(/\/$/,"")}/api/orders`, {cache:"no-store"});
        if (!response.ok) throw new Error(`API status ${response.status}`);
        const data = await response.json();
        allOrders = (Array.isArray(data) ? data : data.orders || []).map(normalizeOrder);
        $("notice").textContent = "সার্ভার থেকে অর্ডার লোড হয়েছে।";
      }
    } else {
      allOrders = localOrders().map(normalizeOrder);
      $("notice").textContent = "এই ডিভাইসের ব্রাউজারে সংরক্ষিত অর্ডার দেখানো হচ্ছে।";
    }
    render();
  } catch (err) {
    allOrders = localOrders().map(normalizeOrder);
    $("notice").classList.add("error");
    $("notice").textContent = "সার্ভারের অর্ডার লোড হয়নি। API URL, সার্ভার এবং CORS সেটিং পরীক্ষা করুন। এই ডিভাইসের অর্ডার দেখানো হচ্ছে।";
    render();
  }
}
function filteredOrders() {
  const q = $("search").value.trim().toLowerCase();
  return allOrders.filter(o => !q || [o.orderId,o.customerName,o.customerPhone,o.address].join(" ").toLowerCase().includes(q));
}
function render() {
  const orders = filteredOrders();
  $("totalOrders").textContent = allOrders.length.toLocaleString("en-BD");
  $("shownOrders").textContent = orders.length.toLocaleString("en-BD");
  $("totalSales").textContent = money(allOrders.reduce((s,o)=>s+Number(o.total||0),0));
  $("orders").innerHTML = orders.length ? orders.map(o => `
    <article class="order-card">
      <div class="order-top"><div><div class="order-id">${esc(o.orderId)}</div><div class="order-date">${esc(o.date)}</div></div><div class="order-total">${money(o.total)}</div></div>
      <div class="customer">
        <div><span>ক্রেতা:</span> <b>${esc(o.customerName)}</b></div>
        <div><span>মোবাইল:</span> <b>${esc(o.customerPhone)}</b></div>
        <div><span>ঠিকানা:</span> ${esc(o.address)}</div>
        <div><span>পেমেন্ট:</span> ${esc(o.paymentMethod)} · ${esc(o.paymentSender)}</div>
        <div><span>TrxID:</span> ${esc(o.paymentTrx)}</div>
      </div>
      <div class="items">${o.items.map((x,i)=>`<div class="item-row"><span>${i+1}. ${esc(x.name)} × ${x.qty}</span><strong>${money(x.price*x.qty)}</strong></div>`).join("") || '<div class="item-row">পণ্যের তথ্য নেই</div>'}
      <div class="item-row"><span>পণ্যের মূল্য</span><strong>${money(o.subtotal)}</strong></div><div class="item-row"><span>ডেলিভারি</span><strong>${money(o.delivery)}</strong></div></div>
      <div class="order-bottom"><span class="badge">অর্ডার সংরক্ষিত</span><button class="btn btn-whatsapp" type="button" data-order="${esc(o.orderId)}">এই অর্ডার WhatsApp-এ</button></div>
    </article>`).join("") : '<div class="empty">কোনো অর্ডার পাওয়া যায়নি।</div>';
  document.querySelectorAll("[data-order]").forEach(btn => btn.addEventListener("click", () => {
    const order = allOrders.find(o => o.orderId === btn.dataset.order);
    if (order) openWhatsApp(buildMessage([order]));
  }));
}
function buildMessage(orders) {
  const lines = ["আসসালামু আলাইকুম, AZOM STORE!", "অর্ডার লিস্ট:", ""];
  orders.forEach((o, i) => {
    lines.push(`${i+1}) অর্ডার ID: ${o.orderId}`, `তারিখ: ${o.date}`, `নাম: ${o.customerName}`, `মোবাইল: ${o.customerPhone}`, `ঠিকানা: ${o.address}`, "পণ্য:");
    (o.items || []).forEach((x,j) => lines.push(`  ${j+1}. ${x.name} (${x.qty} পিস × ${money(x.price)}) = ${money(x.price*x.qty)}`));
    lines.push(`পণ্যের মূল্য: ${money(o.subtotal)}`, `ডেলিভারি: ${money(o.delivery)}`, `সর্বমোট: ${money(o.total)}`, `পেমেন্ট: ${o.paymentMethod}`, `প্রেরকের নম্বর: ${o.paymentSender}`, `TrxID: ${o.paymentTrx}`, "--------------------");
  });
  lines.push(`মোট অর্ডার: ${orders.length}`, `মোট টাকা: ${money(orders.reduce((s,o)=>s+Number(o.total||0),0))}`);
  return lines.join("\n");
}
function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
$("search").addEventListener("input", render);
$("source").addEventListener("change", loadOrders);
$("refreshBtn").addEventListener("click", loadOrders);
$("allWhatsApp").addEventListener("click", () => {
  if (!allOrders.length) { alert("পাঠানোর মতো কোনো অর্ডার নেই।"); return; }
  openWhatsApp(buildMessage(filteredOrders()));
});
loadOrders();
