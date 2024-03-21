export const printTable = (data) => {
  const keys = Object.keys(data[0]);
  const thead = document.querySelector("thead tr");
  const tbody = document.querySelector("tbody");
  keys.forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    thead.append(th);
  });

  data.forEach((row) => {
    const tr = document.createElement("tr");
    const values = Object.values(row);
    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
};
