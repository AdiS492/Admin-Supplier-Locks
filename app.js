const products = [
  {
    id: "139475",
    name: "Citalopram 10mg tabs (250) ( Teva )",
    category: "G",
    concession: false,
    categories: [{ code: "G", description: "Generic" }],
  },
  {
    id: "139474",
    name: "Valupak 5000iu vitamin D3 tabs (30)",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139473",
    name: "Purosure ferrous fumarate 210mg tabs (84)",
    category: "B",
    concession: false,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139472",
    name: "Numark OTC medicines 100% olive oil ear spray (10ml)",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139471",
    name: "Adrenaline 1mg/ml (1:1000) soln for inj amps (10)",
    category: "G",
    concession: false,
    categories: [{ code: "G", description: "Generic" }],
  },
  {
    id: "139470",
    name: "Limbo waterproof protector adult elbow extra slim",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139469",
    name: "Purosure peppermint oil 0.2ml caps g/r (84)",
    category: "B",
    concession: false,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139468",
    name: "Aactivwax olive oil ear spray (10ml)",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139467",
    name: "Isosorbide mononitrate xl 30mg tabs (28)",
    category: "G",
    concession: false,
    categories: [{ code: "G", description: "Generic" }],
  },
  {
    id: "139466",
    name: "Rinaspray 21mcg BT1 M24 (15ml)",
    category: "P",
    concession: false,
    categories: [{ code: "P", description: "Parallel Import" }],
  },
  {
    id: "139465",
    name: "Melatonin 4mg tabs f/c (30)",
    category: "G",
    concession: false,
    categories: [{ code: "G", description: "Generic" }],
  },
  {
    id: "139464",
    name: "Sharpsafe disposal unit grey with purple lid (1.8 Litres)",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139463",
    name: "Apixa 2.5 (Teva)",
    category: "G",
    concession: false,
    categories: [{ code: "G", description: "Generic" }],
  },
  {
    id: "139462",
    name: "Enebium orodispersible 10mg tabs (28)",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139461",
    name: "Vevizye 1mg/ml eye drops soln (2ml)",
    category: "B",
    concession: true,
    categories: [{ code: "B", description: "Branded" }],
  },
  {
    id: "139460",
    name: "Melatonin 5mg tabs f/c (30)",
    category: "G",
    concession: false,
    categories: [{ code: "G", description: "Generic" }],
  },
];

const productsBody = document.querySelector("#productsBody");
const detailName = document.querySelector("#detailName");
const detailId = document.querySelector("#detailId");
const categoriesBody = document.querySelector("#categoriesBody");
const concessionCheckbox = document.querySelector("#concessionCheckbox");

let selectedProduct = products.find((product) => product.id === "139473") ?? products[0];

function concessionLabel(value) {
  return value ? "Yes" : "";
}

function renderProducts() {
  productsBody.innerHTML = products
    .map(
      (product) => `
        <tr data-product-id="${product.id}" class="${product.id === selectedProduct.id ? "selected" : ""}">
          <td><button class="edit-btn" type="button" aria-label="Edit ${product.name}"><span class="edit-icon" aria-hidden="true"></span></button></td>
          <td>${product.id}</td>
          <td title="${product.name}">${product.name}</td>
          <td>${product.category}</td>
          <td>${concessionLabel(product.concession)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderDetails() {
  detailName.textContent = `Product Name - ${selectedProduct.name}`;
  detailId.textContent = `Product Id - ${selectedProduct.id}`;
  concessionCheckbox.checked = selectedProduct.concession;
  categoriesBody.innerHTML = selectedProduct.categories
    .map(
      (category) => `
        <tr>
          <td>${category.code}</td>
          <td>${category.description}</td>
        </tr>
      `,
    )
    .join("");
}

function selectProduct(id) {
  const nextProduct = products.find((product) => product.id === id);
  if (!nextProduct) return;

  selectedProduct = nextProduct;
  renderProducts();
  renderDetails();
}

productsBody.addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-product-id]");
  if (!row) return;
  selectProduct(row.dataset.productId);
});

concessionCheckbox.addEventListener("change", () => {
  selectedProduct.concession = concessionCheckbox.checked;
  renderProducts();
});

renderProducts();
renderDetails();
