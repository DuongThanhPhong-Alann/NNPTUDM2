const grid = document.getElementById("grid");
const emptyState = document.getElementById("empty");
const sortButtons = document.querySelectorAll("[data-sort]");

const state = {
  allItems: [],
  search: "",
  sort: "",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const createRow = (item) => {
  const row = document.createElement("tr");
  const imgUrl = Array.isArray(item.images) && item.images.length > 0
    ? item.images[0]
    : "";

  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.title}</td>
    <td>${item.slug || ""}</td>
    <td class="text-primary fw-semibold">${formatPrice(item.price)}</td>
    <td class="text-muted small">${item.description || ""}</td>
    <td>${item.category?.name || ""}</td>
    <td>
      <div class="ratio ratio-16x9" style="max-width: 96px;">
        ${imgUrl ? `<img src="${imgUrl}" alt="${item.title}" loading="lazy" class="w-100 h-100 object-fit-cover rounded">` : ""}
      </div>
    </td>
    <td class="text-muted small">${item.creationAt || ""}</td>
    <td class="text-muted small">${item.updatedAt || ""}</td>
  `;

  return row;
};

const render = (items) => {
  grid.innerHTML = "";
  if (!items.length) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  items.forEach((item) => grid.appendChild(createRow(item)));
};

const normalize = (value) => (value || "").toLowerCase().trim();

const applySort = (items) => {
  const sorted = [...items];
  switch (state.sort) {
    case "name-asc":
      sorted.sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)));
      break;
    case "name-desc":
      sorted.sort((a, b) => normalize(b.title).localeCompare(normalize(a.title)));
      break;
    case "price-asc":
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case "price-desc":
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    default:
      break;
  }
  return sorted;
};

const applyFilters = () => {
  const keyword = normalize(state.search);
  const filtered = state.allItems.filter((item) =>
    normalize(item.title).includes(keyword)
  );
  render(applySort(filtered));
};

window.onChanged = (event) => {
  state.search = event.target.value || "";
  applyFilters();
};
// Back-compat if anything still calls the old handler name.
window.handleSearchChange = window.onChanged;

const setupSortButtons = () => {
  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sort = btn.getAttribute("data-sort") || "";
      applyFilters();
    });
  });
};

const loadData = async () => {
  try {
    const res = await fetch("db.json");
    if (!res.ok) throw new Error("Không thể tải db.json");
    const data = await res.json();
    state.allItems = Array.isArray(data) ? data : [];
    render(state.allItems);
    setupSortButtons();
  } catch (err) {
    emptyState.hidden = false;
    emptyState.textContent = "Lỗi: " + err.message;
  }
};

loadData();
