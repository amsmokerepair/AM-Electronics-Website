/* Sends each quote request straight into the shop's BenchDesk system the moment it's submitted.
   Formspree still gets the normal submission (and emails it), so nothing changes for the customer.
   The key below is a public, read-nothing key: the database only lets it call "submit_lead". */
(function () {
  var URL = "https://lyzbeervqnuyqlqcmpcc.supabase.co/rest/v1/rpc/submit_lead";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5emJlZXJ2cW51eXFscWNtcGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODkzOTcsImV4cCI6MjEwODQ2NTM5N30.uKmtn4Cu2FHAFEj9MDrsYaDQssQyh4hxAX_spFTFIr4";
  var FIELDS = ["first_name", "last_name", "name", "phone", "email", "device", "model", "issue", "message", "city", "storage", "condition", "carrier", "payout", "notes", "_subject", "_gotcha"];
  function hook(form) {
    if (!form || form.dataset.bdHooked) return;
    form.dataset.bdHooked = "1";
    if (!form.querySelector('[name="_gotcha"]')) {
      var hp = document.createElement("input");
      hp.type = "text"; hp.name = "_gotcha"; hp.tabIndex = -1; hp.autocomplete = "off";
      hp.setAttribute("aria-hidden", "true"); hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
      form.appendChild(hp);
    }
    form.addEventListener("submit", function (ev) {
      if (form.dataset.bdSent) return;          // second pass: let the normal Formspree submit go through
      ev.preventDefault();
      form.dataset.bdSent = "1";
      var btn = form.querySelector('[type="submit"]'); if (btn) btn.disabled = true;
      var go = function () { go = function () {}; HTMLFormElement.prototype.submit.call(form); };
      try {
        var p = {};
        FIELDS.forEach(function (f) { var el = form.querySelector('[name="' + f + '"]'); if (el && el.value) p[f] = String(el.value).slice(0, 1000); });
        fetch(URL, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + KEY }, body: JSON.stringify({ p: p }) })
          .then(function () { go(); }, function () { go(); });
        setTimeout(function () { go(); }, 2500);  // never hold the customer up more than a moment
      } catch (e) { go(); }
    });
  }
  function init() { document.querySelectorAll('form[action*="formspree.io"]').forEach(hook); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
