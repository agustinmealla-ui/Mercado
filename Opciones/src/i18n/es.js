/**
 * Traducciones al español para la terminal de opciones
 */

export const es = {
  // Tabs
  tabs: {
    chain: 'Cadena de Opciones',
    distribution: 'Distribución',
    payoff: 'Payoff',
    builder: 'Constructor',
  },

  // Toolbar
  toolbar: {
    ticker: 'Ticker',
    expiration: 'Vencimiento',
    refresh: 'Actualizar',
    loading: 'Cargando...',
    selectDate: 'Seleccionar fecha',
    loadingData: 'Cargando datos...',
  },

  // Option Chain Tab
  chainTab: {
    title: 'Cadena de Opciones',
    calls: 'CALLS',
    puts: 'PUTS',
    noData: 'Sin datos de cadena de opciones',
    noDataMessage: 'Selecciona un ticker y vencimiento, luego haz clic en Actualizar',
    summary: 'Resumen',
    totalVolume: 'Volumen Total',
    totalOI: 'Interés Abierto Total',
    putCallRatio: 'Ratio Put/Call',
    atmStrike: 'Strike ATM',
    spot: 'Spot',

    // Columns
    strike: 'Strike',
    bid: 'Bid',
    ask: 'Ask',
    mid: 'Mid',
    last: 'Último',
    volume: 'Volumen',
    openInterest: 'Int. Abierto',
    impliedVol: 'IV',

    // Modal
    details: 'Detalles',
    greeks: 'Griegas',
    pricing: 'Precio',
    marketData: 'Datos de Mercado',
    close: 'Cerrar',
  },

  // Distribution Tab
  distributionTab: {
    title: 'Distribución de Probabilidad',
    subtitle: 'Densidad de probabilidad neutral al riesgo (método Breeden-Litzenberger)',
    parameters: 'Parámetros de Distribución',
    minMoneyness: 'Moneyness Mín',
    maxMoneyness: 'Moneyness Máx',
    moneynessHelp: 'Ratio al spot',
    calculate: 'Calcular Distribución',
    calculating: 'Calculando distribución...',
    noData: 'Sin datos de distribución',
    noDataMessage: 'Selecciona un ticker y vencimiento, luego haz clic en Calcular Distribución',
    exportCSV: 'Exportar CSV',

    // Statistics
    expectedPrice: 'Precio Esperado',
    expectedPriceDesc: 'Media de la distribución',
    stdDev: 'Desv. Estándar',
    stdDevDesc: 'Volatilidad del precio',
    skewness: 'Asimetría',
    skewnessDesc: 'Asimetría de la distribución',
    kurtosis: 'Curtosis',
    kurtosisDesc: 'Pesadez de las colas',

    // Quantiles
    quantiles: 'Cuantiles',
    percentile25: 'Percentil 25',
    percentile50: 'Percentil 50 (Mediana)',
    percentile75: 'Percentil 75',

    // Risk Metrics
    riskMetrics: 'Métricas de Riesgo',
    var95: 'VaR 95%',
    probBelowSpot: 'P(Debajo del Spot)',
    probAboveSpot: 'P(Encima del Spot)',
  },

  // Payoff Tab
  payoffTab: {
    title: 'Payoff Combinado',
    positions: 'Posiciones',
    addLeg: 'Agregar Leg',
    clearAll: 'Limpiar Todo',
    addNewPosition: 'Agregar Nueva Posición',
    side: 'Lado',
    type: 'Tipo',
    strike: 'Strike',
    premium: 'Prima',
    optional: 'Opcional',
    adding: 'Agregando...',
    add: 'Agregar',
    long: 'Long',
    short: 'Short',
    call: 'Call',
    put: 'Put',
    noPositions: 'No hay posiciones agregadas. Haz clic en "Agregar Leg" para construir una estrategia multi-leg.',
    noChain: 'Sin cadena de opciones cargada',
    noChainMessage: 'Carga una cadena de opciones primero para construir estrategias',

    // Greeks
    aggregatedGreeks: 'Griegas Agregadas',
    delta: 'Delta (Δ)',
    gamma: 'Gamma (Γ)',
    theta: 'Theta (Θ)',
    vega: 'Vega (ν)',
    rho: 'Rho (ρ)',

    // Risk Metrics
    riskMetrics: 'Métricas de Riesgo',
    maxProfit: 'Ganancia Máxima',
    maxLoss: 'Pérdida Máxima',
    breakeven: 'Punto de Equilibrio',
    breakevens: 'Puntos de Equilibrio',
    unlimited: 'Ilimitado',
  },

  // Builder Tab
  builderTab: {
    title: 'Constructor de API',
    toolSelection: 'Selección de Herramienta',
    parameters: 'Parámetros',
    execute: 'Ejecutar Herramienta',
    executing: 'Ejecutando...',
    error: 'Error',
    response: 'Respuesta',
    request: 'Solicitud',
    copied: '¡Copiado!',
    copyJSON: 'Copiar JSON',

    // Getting Started
    gettingStarted: 'Primeros Pasos',
    step1: '1. Selecciona una herramienta del menú desplegable',
    step2: '2. Completa los parámetros requeridos (marcados con *)',
    step3: '3. Haz clic en "Ejecutar Herramienta" para llamar a la API',
    step4: '4. Ve la solicitud y respuesta JSON abajo',
    step5: '5. Copia el JSON al portapapeles usando el botón copiar',
    availableTools: 'Herramientas Disponibles',

    // Tool Names
    tools: {
      get_expirations: 'Obtener Vencimientos',
      get_chain: 'Obtener Cadena de Opciones',
      compute_greeks: 'Calcular Griegas',
      get_distribution: 'Obtener Distribución de Probabilidad',
      compute_payoff_profile: 'Calcular Perfil de Payoff',
    },

    // Tool Descriptions
    toolDescriptions: {
      get_expirations: 'Obtiene todas las fechas de vencimiento disponibles para un ticker',
      get_chain: 'Obtiene la cadena de opciones (calls y puts) para un vencimiento específico',
      compute_greeks: 'Calcula las griegas para todas las opciones en un vencimiento específico',
      get_distribution: 'Extrae la distribución de probabilidad implícita de los precios de opciones',
      compute_payoff_profile: 'Calcula el perfil de payoff para una posición de opciones',
    },

    // Parameters
    underlying: 'Subyacente',
    expiration: 'Vencimiento',
    minMoneyness: 'Moneyness Mín',
    maxMoneyness: 'Moneyness Máx',
    side: 'Lado',
    optionType: 'Tipo de Opción',
    strike: 'Strike',
    spotMin: 'Spot Mín',
    spotMax: 'Spot Máx',
  },

  // Common
  common: {
    loading: 'Cargando...',
    noData: 'Sin datos',
    error: 'Error',
    success: 'Éxito',
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    remove: 'Eliminar',
  },
};
