# Options Server

### Biblioteca de herramientas para análisis de opciones financieras

Sistema completo para el análisis cuantitativo de opciones incluyendo cálculo de griegas, volatilidad implícita, distribuciones de probabilidad, y perfiles de payoff usando el modelo Black-Scholes.

---

## Tabla de Contenidos

- [🛠️ Herramientas](#-herramientas-1)
  - [get_expiration.py](#get_expirationpy)
  - [get_option_chain.py](#get_option_chainpy)
  - [greeks.py](#greekspy)
  - [get_implied_distribution.py](#get_implied_distributionpy)
  - [compute_payoff.py](#compute_payoffpy)
- [📦 Modelos](#-modelos-1)
  - [GetOptionExpirations](#clase-getoptionexpirations)
  - [OptionQuote](#clase-optionquote)
  - [Option_Chain](#clase-option_chain)
  - [OptionGreeks](#clase-optiongreeks)
  - [Greeks](#clase-greeks)
  - [ImpliedDistribution](#clase-implieddistribution)
  - [OptionPayoff](#clase-optionpayoff)
- [🔧 Utilidades](#-utilidades-1)
  - [get_spot.py](#get_spotpy)
  - [option_quote.py](#option_quotepy)
  - [risk_free.py](#risk_freepy)
  - [bs.py](#bspy)

---

## 🛠️ Herramientas

### get_expiration.py

Obtiene todas las fechas de vencimiento disponibles para opciones de un activo subyacente.

**Función:** `get_option_expiration(underlying: str) -> GetOptionExpirations`

#### Parámetros

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `underlying` | `str` | Ticker del activo subyacente (ej: "AAPL", "TSLA", "SPY") |

#### Retorna

Objeto `GetOptionExpirations` con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `underlying` | `str` | Ticker del activo |
| `expirations` | `List[str]` | Lista de fechas de vencimiento en formato "YYYY-MM-DD" |
| `count` | `int` | Número total de fechas de vencimiento disponibles |

#### Ejemplo de uso

```python
from Server.core.tools.get_expiration import get_option_expiration

result = get_option_expiration("AAPL")
print(f"Ticker: {result.underlying}")
print(f"Vencimientos disponibles: {result.count}")
print(f"Fechas: {result.expirations}")
```

**Salida esperada:**
```
Ticker: AAPL
Vencimientos disponibles: 28
Fechas: ['2025-12-05', '2025-12-12', '2025-12-19', ...]
```

### get_option_chain.py

Obtiene la cadena completa de opciones (calls y puts) para un activo y fecha de vencimiento específicos.

**Función:** `get_option_chain(underlying: str, expiration: str) -> Option_Chain`

#### Parámetros

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `underlying` | `str` | Ticker del activo subyacente (ej: "AAPL", "TSLA", "SPY") |
| `expiration` | `str` | Fecha de vencimiento en formato "YYYY-MM-DD" |

#### Retorna

Objeto `Option_Chain` con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `underlying` | `str` | Ticker del activo |
| `long_name` | `str` | Nombre completo de la empresa |
| `currency` | `str` | Moneda del activo (USD, EUR, etc.) |
| `expiration` | `str` | Fecha de vencimiento |
| `as_of` | `str` | Fecha de valoración (fecha actual) |
| `spot` | `float` | Precio spot actual del subyacente |
| `calls` | `List[OptionQuote]` | Lista de opciones call disponibles |
| `puts` | `List[OptionQuote]` | Lista de opciones put disponibles |

#### Ejemplo de uso

```python
from Server.core.tools.get_option_chain import get_option_chain

result = get_option_chain("AAPL", "2025-12-26")
print(f"Ticker: {result.underlying}")
print(f"Nombre: {result.long_name}")
print(f"Moneda: {result.currency}")
print(f"Vencimiento: {result.expiration}")
print(f"Spot: ${result.spot}")
print(f"Calls disponibles: {len(result.calls)}")
print(f"Puts disponibles: {len(result.puts)}")
```

**Salida esperada:**
```
Ticker: AAPL
Nombre: Apple Inc.
Moneda: USD
Vencimiento: 2025-12-26
Spot: $227.48
Calls disponibles: 87
Puts disponibles: 85
```

### greeks.py

Calcula las griegas (Delta, Gamma, Theta, Vega, Rho) para toda la cadena de opciones usando el modelo Black-Scholes.

**Función:** `compute_greeks_chain(underlying: str, expiration: str) -> Greeks`

#### Parámetros

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `underlying` | `str` | Ticker del activo subyacente (ej: "AAPL", "TSLA", "SPY") |
| `expiration` | `str` | Fecha de vencimiento en formato "YYYY-MM-DD" |

#### Retorna

Objeto `Greeks` con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `underlying` | `str` | Ticker del activo |
| `expiration` | `str` | Fecha de vencimiento |
| `calls` | `List[OptionGreeks]` | Griegas calculadas para cada opción call |
| `puts` | `List[OptionGreeks]` | Griegas calculadas para cada opción put |

#### Ejemplo de uso

```python
from Server.core.tools.greeks import compute_greeks_chain

result = compute_greeks_chain("AAPL", "2025-12-26")
print(f"Underlying: {result.underlying}")
print(f"Calls: {len(result.calls)}")
print(f"Puts: {len(result.puts)}")

# Acceder a las griegas de una opción específica
call = result.calls[0]
print(f"Strike: {call.strike}")
print(f"Delta: {call.delta:.4f}")
print(f"Gamma: {call.gamma:.4f}")
```

**Salida esperada:**
```
Underlying: AAPL
Calls: 87
Puts: 85
Strike: 150.0
Delta: 0.9823
Gamma: 0.0012
```

### get_implied_distribution.py

Extrae la distribución de probabilidad risk-neutral implícita en los precios de las opciones usando el método de Breeden-Litzenberger. Proporciona estadísticos descriptivos completos incluyendo momentos, cuantiles y medidas de riesgo.

**Función:** `get_implied_distribution(underlying: str, expiration: str, min_moneyness: float = 0.7, max_moneyness: float = 1.3) -> ImpliedDistribution`

#### Parámetros

| Nombre | Tipo | Por defecto | Descripción |
|--------|------|-------------|-------------|
| `underlying` | `str` | - | Ticker del activo subyacente (ej: "AAPL", "SPY", "TSLA") |
| `expiration` | `str` | - | Fecha de vencimiento en formato "YYYY-MM-DD" |
| `min_moneyness` | `float` | `0.7` | Moneyness mínimo (Strike/Spot) para filtrar opciones |
| `max_moneyness` | `float` | `1.3` | Moneyness máximo (Strike/Spot) para filtrar opciones |

#### Metodología

El cálculo sigue estos pasos:

1. **Obtención de datos**: Descarga la cadena de opciones call del activo
2. **Cálculo de IV**: Calcula volatilidad implícita para cada strike usando Newton-Raphson
3. **Suavizado**: Aplica filtro gaussiano a la curva de volatilidad
4. **Interpolación**: Genera strikes interpolados con paso de $0.01
5. **Breeden-Litzenberger**: Calcula PDF como `e^(rt) * ∂²C/∂K²`
6. **Normalización**: Normaliza la distribución para que integre a 1
7. **Estadísticos**: Calcula momentos, cuantiles y medidas de riesgo

#### Retorna

Objeto `ImpliedDistribution` con estadísticos completos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `mean` | `float` | Precio esperado del subyacente al vencimiento |
| `std_dev` | `float` | Desviación estándar de la distribución |
| `skewness` | `float` | Asimetría (3er momento estandarizado) |
| `kurtosis` | `float` | Curtosis (4to momento estandarizado) |
| `quantile_25` | `float` | Percentil 25 de la distribución |
| `quantile_50` | `float` | Mediana (percentil 50) |
| `quantile_75` | `float` | Percentil 75 de la distribución |
| `VaR_95` | `float` | Value at Risk al 95% de confianza |
| `probability_below_spot` | `float` | Probabilidad de cierre por debajo del spot |
| `probability_above_spot` | `float` | Probabilidad de cierre por encima del spot |
| `distribution_summary` | `List[dict]` | Bins de $1 con sus probabilidades |

#### Ejemplo de uso

```python
from Server.core.tools.get_implied_distribution import get_implied_distribution

result = get_implied_distribution("SPY", "2025-03-21", min_moneyness=0.8, max_moneyness=1.2)

print(f"Underlying: {result.underlying}")
print(f"Spot actual: ${result.spot}")
print(f"Precio esperado: ${result.mean:.2f}")
print(f"Desviación estándar: ${result.std_dev:.2f}")
print(f"Skewness: {result.skewness:.4f}")
print(f"VaR 95%: ${result.VaR_95:.2f}")
print(f"Prob. caída: {result.probability_below_spot:.2%}")
print(f"Prob. subida: {result.probability_above_spot:.2%}")
```

**Salida esperada:**
```
Underlying: SPY
Spot actual: $602.45
Precio esperado: $605.23
Desviación estándar: $18.45
Skewness: -0.1234
VaR 95%: $575.67
Prob. caída: 48.23%
Prob. subida: 51.77%
```

### compute_payoff.py

Calcula el perfil completo de payoff y profit/loss de una posición en opciones, incluyendo las griegas ajustadas por el lado de la posición (long/short).

**Función:** `compute_option_payoff(side: str, option_type: str, underlying: str, Strike: float, expiration: str, spot_min: Optional[float] = None, spot_max: Optional[float] = None) -> OptionPayoff`

#### Parámetros

| Nombre | Tipo | Por defecto | Descripción |
|--------|------|-------------|-------------|
| `side` | `str` | - | Lado de la posición: `"long"` (compra) o `"short"` (venta) |
| `option_type` | `str` | - | Tipo de opción: `"call"` o `"put"` |
| `underlying` | `str` | - | Ticker del activo subyacente (ej: "AAPL", "SPY") |
| `Strike` | `float` | - | Precio de ejercicio de la opción |
| `expiration` | `str` | - | Fecha de vencimiento en formato "YYYY-MM-DD" |
| `spot_min` | `float` | `spot*0.5` | Precio mínimo del rango de simulación |
| `spot_max` | `float` | `spot*1.5` | Precio máximo del rango de simulación |

#### Cálculo de Payoff y Profit

**Payoff (valor intrínseco):**
- **Long Call**: `max(S - K, 0) × 100`
- **Long Put**: `max(K - S, 0) × 100`
- **Short Call**: `-max(S - K, 0) × 100`
- **Short Put**: `-max(K - S, 0) × 100`

**Profit/Loss:**
- **Long**: `Payoff - Prima × 100`
- **Short**: `Prima × 100 + Payoff`

Donde S = precio spot, K = strike, y se multiplica por 100 para el valor del contrato estándar.

#### Retorna

Objeto `OptionPayoff` con el perfil completo:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `premium` | `float` | Prima de la opción (por acción) |
| `spot_current` | `float` | Precio spot actual del subyacente |
| `spot_prices` | `List[float]` | 50 precios simulados en el rango especificado |
| `payoffs` | `List[float]` | Payoff al vencimiento para cada precio (× 100) |
| `profits` | `List[float]` | Profit/Loss neto para cada precio (× 100) |
| `greeks` | `OptionGreeks` | Griegas ajustadas por el lado de la posición |


#### Ejemplo de uso

```python
from Server.core.tools.compute_payoff import compute_option_payoff

# Long Call en AAPL
result = compute_option_payoff(
    side="long",
    option_type="call",
    underlying="AAPL",
    Strike=150.0,
    expiration="2025-03-21"
)

print(f"Posición: {result.side.upper()} {result.option_type.upper()} @ ${result.strike}")
print(f"Prima pagada: ${result.premium:.2f}")
print(f"Spot actual: ${result.spot_current:.2f}")
print(f"\nGriegas:")
print(f"  Delta: {result.greeks.delta:.4f}")
print(f"  Gamma: {result.greeks.gamma:.4f}")
print(f"  Theta: {result.greeks.theta:.4f}")
print(f"  Vega: {result.greeks.vega:.4f}")
print(f"\nBreakeven: ${result.strike + result.premium:.2f}")
```

**Salida esperada:**
```
Posición: LONG CALL @ $150.0
Prima pagada: $82.50
Spot actual: $227.48

Griegas:
  Delta: 0.9892
  Gamma: 0.0008
  Theta: -0.0156
  Vega: 0.1234

Breakeven: $232.50
```

---

## 📦 Modelos

Define las estructuras de datos utilizadas por las herramientas de análisis de opciones.

**Clase:** `GetOptionExpirations`

**Atributos:**
- `underlying` (str): Ticker del activo subyacente
- `expirations` (List[str]): Lista de fechas de vencimiento en formato string
- `count` (int): Cantidad de fechas de vencimiento disponibles

Este modelo se utiliza como estructura de retorno para la función `get_option_expiration`.

**Clase:** `OptionQuote`

**Atributos:**
- `contractSymbol` (str): Símbolo del contrato de opción
- `lastTradeDate` (str): Fecha y hora del último trade en formato "YYYY-MM-DD HH:MM"
- `strike` (float): Precio de ejercicio (strike price)
- `lastPrice` (float): Último precio negociado
- `bid` (float): Precio de compra (bid)
- `ask` (float): Precio de venta (ask)
- `mid` (float): Precio medio calculado como (bid + ask) / 2
- `volume` (int): Volumen de contratos negociados
- `openInterest` (int): Interés abierto (contratos pendientes)
- `intheMoney` (bool): Indica si la opción está en el dinero (ITM)

Este modelo representa una cotización individual de opción (call o put).

**Clase:** `Option_Chain`

**Atributos:**
- `underlying` (str): Ticker del activo subyacente
- `long_name` (str): Nombre completo del activo
- `currency` (str): Moneda del activo
- `expiration` (str): Fecha de vencimiento
- `as_of` (str): Fecha de valoración
- `spot` (float): Precio spot actual del subyacente
- `calls` (List[OptionQuote]): Lista de opciones call
- `puts` (List[OptionQuote]): Lista de opciones put

Este modelo se utiliza como estructura de retorno para la función `get_option_chain`.

**Clase:** `OptionGreeks`

**Atributos:**
- `contractSymbol` (str): Símbolo del contrato
- `strike` (float): Precio de ejercicio
- `delta` (float): Delta de la opción
- `gamma` (float): Gamma de la opción
- `theta` (float): Theta de la opción
- `vega` (float): Vega de la opción
- `rho` (float): Rho de la opción

**Clase:** `Greeks`

**Atributos:**
- `underlying` (str): Ticker del activo subyacente
- `expiration` (str): Fecha de vencimiento
- `calls` (List[OptionGreeks]): Lista de griegas para calls
- `puts` (List[OptionGreeks]): Lista de griegas para puts

**Clase:** `ImpliedDistribution`

**Atributos:**
- `expiration` (str): Fecha de vencimiento en formato "YYYY-MM-DD"
- `underlying` (str): Ticker del activo subyacente
- `strikes` (List[float]): Lista de strikes válidos utilizados en el cálculo
- `spot` (float): Precio spot actual del subyacente
- `dte` (int): Días hasta el vencimiento (Days To Expiration)
- `risk_free_rate` (float): Tasa libre de riesgo anualizada
- `mean` (float): Media de la distribución implícita
- `std_dev` (float): Desviación estándar de la distribución
- `skewness` (float): Asimetría (tercer momento estandarizado)
- `kurtosis` (float): Curtosis (cuarto momento estandarizado)
- `quantile_25` (float): Percentil 25 de la distribución
- `quantile_50` (float): Mediana (percentil 50)
- `quantile_75` (float): Percentil 75 de la distribución
- `bowley_skewness` (float): Medida de asimetría basada en cuartiles
- `VaR_95` (float): Value at Risk al 95% de confianza
- `VaR_95_loss` (float): Pérdida potencial correspondiente al VaR 95%
- `probability_below_spot` (float): Probabilidad de que el precio termine debajo del spot
- `probability_above_spot` (float): Probabilidad de que el precio termine encima del spot
- `distribution_summary` (List[dict]): Lista de diccionarios con bins de precio y sus probabilidades

Este modelo se utiliza como estructura de retorno para la función `get_implied_distribution`.

**Clase:** `OptionPayoff`

**Atributos:**
- `underlying` (str): Ticker del activo subyacente
- `expiration` (str): Fecha de vencimiento en formato "YYYY-MM-DD"
- `strike` (float): Precio de ejercicio de la opción
- `side` (str): Lado de la posición ("long" o "short")
- `option_type` (str): Tipo de opción ("call" o "put")
- `premium` (float): Prima pagada/recibida por la opción
- `spot_current` (float): Precio spot actual del subyacente
- `spot_prices` (List[float]): Lista de precios spot simulados para el análisis
- `payoffs` (List[float]): Lista de payoffs al vencimiento para cada precio spot (valor por contrato x100)
- `profits` (List[float]): Lista de profit/loss neto para cada precio spot (incluye prima, valor por contrato x100)
- `greeks` (OptionGreeks): Griegas de la posición ajustadas por el lado (long/short)

Este modelo se utiliza como estructura de retorno para la función `compute_option_payoff`.

---

## 🔧 Utilidades

Funciones auxiliares utilizadas por las herramientas principales.

### get_spot.py

Obtiene el precio spot actual de un activo subyacente desde Yahoo Finance.

**Función:** `get_spot_price(underlying: str) -> float`

**Parámetros:**
- `underlying` (str): Ticker del activo subyacente (ej: "AAPL", "TSLA")

**Retorna:** Precio spot actual redondeado a 3 decimales (float)

**Ejemplo:**
```python
from Server.utils.get_spot import get_spot_price

spot_price = get_spot_price("AAPL")
print(f"Precio actual: ${spot_price}")
```

### option_quote.py --- Estado: OK

Utilidad para convertir datos de opciones de yfinance a objetos tipados.

**Función:** `row_to_option_quote(row) -> OptionQuote`

**Parámetros:**
- `row`: Fila de DataFrame de yfinance con datos de una opción

**Retorna:** Objeto `OptionQuote` con los datos formateados de la opción

**Descripción:**
Convierte una fila de datos obtenidos de yfinance al modelo `OptionQuote`. Calcula automáticamente el precio medio (mid) y formatea la fecha del último trade.

**Ejemplo:**
```python
from Server.utils.option_quote import row_to_option_quote
import yfinance as yf

ticker = yf.Ticker("AAPL")
options = ticker.option_chain("2024-12-20")

# Convertir la primera opción call
first_call = row_to_option_quote(options.calls.iloc[0])
print(f"Strike: ${first_call.strike}")
print(f"Mid: ${first_call.mid}")
```

### risk_free.py --- Estado: OK

Utilidad para obtener la tasa libre de riesgo interpolada para una fecha de vencimiento específica.

**Función:** `get_risk_free_rate(expiration: str) -> float`

**Parámetros:**
- `expiration` (str): Fecha de vencimiento en formato "YYYY-MM-DD"

**Retorna:** Tasa libre de riesgo anualizada (float)

**Descripción:**
Descarga datos de tasas de interés de la Reserva Federal (FRED) y realiza una interpolación lineal para obtener la tasa libre de riesgo correspondiente al tiempo hasta el vencimiento. Utiliza las series de Treasury Bills y Bonds con vencimientos de 1 mes a 30 años.

**Requisitos:**
- Variable de entorno `FRED_API_KEY` configurada en archivo `.env`

**Ejemplo:**
```python
from Server.utils.risk_free import get_risk_free_rate

risk_free_rate = get_risk_free_rate("2025-12-26")
print(f"Tasa libre de riesgo: {risk_free_rate:.4%}")
```

### bs.py --- Estado: OK

Utilidad para cálculos del modelo Black-Scholes, incluyendo precios, volatilidad implícita y griegas.

**Funciones principales:**

**`bs_price_sigma(S: float, K: float, t: float, r: float, option_type: str, sigma: float) -> float`**

Calcula el precio de una opción usando el modelo Black-Scholes.

**Parámetros:**
- `S` (float): Precio spot del subyacente
- `K` (float): Precio de ejercicio (strike)
- `t` (float): Tiempo hasta vencimiento en años
- `r` (float): Tasa libre de riesgo anualizada
- `option_type` (str): Tipo de opción ("call" o "put")
- `sigma` (float): Volatilidad implícita

**Retorna:** Precio teórico de la opción (float)

**`implied_volatility(S, K, t, r, Price, option_type, sigma=0.2, tol=1e-6, max_iter=100)`**

Calcula la volatilidad implícita usando el método de Newton-Raphson.

**Parámetros:**
- `S` (float): Precio spot del subyacente
- `K` (float): Precio de ejercicio
- `t` (float): Tiempo hasta vencimiento en años
- `r` (float): Tasa libre de riesgo
- `Price` (float): Precio de mercado de la opción
- `option_type` (str): Tipo de opción ("call" o "put")
- `sigma` (float): Volatilidad inicial estimada (default: 0.2)
- `tol` (float): Tolerancia de convergencia (default: 1e-6)
- `max_iter` (int): Número máximo de iteraciones (default: 100)

**Retorna:** Volatilidad implícita (float) o None si no converge

**`compute_greeks(S: float, K: float, t: float, r: float, sigma: float, option_type: str) -> OptionGreeks`**

Calcula todas las griegas de una opción.

**Parámetros:**
- `S` (float): Precio spot del subyacente
- `K` (float): Precio de ejercicio
- `t` (float): Tiempo hasta vencimiento en años
- `r` (float): Tasa libre de riesgo
- `sigma` (float): Volatilidad implícita
- `option_type` (str): Tipo de opción ("call" o "put")

**Retorna:** Objeto `OptionGreeks` con delta, gamma, theta, vega y rho

**Funciones auxiliares:**
- `black_scholes_delta(S, K, t, r, sigma, option_type) -> float`: Calcula Delta
- `black_scholes_gamma(S, K, t, r, sigma) -> float`: Calcula Gamma
- `black_scholes_theta(S, K, t, r, sigma, option_type) -> float`: Calcula Theta (por día)
- `black_scholes_vega(S, K, t, r, sigma) -> float`: Calcula Vega
- `black_scholes_rho(S, K, t, r, sigma, option_type) -> float`: Calcula Rho

**Ejemplo:**
```python
from Server.utils.bs import bs_price_sigma, implied_volatility, compute_greeks

# Calcular precio teórico
price = bs_price_sigma(S=100, K=105, t=0.5, r=0.05, option_type="call", sigma=0.25)
print(f"Precio teórico: ${price:.2f}")

# Calcular volatilidad implícita
iv = implied_volatility(S=100, K=105, t=0.5, r=0.05, Price=8.5, option_type="call")
print(f"Volatilidad implícita: {iv:.2%}")

# Calcular griegas
greeks = compute_greeks(S=100, K=105, t=0.5, r=0.05, sigma=0.25, option_type="call")
print(f"Delta: {greeks.delta:.4f}")
print(f"Gamma: {greeks.gamma:.4f}")
print(f"Theta: {greeks.theta:.4f}")
print(f"Vega: {greeks.vega:.4f}")
print(f"Rho: {greeks.rho:.4f}")
```