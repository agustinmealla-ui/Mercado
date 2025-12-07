# 📊 MERCADO - Sistema de Análisis de Opciones Financieras

> Sistema completo de análisis cuantitativo de opciones financieras con cálculo en tiempo real usando el modelo Black-Scholes

---

## 📋 Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Integración con Claude Desktop](#-integración-con-claude-desktop)
- [Ejecución](#-ejecución)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Características](#-características)
- [API Endpoints](#-api-endpoints)
- [Solución de Problemas](#-solución-de-problemas)
- [Desarrollo](#-desarrollo)

---

## 🔧 Requisitos Previos

### Backend
- **Python** >= 3.10
- **pip** o **uv** (gestor de paquetes Python)

### Frontend
- **Node.js** >= 16
- **npm** o **yarn**

### API Keys
- **FRED API Key**: Requerida para obtener tasas libres de riesgo
  - 🔗 [Obtener API Key](https://fred.stlouisfed.org/docs/api/api_key.html)

---

## 📦 Instalación

### 1️⃣ Backend (Server)

```bash
# Navegar al directorio del servidor
cd Server

# Instalar con uv (recomendado)
uv pip install -e .

# O con pip
pip install -e .
```

### 2️⃣ Frontend (Opciones)

```bash
# Navegar al directorio del frontend
cd Opciones

# Instalar dependencias
npm install

```

---

## ⚙️ Configuración

### Backend - Variables de Entorno

1. Crear archivo `.env` en el directorio `Server`:

```bash
# Linux/Mac
cd Server
touch .env

# Windows
cd Server
type nul > .env
```

2. Agregar tu FRED API Key:

```env
FRED_API_KEY='tu-api-key-aqui'
```

### Frontend - Variables de Entorno (Opcional)

Crear archivo `.env` en el directorio `Opciones`:

```env
VITE_API_URL=http://localhost:8000
```

---

## 🤖 Integración con Claude Desktop

El servidor MCP (Model Context Protocol) permite integrar las herramientas de análisis de opciones directamente en Claude Desktop.

### Configuración del Servidor MCP

#### 1️⃣ Ubicación del Archivo de Configuración

El archivo de configuración de Claude Desktop se encuentra en:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```
Ruta completa típica: `C:\Users\TuUsuario\AppData\Roaming\Claude\claude_desktop_config.json`

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

#### 2️⃣ Configurar el Servidor

Editar el archivo `claude_desktop_config.json` y agregar la siguiente configuración:

**Para Windows:**
```json
{
  "mcpServers": {
    "mcp-opciones-mercado": {
      "command": "uv",
      "args": [
        "--directory",
        "c:/MERCADO/MERCADO/Server",
        "run",
        "python",
        "main.py"
      ],
      "env": {
        "FRED_API_KEY": "tu-api-key-aqui"
      }
    }
  }
}
```

**Para macOS/Linux:**
```json
{
  "mcpServers": {
    "mcp-opciones-mercado": {
      "command": "uv",
      "args": [
        "--directory",
        "/ruta/completa/a/MERCADO/Server",
        "run",
        "python",
        "main.py"
      ],
      "env": {
        "FRED_API_KEY": "tu-api-key-aqui"
      }
    }
  }
}
```

> ⚠️ **Importante:** Reemplazar `tu-api-key-aqui` con tu FRED API Key real

#### 3️⃣ Ajustar la Ruta del Proyecto

Reemplazar la ruta del directorio según tu instalación:

```json
// Windows - Ejemplos:
"c:/MERCADO/MERCADO/Server"
"c:/Users/TuUsuario/Documents/MERCADO/Server"
"D:/Proyectos/MERCADO/Server"

// macOS/Linux - Ejemplos:
"/Users/tuusuario/MERCADO/Server"
"/home/tuusuario/proyectos/MERCADO/Server"
```

#### 4️⃣ Verificar la Instalación de UV

Asegurarse de que `uv` esté instalado y accesible desde la línea de comandos:

```bash
# Verificar instalación
uv --version

# Si no está instalado, instalarlo con:
pip install uv
# O en macOS/Linux:
curl -LsSf https://astral.sh/uv/install.sh |
---

## 🎯 Características

### Backend (Server)

#### 🛠️ Herramientas de Análisis

| Herramienta | Descripción |
|-------------|-------------|
| `get_expiration` | Obtener fechas de vencimiento disponibles |
| `get_option_chain` | Cadena completa de opciones (calls/puts) |
| `compute_greeks_chain` | Calcular griegas para toda la cadena |
| `get_implied_distribution` | Distribución implícita de probabilidad |
| `compute_option_payoff` | Perfil de payoff de estrategias |
| `get_historical_prices` | Precios históricos del subyacente |

####  Características Técnicas

- Modelo **Black-Scholes** para valoración de opciones
-  Integración con **Yahoo Finance** (yfinance)
-  Tasas libres de riesgo desde **FRED** (Federal Reserve)

### Frontend (Opciones)

#### 📑 Pestañas Principales

1. **Option Chain** - Visualización completa de la cadena de opciones
2. **Distribution** - Distribución de probabilidad implícita
3. **Payoff** - Constructor de estrategias y perfiles de payoff
4. **Builder** - Constructor de prompt

---

## 🔌 API Endpoints

### Backend API (Puerto 8000)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/mcp/call-tool` | Llamar cualquier herramienta de análisis |
| `GET` | `/health` | Health check del servidor |
| `GET` | `/docs` | Documentación Swagger interactiva |
| `GET` | `/redoc` | Documentación ReDoc |

#### Ejemplo de Request

```bash
curl -X POST "http://localhost:8000/api/mcp/call-tool" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_option_chain",
    "arguments": {
      "ticker": "AAPL",
      "expiration": "2024-01-19"
    }
  }'
```

---

## 🔍 Solución de Problemas

### Backend

#### ❌ Error: "FRED_API_KEY not found"

**Solución:**
```bash
# Verificar que .env existe en Server/
cd Server
cat .env  # Linux/Mac
type .env # Windows

# Debe contener:
# FRED_API_KEY='tu-api-key-real'
```

#### ❌ Error: "Module not found"

**Solución:**
```bash
cd Server
uv pip install -e .
# O reinstalar todas las dependencias
pip install --force-reinstall -e .
```

#### ❌ Puerto 8000 ocupado

**Solución:**
```bash
# Cambiar puerto en api_server.py
uvicorn.run(app, host="0.0.0.0", port=8001)

# O liberar el puerto (Linux/Mac)
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend

#### ❌ Error: "Failed to fetch"

**Solución:**
1. Verificar que el backend esté corriendo en `http://localhost:8000`
2. Revisar archivo `.env` si existe:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. Verificar CORS en el backend

#### ❌ Puerto 5173 ocupado

**Solución:**
```bash
# El puerto se asignará automáticamente al siguiente disponible
npm run dev -- --port 5174
```

#### ❌ Dependencias desactualizadas

**Solución:**
```bash
# Actualizar todas las dependencias
npm update

# O reinstalar
rm -rf node_modules package-lock.json
npm install
```

---




### Metodología de Desarrollo

#### Backend
- **Todas las tools** desarrolladas manualmente por mi en `core/tools/`
- **Modelos** definidos en `model/` creados por mi.
- **Utilidades** en `utils/` creados por mi.
- ⚠️ **Única tool generada por IA:** `get_historical_prices.py`

#### Frontend
- 🤖 **Completamente generado por IA**
- 🔗 **Conecta con backend** a través de `api_server.py`
- 📡 **Comunicación REST API** vía `/api/mcp/call-tool`

---

##  Notas Importantes

- Los datos de opciones tienen un delay de ~15 minutos (Yahoo Finance)
- Las tasas libres de riesgo se actualizan diariamente desde FRED
---

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

---

## 📧 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.

---

<div align="center">

**Hecho con ❤️ para análisis cuantitativo de opciones**

[⬆ Volver arriba](#-mercado---sistema-de-análisis-de-opciones-financieras)

</div>