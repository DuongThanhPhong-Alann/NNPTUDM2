const grid = document.getElementById("grid");
const emptyState = document.getElementById("empty");

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
    <td>
      <div class="thumb">
        ${imgUrl ? `<img src="${imgUrl}" alt="${item.title}" loading="lazy">` : ""}
      </div>
    </td>
    <td>${item.title}</td>
    <td class="price">${formatPrice(item.price)}</td>
    <td>${item.category?.name || "Không rõ"}</td>
    <td class="muted">${item.description || ""}</td>
    <td>${item.id}</td>
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

const loadData = async () => {
  try {
    const res = await fetch("db.json");
    if (!res.ok) throw new Error("Không thể tải db.json");
    const data = await res.json();
    render(data);
  } catch (err) {
    emptyState.hidden = false;
    emptyState.textContent = "Lỗi: " + err.message;
  }
};

loadData();
