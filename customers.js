(() => {
  "use strict";

  const workbookCustomers = Array.isArray(window.customerWorkbookData) ? window.customerWorkbookData : [];
  const customers = workbookCustomers.map((customer) => ({ ...customer, active: true }));
  const profiles = new Map();
  const supplierNames = [
    "AAH",
    "Alliance",
    "Mediahealth",
    "Phoenix",
    "DE Pharma",
    "Ethigen",
    "OTC Direct",
    "Trident",
    "B&S Distribution",
    "Block",
    "Bestway Medhub",
    "Lexon",
  ];
  const pmrNames = ["Proscript", "Cegedim", "Proscript Link", "Positive Solutions", "Rx Web", "Laxmico Bounce"];

  const tableBody = document.querySelector("#customerTableBody");
  const detailTitle = document.querySelector("#customerDetailTitle");
  const tabContent = document.querySelector("#customerTabContent");
  const tabs = [...document.querySelectorAll(".customer-tab")];
  const searchBox = document.querySelector(".customer-search-box");
  const searchInput = document.querySelector("#customerSearchInput");
  const pageInput = document.querySelector("#customerPageInput");
  const pageCount = document.querySelector("#customerPageCount");
  const pageSizeSelect = document.querySelector("#customerPageSize");
  const toast = document.querySelector("#customerToast");
  const reasonModal = document.querySelector("#supplierReasonModal");
  const reasonModalTitle = document.querySelector("#reasonModalTitle");
  const reasonModalDescription = document.querySelector("#reasonModalDescription");
  const reasonModalSubtitle = document.querySelector("#reasonModalSubtitle");
  const reasonForm = document.querySelector("#supplierReasonForm");
  const reasonInput = document.querySelector("#supplierChangeReason");
  const reasonConfirmButton = document.querySelector("#reasonConfirmButton");

  let activeTab = "system";
  let currentPage = 1;
  let pageSize = Number(pageSizeSelect.value);
  let selectedSupplier = "Select";
  let changeLogPage = 1;
  let changeLogPageSize = 5;
  let draftCustomer = null;
  let toastTimer;
  let pendingSupplierAction = null;

  const defaultCustomer = customers.find(
    (customer) => customer.company === "Octavian Healthcare Ltd" && customer.pharmacy === "Whitefield Pharmacy",
  ) || customers[0];
  let selectedId = defaultCustomer?.id ?? null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function slug(value) {
    return String(value || "customer")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "customer";
  }

  function seedFor(customer) {
    return `${customer.company}${customer.pharmacy}${customer.postcode}`
      .split("")
      .reduce((total, character) => total + character.charCodeAt(0), Number(customer.id) || 1);
  }

  function code(seed, length = 12) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    let value = seed * 2654435761;
    for (let index = 0; index < length; index += 1) {
      value = (value * 1664525 + 1013904223) >>> 0;
      result += alphabet[value % alphabet.length];
    }
    return result;
  }

  function displayDate(dateValue) {
    const [datePart] = String(dateValue || "").split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    if (!day || !month || !year) return "";
    const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
    return `${String(day).padStart(2, "0")}-${monthName}-${year}`;
  }

  function addDays(displayValue, days) {
    const match = String(displayValue).match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
    if (!match) return displayValue;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const date = new Date(Number(match[3]), months.indexOf(match[2]), Number(match[1]));
    date.setDate(date.getDate() + days);
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  function isOctavianExample(customer) {
    return customer.company === "Octavian Healthcare Ltd" && customer.pharmacy === "Whitefield Pharmacy";
  }

  function specialOctavianProfile() {
    return {
      system: {
        locked: false,
        signUpBy: "B&S Head Office",
        signUpRsm: "B&S Head Office",
        signupDate: "21-Apr-2024",
        liveDate: "27-Apr-2024",
        setupType: "Price Comparison",
        buyingGroup: "select",
        pointsScheme: false,
        isGroupHead: false,
        groupHead: "",
      },
      personal: {
        personName: "Bavish",
        email: "whitefield@octavianhealthcare.co.uk",
        telephone: "01617663216",
        postcode: "M45 8NE",
        address: "4 Albert Place",
        notes: "VP (2/04/24) -live date rx web",
      },
      suppliers: [
        { name: "AAH", userId: "AAH21086XML", password: "bmur3gys", terminal: "AAH21086XML", account: "305M11003366W", realm: "AAH21086XML" },
        { name: "Alliance", terminal: "555SW00697797", account: "697797" },
        { name: "Phoenix", account: "81153" },
        { name: "Trident", userId: "AAH21086XML", password: "bmur3gys", terminal: "AAH21086XML", account: "606R00142146E", realm: "AAH21086XML" },
        { name: "B&S Distribution", account: "B7071" },
        { name: "Block" },
      ],
      pmrs: [
        { name: "Proscript", accountId: "23868358", id: "BROHPT4JCDAOMDWK", password: "MQBYFS88CURGEY7J" },
        { name: "Cegedim", accountId: "05928978", id: "T9SG0Q5WJWGBY5GG", password: "EE5RPVA3KYSYGVYE" },
        { name: "Proscript Link", accountId: "36160329", id: "SCSJNC7Z5WUXGZZO", password: "CCCQSAWLPZL9ZUAA" },
        { name: "Positive Solutions", accountId: "66289637", id: "OVZYRX1TBO9A3LXL", password: "R9ZHQHBXGPNAMKOQ" },
        { name: "Rx Web", accountId: "12687399", id: "OWQHZPRVDMF7TWOR", password: "VEMSFSPOOVPNMJJ" },
        { name: "Laxmico Bounce", accountId: "50411922", id: "LBXW7PM2AKQ92", password: "QH7RW29ABK4Z" },
      ],
    };
  }

  function genericSupplier(name, seed, index) {
    if (name === "Block") return { name: "Block" };
    const suffix = String((seed * (index + 7)) % 999999).padStart(6, "0");
    if (name === "AAH" || name === "Trident") {
      const terminal = `${name === "AAH" ? "AAH" : "TRI"}${code(seed + index, 9)}`;
      return {
        name,
        userId: terminal,
        password: code(seed + 19 + index, 9).toLowerCase(),
        terminal,
        account: `${name === "AAH" ? "30" : "60"}${code(seed + 31 + index, 11)}`,
        realm: terminal,
      };
    }
    if (name === "Alliance") return { name, terminal: `555SW${suffix}`, account: suffix };
    if (name === "Phoenix") return { name, account: String(70000 + ((seed + index * 17) % 20000)) };
    return { name, account: `${name.slice(0, 2).toUpperCase()}${suffix}` };
  }

  function genericProfile(customer) {
    const seed = seedFor(customer);
    const created = displayDate(customer.created) || "01-Jan-2024";
    const linkedNames = ["AAH", "Alliance", "Phoenix", "Trident", "B&S Distribution"].slice(0, 3 + (seed % 3));
    const createdByName = String(customer.createdBy || "customer").split("@")[0];
    const firstName = titleCase(createdByName).split(" ")[0] || "Customer";
    const market = customer.market && customer.market.toLowerCase() !== "none" ? titleCase(customer.market) : "Independent";
    const phone = `01${String(100000000 + (seed % 899999999)).slice(0, 9)}`;

    return {
      system: {
        locked: false,
        signUpBy: seed % 2 ? "KAM South" : "B&S Head Office",
        signUpRsm: seed % 3 ? "Account already registered" : "B&S Head Office",
        signupDate: created,
        liveDate: addDays(created, 5 + (seed % 18)),
        setupType: "Price Comparison",
        buyingGroup: customer.market || "select",
        pointsScheme: seed % 4 === 0,
        isGroupHead: seed % 8 === 0,
        groupHead: "",
      },
      personal: {
        personName: firstName,
        email: `${slug(customer.pharmacy)}@${slug(customer.company)}.co.uk`,
        telephone: phone,
        postcode: customer.postcode,
        address: `${12 + (seed % 86)} ${market} Road`,
        notes: `Customer account for ${customer.pharmacy}. Live setup confirmed.`,
      },
      suppliers: [
        ...linkedNames.map((name, index) => genericSupplier(name, seed, index)),
        { name: "Block" },
      ],
      pmrs: pmrNames.slice(0, 3 + (seed % 4)).map((name, index) => ({
        name,
        accountId: String(10000000 + ((seed * (index + 5)) % 89999999)),
        id: code(seed + index * 23, 16),
        password: code(seed + index * 37 + 11, 15),
      })),
    };
  }

  function profileFor(customer) {
    if (!customer) return null;
    if (!profiles.has(customer.id)) {
      profiles.set(customer.id, isOctavianExample(customer) ? specialOctavianProfile() : genericProfile(customer));
    }
    const profile = profiles.get(customer.id);
    const blockSupplier = profile.suppliers.find((supplier) => supplier.name === "Block") || { name: "Block" };
    delete blockSupplier.userId;
    delete blockSupplier.password;
    delete blockSupplier.terminal;
    delete blockSupplier.account;
    delete blockSupplier.realm;
    profile.suppliers = [
      ...profile.suppliers.filter((supplier) => supplier.name !== "Block"),
      blockSupplier,
    ];
    if (!Array.isArray(profile.changes)) profile.changes = [];
    return profile;
  }

  function currentCustomer() {
    return draftCustomer || customers.find((customer) => customer.id === selectedId) || null;
  }

  function filteredCustomers() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.company, customer.pharmacy, customer.market, customer.postcode, customer.createdBy]
        .some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }

  function renderCustomerGrid() {
    const filtered = filteredCustomers();
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.max(1, Math.min(currentPage, pages));
    pageInput.value = currentPage;
    pageCount.textContent = pages;
    const start = (currentPage - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);

    tableBody.innerHTML = visible.map((customer) => `
      <tr data-customer-id="${customer.id}" class="${!draftCustomer && customer.id === selectedId ? "selected" : ""}">
        <td class="status-column"><span class="status-dot" title="Active" aria-label="Active"></span></td>
        <td title="${escapeHtml(customer.company)}">${escapeHtml(customer.company)}</td>
        <td title="${escapeHtml(customer.pharmacy)}">${escapeHtml(customer.pharmacy)}</td>
        <td title="${escapeHtml(customer.market)}">${escapeHtml(customer.market)}</td>
        <td>${escapeHtml(customer.postcode)}</td>
        <td>${escapeHtml(customer.created)}</td>
        <td title="${escapeHtml(customer.createdBy)}">${escapeHtml(customer.createdBy)}</td>
      </tr>
    `).join("");

    if (!visible.length) {
      tableBody.innerHTML = '<tr><td colspan="7" style="height:90px;text-align:center;color:#777">No matching customers</td></tr>';
    }
  }

  function selectOptions(options, selected) {
    return options.map((option) => {
      const value = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? option : option.label;
      return `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function supplierSelectOptions(linkedSuppliers, selected) {
    const linkedNames = new Set(linkedSuppliers.map((supplier) => supplier.name));
    return [
      `<option value="Select" ${selected === "Select" ? "selected" : ""}>Select</option>`,
      ...supplierNames.map((name) => {
        const isLinked = linkedNames.has(name);
        return `<option value="${escapeHtml(name)}" class="${isLinked ? "linked-supplier-option" : "unlinked-supplier-option"}" ${name === selected ? "selected" : ""} ${isLinked ? "" : "disabled"}>${escapeHtml(name)}</option>`;
      }),
    ].join("");
  }

  function field(label, name, value, required = false, type = "text") {
    return `
      <div class="form-field">
        <label for="${name}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ""}</label>
        <input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} />
      </div>`;
  }

  function dateField(label, name, value) {
    return `
      <div class="form-field">
        <label for="${name}">${escapeHtml(label)} <span class="required">*</span></label>
        <div class="date-field">
          <input id="${name}" name="${name}" value="${escapeHtml(value)}" required />
          <button type="button" aria-label="Choose ${escapeHtml(label)}">▦</button>
        </div>
      </div>`;
  }

  function renderSystem(customer, profile) {
    const system = profile.system;
    const groupHeads = [
      { value: "", label: "-- Select Group Head --" },
      ...customers.filter((item) => item.id !== customer.id).slice(0, 12).map((item) => ({ value: item.pharmacy, label: item.pharmacy })),
    ];

    tabContent.innerHTML = `
      <form id="systemForm">
        <label class="check-line"><input name="locked" type="checkbox" ${system.locked ? "checked" : ""} /> <span>locked</span></label>
        <h3 class="form-section-title">Customer Details</h3>
        <fieldset class="customer-fieldset">
          <div class="customer-form-grid">
            ${field("Company Name", "company", customer.company, true)}
            ${field("Pharmacy Name", "pharmacy", customer.pharmacy, true)}
            ${field("Post Code", "postcode", customer.postcode, true)}
            ${field("Market Code/Group", "market", customer.market, true)}
            <div class="form-field">
              <label for="signUpBy">Sign Up By <span class="required">*</span></label>
              <select id="signUpBy" name="signUpBy">${selectOptions(["KAM South", "KAM North", "B&S Head Office", "Customer Referral"], system.signUpBy)}</select>
            </div>
            <div class="form-field">
              <label for="signUpRsm">Sign Up By RSM <span class="required">*</span></label>
              <select id="signUpRsm" name="signUpRsm">${selectOptions(["Account already registered", "B&S Head Office", "RSM North", "RSM South"], system.signUpRsm)}</select>
            </div>
            ${dateField("Signup Date", "signupDate", system.signupDate)}
            ${dateField("Live Date", "liveDate", system.liveDate)}
            <div class="form-field">
              <label for="setupType">Setup Type <span class="required">*</span></label>
              <select id="setupType" name="setupType">${selectOptions(["Price Comparison", "Ordering", "Full Platform"], system.setupType)}</select>
            </div>
            <div class="form-field">
              <label for="buyingGroup">Buying Group</label>
              <select id="buyingGroup" name="buyingGroup">${selectOptions(["select", "Chana", "Octavian", "Pyramid", "Remedy", "Independent", customer.market], system.buyingGroup)}</select>
            </div>
          </div>
          <label class="check-line points-check"><input name="pointsScheme" type="checkbox" ${system.pointsScheme ? "checked" : ""} /> <span>Cascade Points Scheme</span></label>
          <fieldset class="group-head-settings">
            <legend>⚙ Group Head Settings</legend>
            <label class="group-head-check"><input name="isGroupHead" type="checkbox" ${system.isGroupHead ? "checked" : ""} /> Enable as a Group Head</label>
            <p class="field-help">When enabled, this pharmacy can be selected as a Group Head by other pharmacies</p>
            <div class="form-field group-head-select">
              <label for="groupHead">Group Head Pharmacy</label>
              <select id="groupHead" name="groupHead">${selectOptions(groupHeads, system.groupHead)}</select>
              <p class="field-help">Select which Group Head this pharmacy should be linked to (optional)</p>
            </div>
          </fieldset>
          <div class="form-actions"><button class="customer-btn customer-btn-green" type="submit">⟳ Update</button></div>
        </fieldset>
      </form>`;
  }

  function renderPersonal(customer, profile) {
    const personal = profile.personal;
    tabContent.innerHTML = `
      <form id="personalForm" class="personal-grid">
        <div class="personal-column">
          ${field("Person Name", "personName", personal.personName)}
          ${field("E-Mail Address", "email", personal.email, false, "email")}
          ${field("Telephone Number", "telephone", personal.telephone, false, "tel")}
          ${field("Post Code", "personalPostcode", personal.postcode)}
        </div>
        <div class="personal-column">
          <div class="form-field"><label for="address">Address</label><textarea id="address" name="address">${escapeHtml(personal.address)}</textarea></div>
          <div class="form-field"><label for="notes">Notes</label><textarea id="notes" name="notes">${escapeHtml(personal.notes)}</textarea></div>
        </div>
        <div class="form-actions"><button class="customer-btn customer-btn-green" type="submit">⟳ Update</button></div>
      </form>`;
  }

  function supplierEditor(supplier) {
    if (!supplier) return "";
    const isLocked = Boolean(supplier.locked);
    const fields = [];
    if (supplier.name !== "Block") {
      if (supplier.userId !== undefined) fields.push(field("User ID", "supplierUserId", supplier.userId));
      if (supplier.password !== undefined) fields.push(field("Password", "supplierPassword", supplier.password));
      if (supplier.terminal !== undefined) fields.push(field("Terminal ID", "supplierTerminal", supplier.terminal));
      fields.push(field("Account No/ID", "supplierAccount", supplier.account || ""));
      if (supplier.realm !== undefined) fields.push(field("Realm", "supplierRealm", supplier.realm));
    }
    return `
      <form id="supplierForm" class="supplier-editor">
        <fieldset class="supplier-lockable-fields" ${isLocked ? "disabled" : ""}>
          <div class="supplier-form-grid">${fields.join("")}</div>
        </fieldset>
        <div class="form-actions">
          <button class="customer-btn customer-btn-green" type="submit" ${isLocked ? "disabled" : ""}>⟳ Update</button>
          <button class="customer-btn customer-btn-lock ${isLocked ? "is-locked" : ""}" id="toggleSupplierLock" type="button" aria-pressed="${isLocked}">${isLocked ? "🔓 Unlock" : "🔒 Lock"}</button>
          <button class="customer-btn customer-btn-red" id="deleteSupplier" type="button">▥ Delete</button>
        </div>
      </form>`;
  }

  function renderSupplierChangeLog(changes) {
    const totalPages = Math.max(1, Math.ceil(changes.length / changeLogPageSize));
    changeLogPage = Math.max(1, Math.min(changeLogPage, totalPages));
    const startIndex = (changeLogPage - 1) * changeLogPageSize;
    const visibleChanges = changes.slice(startIndex, startIndex + changeLogPageSize);
    const rangeStart = changes.length ? startIndex + 1 : 0;
    const rangeEnd = Math.min(startIndex + changeLogPageSize, changes.length);
    return `
      <section class="supplier-change-log" aria-labelledby="supplierChangeLogTitle">
        <h3 id="supplierChangeLogTitle">Change Log</h3>
        <div class="supplier-change-log-scroll">
          <table class="supplier-change-log-table">
            <thead>
              <tr><th>Date / Time</th><th>Supplier</th><th>Action</th><th>Changed By</th><th>Reason</th></tr>
            </thead>
            <tbody>
              ${visibleChanges.length ? visibleChanges.map((change) => `
                <tr>
                  <td>${escapeHtml(change.timestamp)}</td>
                  <td>${escapeHtml(change.supplier)}</td>
                  <td><span class="change-action change-action-${escapeHtml(change.actionKey)}">${escapeHtml(change.action)}</span></td>
                  <td>${escapeHtml(change.changedBy)}</td>
                  <td title="${escapeHtml(change.reason)}">${escapeHtml(change.reason)}</td>
                </tr>`).join("") : '<tr class="empty-change-log"><td colspan="5">No supplier changes recorded.</td></tr>'}
            </tbody>
          </table>
        </div>
        <footer class="change-log-pager" aria-label="Change log pagination">
          <span class="change-log-range">${rangeStart}-${rangeEnd} of ${changes.length}</span>
          <div class="change-log-page-controls">
            <button type="button" data-change-page-action="first" aria-label="First change-log page" ${changeLogPage === 1 ? "disabled" : ""}>|‹</button>
            <button type="button" data-change-page-action="previous" aria-label="Previous change-log page" ${changeLogPage === 1 ? "disabled" : ""}>‹</button>
            <label>Page <input id="changeLogPageInput" value="${changeLogPage}" inputmode="numeric" aria-label="Change-log page number" /></label>
            <span>of ${totalPages}</span>
            <button type="button" data-change-page-action="next" aria-label="Next change-log page" ${changeLogPage === totalPages ? "disabled" : ""}>›</button>
            <button type="button" data-change-page-action="last" aria-label="Last change-log page" ${changeLogPage === totalPages ? "disabled" : ""}>›|</button>
            <select id="changeLogPageSize" aria-label="Change-log page size">
              ${[5, 10, 25].map((size) => `<option ${size === changeLogPageSize ? "selected" : ""}>${size}</option>`).join("")}
            </select>
          </div>
        </footer>
      </section>`;
  }

  function renderSuppliers(customer, profile) {
    const linked = profile.suppliers;
    let supplier = linked.find((item) => item.name === selectedSupplier);
    if (selectedSupplier !== "Select" && !supplier) {
      supplier = genericSupplier(selectedSupplier, seedFor(customer), supplierNames.indexOf(selectedSupplier));
      supplier._new = true;
    }

    tabContent.innerHTML = `
      <div class="supplier-toolbar">
        <select class="supplier-select" id="supplierSelect" aria-label="Select supplier">
          ${supplierSelectOptions(linked, selectedSupplier)}
        </select>
        <span class="linked-count">Linked Supplier : ${linked.length}</span>
      </div>
      ${selectedSupplier === "Select" ? "" : supplierEditor(supplier)}
      <hr class="supplier-divider" />
      <h3 class="linked-supplier-title">Linked Supplier</h3>
      <div class="linked-supplier-scroll">
        <table class="linked-supplier-table">
          <thead><tr><th>Supplier Name</th><th>Account No/ID</th><th>Terminal ID</th><th class="supplier-lock-column">Locked</th></tr></thead>
          <tbody>${linked.map((item) => `
            <tr data-supplier-name="${escapeHtml(item.name)}">
              <td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.account)}</td><td>${escapeHtml(item.terminal || "")}</td>
              <td class="supplier-lock-column">${item.locked ? '<span class="supplier-lock-indicator" role="img" aria-label="Locked" title="Locked"></span>' : ""}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
      ${renderSupplierChangeLog(profile.changes)}`;
  }

  function renderPmr(profile) {
    tabContent.innerHTML = `
      <div class="pmr-list">
        ${profile.pmrs.map((pmr) => `
          <section class="pmr-card">
            <h3><span class="pmr-user-icon" aria-hidden="true"></span>${escapeHtml(pmr.name)}</h3>
            <table class="pmr-table">
              <thead><tr><th style="width:21%">Account Id</th><th style="width:41%">Id</th><th>Password</th></tr></thead>
              <tbody><tr><td>${escapeHtml(pmr.accountId)}</td><td>${escapeHtml(pmr.id)}</td><td>${escapeHtml(pmr.password)}</td></tr></tbody>
            </table>
          </section>`).join("")}
      </div>`;
  }

  function renderDetail() {
    const customer = currentCustomer();
    if (!customer) {
      detailTitle.textContent = "Customer Name:";
      tabContent.innerHTML = '<div class="empty-detail">Select a customer to view its details.</div>';
      return;
    }

    detailTitle.textContent = `Customer Name: ${customer.company || "New Customer"}`;
    const profile = profileFor(customer);
    if (activeTab === "system") renderSystem(customer, profile);
    if (activeTab === "personal") renderPersonal(customer, profile);
    if (activeTab === "suppliers") renderSuppliers(customer, profile);
    if (activeTab === "pmr") renderPmr(profile);
  }

  function setActiveTab(tabName) {
    activeTab = tabName;
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    renderDetail();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  function openReasonModal({ title, description, subtitle = "", confirmLabel, onConfirm }) {
    pendingSupplierAction = onConfirm;
    reasonModalTitle.textContent = title;
    reasonModalDescription.textContent = description;
    reasonModalSubtitle.textContent = subtitle;
    reasonModalSubtitle.hidden = !subtitle;
    reasonConfirmButton.textContent = confirmLabel;
    reasonInput.value = "";
    reasonInput.setCustomValidity("");
    reasonModal.hidden = false;
    document.body.classList.add("reason-modal-open");
    window.setTimeout(() => reasonInput.focus(), 0);
  }

  function closeReasonModal() {
    reasonModal.hidden = true;
    document.body.classList.remove("reason-modal-open");
    pendingSupplierAction = null;
    reasonInput.value = "";
    reasonInput.setCustomValidity("");
  }

  function supplierChangeTimestamp() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  }

  function recordSupplierChange(profile, supplier, action, actionKey, reason) {
    profile.changes.unshift({
      timestamp: supplierChangeTimestamp(),
      supplier,
      action,
      actionKey,
      changedBy: "aditi surve",
      reason,
    });
    changeLogPage = 1;
  }

  function updateSystem(form) {
    const customer = currentCustomer();
    const profile = profileFor(customer);
    const data = new FormData(form);
    customer.company = String(data.get("company") || "");
    customer.pharmacy = String(data.get("pharmacy") || "");
    customer.postcode = String(data.get("postcode") || "");
    customer.market = String(data.get("market") || "");
    Object.assign(profile.system, {
      locked: data.has("locked"),
      signUpBy: data.get("signUpBy"),
      signUpRsm: data.get("signUpRsm"),
      signupDate: data.get("signupDate"),
      liveDate: data.get("liveDate"),
      setupType: data.get("setupType"),
      buyingGroup: data.get("buyingGroup"),
      pointsScheme: data.has("pointsScheme"),
      isGroupHead: data.has("isGroupHead"),
      groupHead: data.get("groupHead"),
    });

    if (draftCustomer) {
      customers.unshift(draftCustomer);
      selectedId = draftCustomer.id;
      draftCustomer = null;
      currentPage = 1;
      showToast("Customer created");
    } else {
      showToast("Customer details updated");
    }
    renderCustomerGrid();
    renderDetail();
  }

  function updatePersonal(form) {
    const profile = profileFor(currentCustomer());
    const data = new FormData(form);
    Object.assign(profile.personal, {
      personName: data.get("personName"),
      email: data.get("email"),
      telephone: data.get("telephone"),
      postcode: data.get("personalPostcode"),
      address: data.get("address"),
      notes: data.get("notes"),
    });
    showToast("Personal details updated");
  }

  function updateSupplier(form, reason) {
    const profile = profileFor(currentCustomer());
    const supplierName = selectedSupplier;
    let supplier = profile.suppliers.find((item) => item.name === selectedSupplier);
    if (!supplier) {
      supplier = { name: selectedSupplier };
      profile.suppliers.push(supplier);
    }
    const data = new FormData(form);
    const fieldMap = {
      supplierUserId: "userId",
      supplierPassword: "password",
      supplierTerminal: "terminal",
      supplierAccount: "account",
      supplierRealm: "realm",
    };
    Object.entries(fieldMap).forEach(([formName, property]) => {
      if (data.has(formName)) supplier[property] = data.get(formName);
    });
    recordSupplierChange(profile, supplierName, "Updated", "updated", reason);
    showToast(`${supplierName} supplier updated`);
    renderDetail();
  }

  function requestSupplierUpdate(form) {
    const supplierName = selectedSupplier;
    openReasonModal({
      title: `Update "${supplierName}"?`,
      description: `The supplier account details for ${supplierName} will be updated.`,
      confirmLabel: "Update",
      onConfirm: (reason) => updateSupplier(form, reason),
    });
  }

  function deleteSupplier(reason) {
    if (selectedSupplier === "Select") return;
    const supplierName = selectedSupplier;
    const profile = profileFor(currentCustomer());
    if (selectedSupplier === "Block") {
      recordSupplierChange(profile, supplierName, "Delete blocked", "blocked", reason);
      showToast("Block is required and cannot be removed");
      renderDetail();
      return;
    }
    const index = profile.suppliers.findIndex((item) => item.name === selectedSupplier);
    if (index >= 0) profile.suppliers.splice(index, 1);
    recordSupplierChange(profile, supplierName, "Deleted", "deleted", reason);
    showToast(`${supplierName} supplier removed`);
    selectedSupplier = "Select";
    renderDetail();
  }

  function requestSupplierDelete() {
    const supplierName = selectedSupplier;
    openReasonModal({
      title: `Delete "${supplierName}"?`,
      description: supplierName === "Block"
        ? "Block is a required supplier and cannot be removed. Your reason will be recorded as a blocked delete attempt."
        : `This will remove ${supplierName} from the linked suppliers for this customer.`,
      confirmLabel: "Delete",
      onConfirm: (reason) => deleteSupplier(reason),
    });
  }

  function toggleSupplierLock(reason) {
    if (selectedSupplier === "Select") return;
    const profile = profileFor(currentCustomer());
    const supplierName = selectedSupplier;
    let supplier = profile.suppliers.find((item) => item.name === selectedSupplier);
    if (!supplier) {
      supplier = genericSupplier(selectedSupplier, seedFor(currentCustomer()), supplierNames.indexOf(selectedSupplier));
      profile.suppliers.push(supplier);
    }
    supplier.locked = !supplier.locked;
    recordSupplierChange(profile, supplierName, supplier.locked ? "Locked" : "Unlocked", supplier.locked ? "locked" : "unlocked", reason);
    showToast(`${supplierName} supplier ${supplier.locked ? "locked" : "unlocked"}`);
    renderDetail();
  }

  function requestSupplierLock() {
    const profile = profileFor(currentCustomer());
    const supplier = profile.suppliers.find((item) => item.name === selectedSupplier);
    const willLock = !supplier?.locked;
    openReasonModal({
      title: `${willLock ? "Lock" : "Unlock"} "${selectedSupplier}"?`,
      description: willLock
        ? `The supplier credentials for ${selectedSupplier} will become read-only.`
        : `The supplier credentials for ${selectedSupplier} will become editable.`,
      subtitle: willLock ? "Orders will not transmit to this supplier if locked." : "",
      confirmLabel: willLock ? "Lock" : "Unlock",
      onConfirm: (reason) => toggleSupplierLock(reason),
    });
  }

  tableBody.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-customer-id]");
    if (!row) return;
    draftCustomer = null;
    selectedId = Number(row.dataset.customerId);
    selectedSupplier = "Select";
    changeLogPage = 1;
    activeTab = "system";
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === "system";
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    renderCustomerGrid();
    renderDetail();
    document.querySelector(".customer-detail-panel").scrollTop = 0;
  });

  tabs.forEach((tab) => tab.addEventListener("click", () => setActiveTab(tab.dataset.tab)));

  tabContent.addEventListener("change", (event) => {
    if (event.target.id === "supplierSelect") {
      selectedSupplier = event.target.value;
      renderDetail();
      return;
    }
    if (event.target.id === "changeLogPageSize") {
      changeLogPageSize = Number(event.target.value) || 5;
      changeLogPage = 1;
      renderDetail();
      return;
    }
    if (event.target.id === "changeLogPageInput") {
      changeLogPage = Number(event.target.value) || 1;
      renderDetail();
    }
  });

  tabContent.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-change-page-action]");
    if (pageButton && !pageButton.disabled) {
      const profile = profileFor(currentCustomer());
      const totalPages = Math.max(1, Math.ceil(profile.changes.length / changeLogPageSize));
      const action = pageButton.dataset.changePageAction;
      if (action === "first") changeLogPage = 1;
      if (action === "previous") changeLogPage -= 1;
      if (action === "next") changeLogPage += 1;
      if (action === "last") changeLogPage = totalPages;
      renderDetail();
      return;
    }
    const row = event.target.closest("tr[data-supplier-name]");
    if (row) {
      selectedSupplier = row.dataset.supplierName;
      renderDetail();
      return;
    }
    if (event.target.closest("#toggleSupplierLock")) {
      requestSupplierLock();
      return;
    }
    if (event.target.closest("#deleteSupplier")) requestSupplierDelete();
  });

  tabContent.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.target.id === "systemForm") updateSystem(event.target);
    if (event.target.id === "personalForm") updatePersonal(event.target);
    if (event.target.id === "supplierForm") requestSupplierUpdate(event.target);
  });

  reasonForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = reasonInput.value.trim();
    if (!reason) {
      reasonInput.setCustomValidity("Please enter a reason for this change.");
      reasonInput.reportValidity();
      return;
    }
    const action = pendingSupplierAction;
    closeReasonModal();
    action?.(reason);
  });

  reasonInput.addEventListener("input", () => reasonInput.setCustomValidity(""));

  reasonModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-reason-modal]")) closeReasonModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !reasonModal.hidden) closeReasonModal();
  });

  document.querySelector("#searchCustomerButton").addEventListener("click", () => {
    searchBox.hidden = false;
    searchInput.focus();
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderCustomerGrid();
  });

  document.querySelector("#newCustomerButton").addEventListener("click", () => {
    const id = Math.max(0, ...customers.map((customer) => Number(customer.id))) + 1;
    const now = new Date();
    const created = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    draftCustomer = { id, company: "", pharmacy: "", market: "", postcode: "", created, createdBy: "aditi.surve@luxshtech.com", active: true };
    profileFor(draftCustomer);
    selectedSupplier = "Select";
    changeLogPage = 1;
    setActiveTab("system");
    renderCustomerGrid();
    document.querySelector(".customer-detail-panel").scrollTop = 0;
  });

  document.querySelector("#refreshCustomerGrid").addEventListener("click", () => {
    searchInput.value = "";
    searchBox.hidden = true;
    currentPage = 1;
    renderCustomerGrid();
    showToast("Customer grid refreshed");
  });

  pageSizeSelect.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value);
    currentPage = 1;
    renderCustomerGrid();
  });

  pageInput.addEventListener("change", () => {
    currentPage = Number(pageInput.value) || 1;
    renderCustomerGrid();
  });

  document.querySelector(".customer-pager").addEventListener("click", (event) => {
    const action = event.target.dataset.pageAction;
    if (!action) return;
    const pages = Math.max(1, Math.ceil(filteredCustomers().length / pageSize));
    if (action === "first") currentPage = 1;
    if (action === "previous") currentPage -= 1;
    if (action === "next") currentPage += 1;
    if (action === "last") currentPage = pages;
    renderCustomerGrid();
  });

  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    document.body.classList.toggle("nav-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!document.body.classList.contains("nav-collapsed")));
  });

  renderCustomerGrid();
  renderDetail();
})();
