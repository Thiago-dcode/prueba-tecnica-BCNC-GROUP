import { getTable } from "./app/getTable.js";
import { printTable } from "./app/printTable.js";

const main = async () => {
  const table = await getTable();

  printTable(table);
};

document.addEventListener("DOMContentLoaded", main);
