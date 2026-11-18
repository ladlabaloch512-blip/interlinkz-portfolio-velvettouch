/* Velvet Touch Salon and Spa - site behaviour.
   Cart, shop, detail pages, booking flow, checkout and forms.
   One delegated click listener for all cart actions, bound once only. */
(function () {
  "use strict";
  var D = window.VT_DATA;
  if (!D) return;

  function rs(n) { return "Rs " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function byId(id) { return document.getElementById(id); }
  function treatment(id) { for (var i = 0; i < D.treatments.length; i++) if (D.treatments[i].id === id) return D.treatments[i]; return null; }
  function product(id) { for (var i = 0; i < D.products.length; i++) if (D.products[i].id === id) return D.products[i]; return null; }
  function priceLabel(t) { return (t.from ? "from " : "") + rs(t.price); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  /* ---------- Cart state ---------- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem("vt_cart") || "{}") || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach(function (k) { if (!product(k)) delete cart[k]; });
  var fulfilment = localStorage.getItem("vt_fulfilment") || "delivery";

  function saveCart() {
    try { localStorage.setItem("vt_cart", JSON.stringify(cart)); } catch (e) {}
    updateBadges();
  }
  function cartCount() { var n = 0; Object.keys(cart).forEach(function (k) { n += cart[k]; }); return n; }
  function cartSubtotal() { var s = 0; Object.keys(cart).forEach(function (k) { s += product(k).price * cart[k]; }); return s; }
  function deliveryCharge() {
    if (fulfilment === "pickup") return 0;
    var sub = cartSubtotal();
    if (sub === 0 || sub > D.freeAbove) return 0;
    return D.deliveryFee;
  }
  function updateBadges() {
    var n = cartCount();
    document.querySelectorAll(".cart-count").forEach(function (b) { b.textContent = n; b.style.display = n ? "inline-block" : "none"; });
  }

  var toastTimer = null;
  function toast(msg) {
    var t = byId("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    cart[id] = (cart[id] || 0) + qty;
    saveCart();
    toast(product(id).name + " added to cart");
    if (byId("cartItems")) renderCart();
    if (byId("ckSummary")) renderCheckoutSummary();
  }

  /* ---------- One delegated listener for cart actions (bound once) ---------- */
  if (!window.__vtDelegated) {
    window.__vtDelegated = true;
    document.addEventListener("click", function (ev) {
      var add = ev.target.closest("[data-add]");
      if (add) {
        var qtyEl = byId("pdQty");
        var q = add.getAttribute("data-add-page") && qtyEl ? Math.max(1, parseInt(qtyEl.value, 10) || 1) : 1;
        addToCart(add.getAttribute("data-add"), q);
        return;
      }
      var plus = ev.target.closest("[data-plus]");
      if (plus) { var id1 = plus.getAttribute("data-plus"); cart[id1] = (cart[id1] || 0) + 1; saveCart(); renderCart(); if (byId("ckSummary")) renderCheckoutSummary(); return; }
      var minus = ev.target.closest("[data-minus]");
      if (minus) { var id2 = minus.getAttribute("data-minus"); cart[id2] = (cart[id2] || 0) - 1; if (cart[id2] <= 0) delete cart[id2]; saveCart(); renderCart(); if (byId("ckSummary")) renderCheckoutSummary(); return; }
      var rem = ev.target.closest("[data-remove]");
      if (rem) { delete cart[rem.getAttribute("data-remove")]; saveCart(); renderCart(); if (byId("ckSummary")) renderCheckoutSummary(); return; }
    });
  }

  /* ---------- Header mobile nav ---------- */
  var navBtn = byId("navToggle"), nav = byId("mainNav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.parentElement;
      var panel = item.querySelector(".faq-a");
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-a").style.maxHeight = null;
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Home: highlights and shop strip ---------- */
  var hl = byId("highlightGrid");
  if (hl) {
    var picks = ["signature-haircut", "signature-glow-facial", "hot-stone-ritual"];
    hl.innerHTML = picks.map(function (id) {
      var t = treatment(id);
      return '<article class="card t-card">' +
        '<a href="treatment.html?t=' + t.id + '"><img src="' + t.img + '" alt="' + esc(t.name) + '"></a>' +
        '<div class="card-body"><h3><a href="treatment.html?t=' + t.id + '">' + esc(t.name) + "</a></h3>" +
        '<p class="meta">' + t.duration + " min &middot; " + priceLabel(t) + "</p>" +
        "<p>" + esc(t.desc) + "</p>" +
        '<div class="card-actions"><a class="btn btn-small" href="book.html?treatment=' + t.id + '">Book Now</a>' +
        '<a class="text-link" href="treatment.html?t=' + t.id + '">Details</a></div></div></article>';
    }).join("");
  }
  var strip = byId("shopStrip");
  if (strip) {
    strip.innerHTML = D.products.map(function (p) {
      return '<article class="card p-card">' +
        '<a href="product.html?p=' + p.id + '"><img src="' + p.img + '" alt="' + esc(p.name) + '"></a>' +
        '<div class="card-body"><h3><a href="product.html?p=' + p.id + '">' + esc(p.name) + "</a></h3>" +
        '<p class="meta">' + esc(p.category) + " &middot; " + esc(p.size) + "</p>" +
        '<p class="price">' + rs(p.price) + "</p>" +
        '<button class="btn btn-small" type="button" data-add="' + p.id + '">Add to Cart</button></div></article>';
    }).join("");
  }

  /* ---------- Services page ---------- */
  var sg = byId("servicesGroups");
  if (sg) {
    var html = "";
    D.groups.concat(["Packages"]).forEach(function (g) {
      var list = D.treatments.filter(function (t) { return t.group === g; });
      if (!list.length) return;
      html += '<section class="service-group"><h2>' + esc(g) + "</h2>";
      list.forEach(function (t) {
        html += '<div class="service-row">' +
          '<a class="service-thumb" href="treatment.html?t=' + t.id + '"><img src="' + t.img + '" alt="' + esc(t.name) + '"></a>' +
          '<div class="service-info"><h3><a href="treatment.html?t=' + t.id + '">' + esc(t.name) + "</a></h3>" +
          "<p>" + esc(t.desc) + "</p></div>" +
          '<div class="service-side"><span class="meta">' + t.duration + ' min</span>' +
          '<span class="price">' + priceLabel(t) + "</span>" +
          '<a class="btn btn-small" href="book.html?treatment=' + t.id + '">Book</a></div></div>';
      });
      html += "</section>";
    });
    sg.innerHTML = html;
  }

  /* ---------- Treatment detail ---------- */
  var td = byId("treatmentDetail");
  if (td) {
    var tid = new URLSearchParams(location.search).get("t") || "signature-haircut";
    var t = treatment(tid) || D.treatments[0];
    document.title = t.name + " - Velvet Touch Salon and Spa";
    var patchNote = ["full-hair-colour", "balayage", "keratin-smooth"].indexOf(t.id) >= 0
      ? '<p class="note">Please note: this service needs a patch test at least 24 hours before a first appointment. It takes two minutes in the salon.</p>' : "";
    td.innerHTML =
      '<p class="crumb"><a href="services.html">Services and Prices</a> &rsaquo; ' + esc(t.group) + "</p>" +
      '<div class="detail-grid"><div class="detail-media"><img src="' + t.img + '" alt="' + esc(t.name) + '"></div>' +
      '<div class="detail-info"><h1>' + esc(t.name) + "</h1>" +
      '<p class="meta">' + esc(t.group) + " &middot; " + t.duration + " min</p>" +
      '<p class="price big">' + priceLabel(t) + "</p>" +
      (t.from ? '<p class="note">This is a starting price. The final price is confirmed at the salon by hair length or options, before your treatment begins.</p>' : "") +
      "<p>" + esc(t.desc) + "</p>" +
      '<a class="btn" href="book.html?treatment=' + t.id + '">Book This Treatment</a>' + patchNote + "</div></div>" +
      '<div class="detail-cols"><div><h2>What it involves</h2><ul class="tick-list">' +
      t.involves.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
      "</ul></div><div><h2>Aftercare</h2><p>" + esc(t.aftercare) + "</p>" +
      '<h2>Good to know</h2><p>No advance payment is needed for standard appointments. You can change or cancel free of charge up to 4 hours before your appointment time.</p></div></div>';
  }

  /* ---------- Shop ---------- */
  var shopGrid = byId("shopGrid");
  var currentFilter = "All", currentSort = "featured";
  function renderShop() {
    if (!shopGrid) return;
    var list = D.products.filter(function (p) { return currentFilter === "All" || p.category === currentFilter; });
    if (currentSort === "low") list = list.slice().sort(function (a, b) { return a.price - b.price; });
    if (currentSort === "high") list = list.slice().sort(function (a, b) { return b.price - a.price; });
    shopGrid.innerHTML = list.map(function (p) {
      return '<article class="card p-card">' +
        '<a href="product.html?p=' + p.id + '"><img src="' + p.img + '" alt="' + esc(p.name) + '"></a>' +
        '<div class="card-body"><h3><a href="product.html?p=' + p.id + '">' + esc(p.name) + "</a></h3>" +
        '<p class="meta">' + esc(p.category) + " &middot; " + esc(p.size) + "</p>" +
        "<p>" + esc(p.desc) + "</p>" +
        '<p class="price">' + rs(p.price) + "</p>" +
        '<button class="btn btn-small" type="button" data-add="' + p.id + '">Add to Cart</button></div></article>';
    }).join("");
    var cnt = byId("shopCount");
    if (cnt) cnt.textContent = "Showing " + list.length + " of " + D.products.length + " products";
  }
  if (shopGrid) {
    renderShop();
    document.querySelectorAll(".filter-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        document.querySelectorAll(".filter-pill").forEach(function (x) { x.classList.remove("active"); });
        pill.classList.add("active");
        currentFilter = pill.getAttribute("data-filter");
        renderShop();
      });
    });
    var sortSel = byId("sortSel");
    if (sortSel) sortSel.addEventListener("change", function () { currentSort = sortSel.value; renderShop(); });
  }

  /* ---------- Product detail ---------- */
  var pd = byId("productDetail");
  if (pd) {
    var pid = new URLSearchParams(location.search).get("p") || D.products[0].id;
    var p = product(pid) || D.products[0];
    document.title = p.name + " - Velvet Touch Salon and Spa";
    var related = D.products.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    pd.innerHTML =
      '<p class="crumb"><a href="shop.html">Shop</a> &rsaquo; ' + esc(p.category) + "</p>" +
      '<div class="detail-grid"><div class="detail-media"><img src="' + p.img + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="detail-info"><h1>' + esc(p.name) + "</h1>" +
      '<p class="meta">' + esc(p.category) + " &middot; " + esc(p.size) + "</p>" +
      '<p class="price big">' + rs(p.price) + "</p><p>" + esc(p.desc) + "</p>" +
      "<h2>How to use</h2><p>" + esc(p.howto) + "</p>" +
      '<div class="qty-row"><label for="pdQty">Quantity</label>' +
      '<input type="number" id="pdQty" value="1" min="1" max="20"></div>' +
      '<button class="btn" type="button" data-add="' + p.id + '" data-add-page="1">Add to Cart</button>' +
      '<p class="note">Delivery is a flat ' + rs(D.deliveryFee) + ", free above " + rs(D.freeAbove) + ". Salon pickup is always free.</p></div></div>" +
      '<h2 class="section-title">You may also like</h2><div class="grid grid-3">' +
      related.map(function (r) {
        return '<article class="card p-card"><a href="product.html?p=' + r.id + '"><img src="' + r.img + '" alt="' + esc(r.name) + '"></a>' +
          '<div class="card-body"><h3><a href="product.html?p=' + r.id + '">' + esc(r.name) + "</a></h3>" +
          '<p class="price">' + rs(r.price) + "</p>" +
          '<button class="btn btn-small" type="button" data-add="' + r.id + '">Add to Cart</button></div></article>';
      }).join("") + "</div>";
  }

  /* ---------- Bridal packages ---------- */
  var pg = byId("packageGrid");
  if (pg) {
    pg.innerHTML = D.packages.map(function (pk) {
      return '<article class="card pkg-card"><img src="' + pk.img + '" alt="' + esc(pk.name) + '">' +
        '<div class="card-body"><h3>' + esc(pk.name) + "</h3><p>" + esc(pk.desc) + "</p>" +
        '<ul class="tick-list">' + pk.includes.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" +
        '<p class="price big">' + rs(pk.price) + (pk.duration ? ' &middot; <span class="meta">' + pk.duration + " min</span>" : "") + "</p>" +
        (pk.id === "party-makeup-pkg"
          ? '<a class="btn btn-small" href="book.html?treatment=party-makeup">Book Party Makeup</a>'
          : '<a class="btn btn-small" href="#bridalFormTitle">Ask About This Package</a>') +
        "</div></article>";
    }).join("");
  }

  /* ---------- Booking flow ---------- */
  var bkForm = byId("bookForm");
  if (bkForm) {
    var sel = byId("bkTreatment");
    var lastGroup = "";
    D.treatments.forEach(function (t) {
      if (t.group !== lastGroup) {
        var og = document.createElement("optgroup");
        og.label = t.group;
        sel.appendChild(og);
        lastGroup = t.group;
      }
      var o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.name + " - " + t.duration + " min - " + priceLabel(t);
      sel.lastChild.appendChild(o);
    });
    var pre = new URLSearchParams(location.search).get("treatment");
    if (pre && treatment(pre)) sel.value = pre;

    var dateInput = byId("bkDate");
    var today = new Date();
    var iso = today.toISOString().slice(0, 10);
    dateInput.min = iso;

    var slotWrap = byId("bkSlots");
    slotWrap.innerHTML = D.slots.map(function (s) {
      return '<label class="slot"><input type="radio" name="bkSlot" value="' + s + '"><span>' + s + "</span></label>";
    }).join("");

    function summaryUpdate() {
      var t = treatment(sel.value);
      var box = byId("bkSummary");
      if (!t || !box) return;
      box.innerHTML = "<strong>" + esc(t.name) + "</strong><br>" + t.duration + " min &middot; " + priceLabel(t) +
        (t.from ? "<br><span class='note-inline'>Starting price. The final price is confirmed at the salon by hair length or options.</span>" : "");
    }
    sel.addEventListener("change", summaryUpdate);
    summaryUpdate();

    bkForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = byId("bkError");
      var t = treatment(sel.value);
      var stylist = byId("bkStylist").value;
      var dateVal = dateInput.value;
      var slotEl = bkForm.querySelector('input[name="bkSlot"]:checked');
      var name = byId("bkName").value.trim();
      var phone = byId("bkPhone").value.trim();
      var problems = [];
      if (!t) problems.push("Please choose a treatment.");
      if (!dateVal) problems.push("Please pick a date.");
      if (!slotEl) problems.push("Please choose a time slot.");
      if (!name) problems.push("Please enter your name.");
      if (!phone) problems.push("Please enter your phone number.");
      else if (!/^[0-9+\s-]{10,}$/.test(phone)) problems.push("Please enter a valid phone number.");
      if (problems.length) {
        err.innerHTML = problems.join("<br>");
        err.style.display = "block";
        err.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      err.style.display = "none";
      var ref = "VTB-" + Math.floor(100000 + Math.random() * 900000);
      var niceDate = new Date(dateVal + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      var needsPatch = ["full-hair-colour", "balayage", "keratin-smooth"].indexOf(t.id) >= 0;
      byId("bookSuccess").innerHTML =
        "<h2>Thank you, " + esc(name) + ". Your appointment is booked.</h2>" +
        '<table class="confirm-table">' +
        "<tr><th>Treatment</th><td>" + esc(t.name) + "</td></tr>" +
        "<tr><th>Duration</th><td>" + t.duration + " min</td></tr>" +
        "<tr><th>Price</th><td>" + priceLabel(t) + "</td></tr>" +
        "<tr><th>Stylist</th><td>" + esc(stylist) + "</td></tr>" +
        "<tr><th>Date</th><td>" + esc(niceDate) + "</td></tr>" +
        "<tr><th>Time</th><td>" + esc(slotEl.value) + "</td></tr>" +
        "<tr><th>Booking reference</th><td><strong>" + ref + "</strong></td></tr></table>" +
        (t.from ? '<p class="note">This treatment is priced from ' + rs(t.price) + ". The final price is confirmed at the salon by hair length or options, before your treatment begins.</p>" : "") +
        (needsPatch ? '<p class="note">One thing to plan: this service needs a patch test at least 24 hours before your appointment. It takes two minutes in the salon.</p>' : "") +
        "<p>No advance payment is needed. You can change or cancel free of charge up to 4 hours before your appointment. This is a demo booking, nothing has been sent to the salon.</p>";
      byId("bookSuccess").style.display = "block";
      bkForm.style.display = "none";
      byId("bookSuccess").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------- Cart page ---------- */
  function fulfilmentRadios() {
    document.querySelectorAll('input[name="fulfil"]').forEach(function (r) {
      r.checked = r.value === fulfilment;
      r.addEventListener("change", function () {
        fulfilment = r.value;
        try { localStorage.setItem("vt_fulfilment", fulfilment); } catch (e) {}
        if (byId("cartItems")) renderCart();
        if (byId("ckSummary")) renderCheckoutSummary();
      });
    });
  }
  function renderCart() {
    var wrap = byId("cartItems");
    if (!wrap) return;
    var ids = Object.keys(cart);
    if (!ids.length) {
      wrap.innerHTML = '<p class="empty-note">Your cart is empty. <a href="shop.html">Browse the salon shop</a> to add the products our stylists use.</p>';
      var s = byId("cartSummary"); if (s) s.innerHTML = "";
      return;
    }
    wrap.innerHTML = ids.map(function (id) {
      var p = product(id);
      return '<div class="cart-row"><img src="' + p.img + '" alt="' + esc(p.name) + '">' +
        '<div class="cart-info"><h3><a href="product.html?p=' + p.id + '">' + esc(p.name) + "</a></h3>" +
        '<p class="meta">' + esc(p.size) + " &middot; " + rs(p.price) + "</p></div>" +
        '<div class="qty-ctrl"><button type="button" data-minus="' + id + '" aria-label="Reduce quantity">-</button>' +
        "<span>" + cart[id] + "</span>" +
        '<button type="button" data-plus="' + id + '" aria-label="Increase quantity">+</button></div>' +
        '<div class="cart-line">' + rs(p.price * cart[id]) + "</div>" +
        '<button class="remove-btn" type="button" data-remove="' + id + '">Remove</button></div>';
    }).join("");
    var sub = cartSubtotal(), del = deliveryCharge();
    byId("cartSummary").innerHTML =
      '<div class="summary-box"><h2>Order summary</h2>' +
      '<p><span>Subtotal</span><span>' + rs(sub) + "</span></p>" +
      "<p><span>" + (fulfilment === "pickup" ? "Salon pickup" : "Delivery") + "</span><span>" + (del === 0 ? "Free" : rs(del)) + "</span></p>" +
      (fulfilment === "delivery" && sub <= D.freeAbove ? '<p class="note">Add ' + rs(D.freeAbove + 1 - sub) + " more for free delivery, or choose salon pickup, which is always free.</p>" : "") +
      '<p class="total"><span>Total</span><span>' + rs(sub + del) + "</span></p>" +
      '<a class="btn btn-block" href="checkout.html">Go to Checkout</a></div>';
  }
  if (byId("cartItems")) { fulfilmentRadios(); renderCart(); }

  /* ---------- Checkout ---------- */
  function renderCheckoutSummary() {
    var box = byId("ckSummary");
    if (!box) return;
    var ids = Object.keys(cart);
    if (!ids.length) { box.innerHTML = '<p class="empty-note">Your cart is empty.</p>'; return; }
    var sub = cartSubtotal(), del = deliveryCharge();
    box.innerHTML = "<h2>Order summary</h2>" + ids.map(function (id) {
      var p = product(id);
      return '<p><span>' + esc(p.name) + " x " + cart[id] + "</span><span>" + rs(p.price * cart[id]) + "</span></p>";
    }).join("") +
      '<p><span>Subtotal</span><span>' + rs(sub) + "</span></p>" +
      "<p><span>" + (fulfilment === "pickup" ? "Salon pickup" : "Delivery") + "</span><span>" + (del === 0 ? "Free" : rs(del)) + "</span></p>" +
      '<p class="total"><span>Total</span><span>' + rs(sub + del) + "</span></p>";
  }
  var ckForm = byId("ckForm");
  if (ckForm) {
    fulfilmentRadios();
    renderCheckoutSummary();
    ckForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = byId("ckError");
      if (!Object.keys(cart).length) {
        err.textContent = "Your cart is empty. Add a product from the shop first.";
        err.style.display = "block";
        return;
      }
      var name = byId("ckName").value.trim();
      var phone = byId("ckPhone").value.trim();
      var address = byId("ckAddress").value.trim();
      var city = byId("ckCity").value.trim();
      var problems = [];
      if (!name) problems.push("Please enter your full name.");
      if (!phone) problems.push("Please enter your phone number.");
      else if (!/^[0-9+\s-]{10,}$/.test(phone)) problems.push("Please enter a valid phone number.");
      if (fulfilment === "delivery") {
        if (!address) problems.push("Please enter your delivery address.");
        if (!city) problems.push("Please enter your city.");
      }
      if (problems.length) {
        err.innerHTML = problems.join("<br>");
        err.style.display = "block";
        err.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      err.style.display = "none";
      var orderNo = "VTO-" + Math.floor(100000 + Math.random() * 900000);
      var pay = ckForm.querySelector('input[name="ckPay"]:checked');
      var total = cartSubtotal() + deliveryCharge();
      byId("orderSuccess").innerHTML =
        "<h2>Order placed. Thank you, " + esc(name) + ".</h2>" +
        '<table class="confirm-table">' +
        "<tr><th>Order number</th><td><strong>" + orderNo + "</strong></td></tr>" +
        "<tr><th>Total</th><td>" + rs(total) + "</td></tr>" +
        "<tr><th>Payment</th><td>" + esc(pay ? pay.value : "Cash on Delivery") + " (demo only)</td></tr>" +
        "<tr><th>" + (fulfilment === "pickup" ? "Collection" : "Delivery") + "</th><td>" +
        (fulfilment === "pickup" ? "Salon pickup from 9 Demo Plaza, Sample City. We will call " + esc(phone) + " when your order is ready."
                                 : "To " + esc(address) + ", " + esc(city) + ". Orders placed before 2 pm usually leave the same working day.") +
        "</td></tr></table>" +
        "<p>This is a demo order, so nothing has been charged and nothing will be delivered. In the real shop, a confirmation would now be on its way to you.</p>";
      byId("orderSuccess").style.display = "block";
      ckForm.style.display = "none";
      var sumBox = byId("ckSummary"); if (sumBox) sumBox.style.display = "none";
      cart = {};
      saveCart();
      byId("orderSuccess").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------- Bridal enquiry + contact forms ---------- */
  function simpleForm(formId, errId, okId, okHtml) {
    var f = byId(formId);
    if (!f) return;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var problems = [];
      f.querySelectorAll("[required]").forEach(function (input) {
        if (!input.value.trim()) problems.push("Please fill in: " + (input.getAttribute("data-label") || input.name));
        if (input.type === "tel" && input.value.trim() && !/^[0-9+\s-]{10,}$/.test(input.value.trim())) problems.push("Please enter a valid phone number.");
        if (input.type === "email" && input.value.trim() && !/^\S+@\S+\.\S+$/.test(input.value.trim())) problems.push("Please enter a valid email address.");
      });
      var err = byId(errId);
      if (problems.length) {
        err.innerHTML = problems.join("<br>");
        err.style.display = "block";
        return;
      }
      err.style.display = "none";
      var ok = byId(okId);
      ok.innerHTML = okHtml;
      ok.style.display = "block";
      f.reset();
      ok.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  simpleForm("bridalForm", "bridalError", "bridalSuccess",
    "<h3>Thank you. Your enquiry is with us.</h3><p>We will reply with availability for your date and the next steps for a trial session. Wedding season weekends fill fast, so you have done the right thing asking early. This is a demo form, so nothing has actually been sent.</p>");
  simpleForm("contactForm", "contactError", "contactSuccess",
    "<h3>Thank you. Your message is with us.</h3><p>We reply within salon hours: Monday to Saturday 10 am to 9 pm, Sunday 12 pm to 8 pm. This is a demo form, so nothing has actually been sent.</p>");

  updateBadges();
})();
