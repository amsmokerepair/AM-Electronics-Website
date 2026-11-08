/* Repair status lookup (am-electronicsrepair.org/status).
   Asks the shop's BenchDesk system for one ticket's status. The database only answers when the ticket number
   AND the last 4 digits of the phone on that ticket both match, limits how often anyone can try, and returns
   only the status, the device and dates (never a name, phone number or price). Everything is shown as plain
   text, so nothing that comes back can run as code on this page. */
(function () {
  var URL = "https://lyzbeervqnuyqlqcmpcc.supabase.co/rest/v1/rpc/repair_status";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5emJlZXJ2cW51eXFscWNtcGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODkzOTcsImV4cCI6MjEwODQ2NTM5N30.uKmtn4Cu2FHAFEj9MDrsYaDQssQyh4hxAX_spFTFIr4";
  var STEPS = ["Checked in", "Diagnosing", "In repair", "Ready for pickup", "Picked up"];
  var NOTES = {
    "Checked in": "We have your device and it's in line for a technician.",
    "Diagnosing": "A technician is finding out exactly what's wrong. We'll reach out if the price changes.",
    "In repair": "Your device is being repaired now.",
    "Waiting on parts": "We're waiting for a part to arrive. We'll text you as soon as it's in.",
    "Waiting on customer": "We need to hear from you before we continue. Please call or text us at (501) 492-9906.",
    "Ready for pickup": "It's ready! Come by Mon–Sat 10 AM–8 PM. Please bring your receipt or a photo ID.",
    "Picked up": "This repair has been picked up. Thanks for choosing A&M! Repairs carry a 30-day warranty.",
    "Unrepairable": "We weren't able to repair this device. Please come pick it up, or call us with any questions."
  };
  // statuses that sit between the main steps
  var AT = { "Waiting on parts": 2, "Waiting on customer": 1, "Unrepairable": 1 };
  var form = document.getElementById("statusForm"), out = document.getElementById("stOut"), btn = document.getElementById("stGo");
  if (!form) return;
  var num = document.getElementById("stNum"), ph = document.getElementById("stPh");
  // a link like /status?t=1042 fills in the ticket number
  var t = (location.search.match(/[?&]t=(\d{1,9})/) || [])[1]; if (t) { num.value = t; ph.focus(); }
  [num, ph].forEach(function (el) { el.addEventListener("input", function () { el.value = el.value.replace(/\D/g, ""); }); });
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function day(iso) { if (!iso) return ""; var d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }); }
  function show(kind, nodes) {
    out.className = "status-out show " + kind; out.textContent = "";
    nodes.forEach(function (n) { out.appendChild(n); });
  }
  function fail(msg) { show("err", [el("div", "", msg)]); }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var n = num.value.trim(), l4 = ph.value.trim();
    if (!/^\d{1,9}$/.test(n)) { num.focus(); return fail("Enter the ticket number from your receipt."); }
    if (!/^\d{4}$/.test(l4)) { ph.focus(); return fail("Enter the last 4 digits of your phone number."); }
    btn.disabled = true; btn.textContent = "Checking…";
    fetch(URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + KEY }, body: JSON.stringify({ p_ticket: n, p_last4: l4 }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok) return fail((r && r.error) || "Something went wrong. Please call us at (501) 492-9906.");
        var status = String(r.status || "Checked in"), nodes = [];
        nodes.push(el("h3", "", status));
        nodes.push(el("div", "dev", "Ticket #" + r.number + (r.device ? " · " + r.device : "") + (r.checked_in ? " · checked in " + day(r.checked_in) : "")));
        var at = STEPS.indexOf(status); if (at < 0) at = AT[status] != null ? AT[status] : 0;
        if (status !== "Unrepairable") {
          var ul = el("ul", "steps");
          STEPS.forEach(function (s, i) {
            var label = s;
            if (i === at && STEPS.indexOf(status) < 0) label = status;             // e.g. "Waiting on parts" in place of "In repair"
            if (s === "Ready for pickup" && r.ready_at) label += " · " + day(r.ready_at);
            if (s === "Picked up" && r.picked_up_at) label += " · " + day(r.picked_up_at);
            ul.appendChild(el("li", i < at || (i === at && status === "Picked up") ? "done" : i === at ? "now" : "", label));
          });
          nodes.push(ul);
        }
        nodes.push(el("p", "status-note", NOTES[status] || "Questions? Call or text us at (501) 492-9906."));
        show("ok", nodes);
      })
      .catch(function () { fail("We couldn't check right now. Please try again, or call (501) 492-9906."); })
      .then(function () { btn.disabled = false; btn.textContent = "Check status"; });
  });
})();
