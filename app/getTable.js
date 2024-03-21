const getData = async (json) => {
  const result = await fetch(`./data/${json}.json`);

  const data = await result.json();

  return data;
};

const getRepartoFiltered = async () => {
  const { data } = await getData("Prereparto_bruto");

  const grupoLocalizacionDescToMatch = [
    "CICLO 2 GRUPO A2",
    "CICLO 1 GRUPO B",
    "CICLO 1 GRUPO A2",
  ];
  // GRUPO A2 and esEcommerce = 1
  const repartoFiltered = data.filter(
    ({ grupoLocalizacionDesc, esEcommerce, key }) =>
      grupoLocalizacionDescToMatch.includes(grupoLocalizacionDesc) &&
      esEcommerce === 1
  );
  return repartoFiltered;
};

export const getTable = async () => {
  const { data: stockData } = await getData("Stock_unificado");

  const reparto = await getRepartoFiltered();

  const table = [];

  for (let i = 0; i < reparto.length; i++) {
    const producto = reparto[i];
    const stock = getProductStock(producto, stockData);
    if (stock.length === 0) {
      // console.log(producto);
      continue;
    }
    table.push(...stock);
  }
  // console.log(table);
  return table;
};

const getProductStock = (product, stockData) => {
  const { key, propuesta, esEcommerce, tiendaId } = product;
  const zonas = ["ZAR", "MSR", "SILO"];
  let stockTaken = [];
  let _stockTaken = [];
  let stockRemaining = propuesta;
  for (let i = 0; i < zonas.length; i++) {
    const zona = zonas[i];

    const zonasStock = stockData.filter((stock) => {
      const condition =
        esEcommerce === 1
          ? stock.stockEm05 + stock.stockEm01 > 0
          : stock.stockEm01 > 0;
      return stock.key === key && stock.tipoStockDesc === zona && condition;
    });

    if (zonasStock.length === 0) {
      if (i + 1 === zonas.length) {
        //Buscó en todas las zonas
        if (stockRemaining > 0 && stockRemaining < propuesta) {
          //productos que se encontro stock pero no satisfizo toda la prueba
        }
      }
      continue;
    }
    //solo buscar en el stock5 si es una ecommerce
    if (esEcommerce === 1) {
      //primero busca si existe un stock que ya tenga todas las unidades propuestas
      const stock5Satisfied = zonasStock.find(
        (stock) => stock.stockEm05 >= propuesta
      );

      if (stock5Satisfied) {
        stock5Satisfied.stockEm05 -= propuesta;
        stockTaken.push({
          Key: key,
          idTienda: tiendaId,
          propuesta,
          tipoStockDesc: zona,
          estadoStock: "5",
          posicioncompleta: stock5Satisfied.posicioncompleta,
        });
        break;
      }
      //si no tiene dichas unidades, empezar a recolectar en el restante de stock 5
      for (const zonaStock of zonasStock) {
        // Si ya satisfizo la propuesta salimos del bucle
        if (stockRemaining <= 0) {
          break;
        }

        if (zonaStock.stockEm05 > 0) {
          const taken = Math.min(stockRemaining, zonaStock.stockEm05);
          zonaStock.stockEm05 -= taken;
          _stockTaken.push({
            Key: key,
            idTienda: tiendaId,
            propuesta,
            tipoStockDesc: zona,
            estadoStock: "5",
            posicioncompleta: zonaStock.posicioncompleta,
          });
          stockRemaining -= taken;
        }
      }
    }
    //Buscar si existe un stock 1 que satisfaga toda la propuesta
    //para las tiendas fisicas
    //PD: en este bucle nunca va entrar porque ya se filtro anteriormente por esEcommerce = 1
    if (!esEcommerce) {
      const stock1Satisfied = zonasStock.find(
        (stock) => stock.stockEm01 >= propuesta
      );
      if (stock1Satisfied) {
        stock1Satisfied.stockEm01 -= propuesta;
        stockTaken.push({
          Key: key,
          idTienda: tiendaId,
          propuesta,
          tipoStockDesc: zona,
          estadoStock: "1",
          posicioncompleta: stock1Satisfied.posicioncompleta,
        });
        break;
      }
    }
    // Luego, si todavía queda stock por tomar, buscamos en las zonasStock con stockEm01, en este bucle entra tanto ecommerce como tienda fisica.
    for (const zonaStock of zonasStock) {
      // Si ya satisfizo la propuesta salimos del bucle
      if (stockRemaining <= 0) {
        break;
      }
      if (zonaStock.stockEm01 > 0) {
        // console.log(zona, zonaStock, product);
        const taken = Math.min(stockRemaining, zonaStock.stockEm01);
        zonaStock.stockEm01 -= taken;
        _stockTaken.push({
          Key: key,
          idTienda: tiendaId,
          propuesta,
          tipoStockDesc: zona,
          estadoStock: "1",
          posicioncompleta: zonaStock.posicioncompleta,
        });
        stockRemaining -= taken;
      }
    }
    //solo va entrar en el condicional si SILO tiene stock
    if (i + 1 === zonas.length) {
      //Buscó en todas las zonas
      if (stockRemaining > 0 && stockRemaining < propuesta) {
        // console.log(product);
        //productos que se encontro stock pero no satisfizo toda la prueba
      }
    }
    if (stockRemaining <= 0) {
      stockTaken.push(..._stockTaken);
      break; // Ya hemos tomado toda la cantidad necesaria
    }
  }
  // console.log("stockTaken", stockTaken);
  return stockTaken;
};
