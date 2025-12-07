/**
 * BuilderTab Component - API call builder and tester
 */

import { useState } from 'react';
import { mcpClient } from '../../api/mcpClient';
import { Play, Copy, Check } from 'lucide-react';

// Definiciones de herramientas con esquemas de parámetros
const TOOLS = {
  get_expirations: {
    name: 'Obtener Vencimientos',
    description: 'Obtiene todas las fechas de vencimiento disponibles para un ticker',
    parameters: [
      { name: 'underlying', type: 'text', label: 'Subyacente', placeholder: 'AAPL', required: true },
    ],
  },
  get_chain: {
    name: 'Obtener Cadena de Opciones',
    description: 'Obtiene la cadena de opciones (calls y puts) para un vencimiento específico',
    parameters: [
      { name: 'underlying', type: 'text', label: 'Subyacente', placeholder: 'AAPL', required: true },
      { name: 'expiration', type: 'text', label: 'Vencimiento', placeholder: '2024-01-19', required: true },
    ],
  },
  compute_greeks: {
    name: 'Calcular Griegas',
    description: 'Calcula las griegas para todas las opciones en un vencimiento específico',
    parameters: [
      { name: 'underlying', type: 'text', label: 'Subyacente', placeholder: 'AAPL', required: true },
      { name: 'expiration', type: 'text', label: 'Vencimiento', placeholder: '2024-01-19', required: true },
    ],
  },
  get_distribution: {
    name: 'Obtener Distribución de Probabilidad',
    description: 'Extrae la distribución de probabilidad implícita de los precios de opciones',
    parameters: [
      { name: 'underlying', type: 'text', label: 'Subyacente', placeholder: 'AAPL', required: true },
      { name: 'expiration', type: 'text', label: 'Vencimiento', placeholder: '2024-01-19', required: true },
      { name: 'min_moneyness', type: 'number', label: 'Moneyness Mín', placeholder: '0.7', required: false, defaultValue: '0.7' },
      { name: 'max_moneyness', type: 'number', label: 'Moneyness Máx', placeholder: '1.3', required: false, defaultValue: '1.3' },
    ],
  },
  compute_payoff_profile: {
    name: 'Calcular Perfil de Payoff',
    description: 'Calcula el perfil de payoff para una posición de opciones',
    parameters: [
      { name: 'side', type: 'select', label: 'Lado', options: ['long', 'short'], required: true },
      { name: 'option_type', type: 'select', label: 'Tipo de Opción', options: ['call', 'put'], required: true },
      { name: 'underlying', type: 'text', label: 'Subyacente', placeholder: 'AAPL', required: true },
      { name: 'strike', type: 'number', label: 'Strike', placeholder: '150', required: true },
      { name: 'expiration', type: 'text', label: 'Vencimiento', placeholder: '2024-01-19', required: true },
      { name: 'spot_min', type: 'number', label: 'Spot Mín', placeholder: 'Opcional', required: false },
      { name: 'spot_max', type: 'number', label: 'Spot Máx', placeholder: 'Opcional', required: false },
    ],
  },
  get_historical_prices_tool: {
    name: 'Obtener Precios Históricos',
    description: 'Obtiene datos históricos de precios (OHLCV) para un activo subyacente',
    parameters: [
      { name: 'underlying', type: 'text', label: 'Subyacente', placeholder: 'AAPL', required: true },
      {
        name: 'period',
        type: 'select',
        label: 'Período',
        options: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'],
        required: false,
        defaultValue: '3mo'
      },
      {
        name: 'interval',
        type: 'select',
        label: 'Intervalo',
        options: ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'],
        required: false,
        defaultValue: '1d'
      },
    ],
  },
};

export default function BuilderTab() {
  const [selectedTool, setSelectedTool] = useState('get_expirations');
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const tool = TOOLS[selectedTool];

  const handleToolChange = (toolName) => {
    setSelectedTool(toolName);
    setParameters({});
    setResponse(null);
    setError(null);
  };

  const handleParameterChange = (paramName, value) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Build arguments object
      const args = {};
      tool.parameters.forEach((param) => {
        const value = parameters[param.name];
        if (value !== undefined && value !== '') {
          // Convert to appropriate type
          if (param.type === 'number') {
            args[param.name] = parseFloat(value);
          } else {
            args[param.name] = value;
          }
        } else if (param.required) {
          throw new Error(`El parámetro requerido "${param.label}" falta`);
        }
      });

      // Call the tool
      const result = await mcpClient.callTool(selectedTool, args);
      setResponse({
        request: { tool: selectedTool, arguments: args },
        response: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Selección de Herramienta */}
      <div className="panel-container">
        <div className="panel-header">
          <h2 className="terminal-header">Selección de Herramienta</h2>
        </div>
        <div className="panel-content">
          <select
            value={selectedTool}
            onChange={(e) => handleToolChange(e.target.value)}
            className="input-field w-full text-sm"
          >
            {Object.entries(TOOLS).map(([key, tool]) => (
              <option key={key} value={key}>
                {tool.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-bloomberg-text-muted mt-2">{tool.description}</p>
        </div>
      </div>

      {/* Formulario de Parámetros */}
      <div className="panel-container">
        <div className="panel-header">
          <h2 className="terminal-header">Parámetros</h2>
        </div>
        <div className="panel-content">
          <div className="grid grid-cols-2 gap-4">
            {tool.parameters.map((param) => (
              <div key={param.name}>
                <label className="text-xs text-bloomberg-text-secondary mb-1 block">
                  {param.label}
                  {param.required && <span className="text-bloomberg-financial-negative ml-1">*</span>}
                </label>
                {param.type === 'select' ? (
                  <select
                    value={parameters[param.name] || param.options[0]}
                    onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    className="input-field w-full"
                  >
                    {param.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={param.type}
                    value={parameters[param.name] || param.defaultValue || ''}
                    onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className="input-field w-full"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleExecute}
            disabled={loading}
            className="btn-primary mt-4 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Ejecutando...' : 'Ejecutar Herramienta'}
          </button>
        </div>
      </div>

      {/* Mostrar Error */}
      {error && (
        <div className="panel-container border-bloomberg-financial-negative">
          <div className="panel-header">
            <h2 className="terminal-header text-bloomberg-financial-negative">Error</h2>
          </div>
          <div className="panel-content">
            <div className="bg-bloomberg-bg-tertiary rounded p-3 border border-bloomberg-financial-negative">
              <pre className="text-xs text-bloomberg-financial-negative font-mono whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar Respuesta */}
      {response && (
        <div className="panel-container">
          <div className="panel-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="terminal-header">Respuesta</h2>
                <p className="text-xxs text-bloomberg-text-muted mt-1">
                  {new Date(response.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar JSON
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="panel-content">
            {/* Solicitud */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-bloomberg-text-primary mb-2">Solicitud</h3>
              <div className="bg-bloomberg-bg-tertiary rounded p-3 border border-bloomberg-border overflow-x-auto">
                <pre className="text-xs text-bloomberg-text-secondary font-mono">
                  {JSON.stringify(response.request, null, 2)}
                </pre>
              </div>
            </div>

            {/* Respuesta */}
            <div>
              <h3 className="text-xs font-semibold text-bloomberg-text-primary mb-2">Respuesta</h3>
              <div className="bg-bloomberg-bg-tertiary rounded p-3 border border-bloomberg-border overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs text-bloomberg-accent-blue font-mono">
                  {JSON.stringify(response.response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Texto de Ayuda */}
      {!response && !error && (
        <div className="panel-container">
          <div className="panel-header">
            <h2 className="terminal-header">Primeros Pasos</h2>
          </div>
          <div className="panel-content">
            <div className="text-xs text-bloomberg-text-secondary space-y-2">
              <p>1. Selecciona una herramienta del menú desplegable</p>
              <p>2. Completa los parámetros requeridos (marcados con *)</p>
              <p>3. Haz clic en "Ejecutar Herramienta" para llamar a la API</p>
              <p>4. Ve la solicitud y respuesta JSON abajo</p>
              <p>5. Copia el JSON al portapapeles usando el botón copiar</p>
            </div>
            <div className="mt-4 pt-4 border-t border-bloomberg-border">
              <h3 className="text-xs font-semibold text-bloomberg-text-primary mb-2">Herramientas Disponibles</h3>
              <ul className="text-xs text-bloomberg-text-muted space-y-1">
                {Object.values(TOOLS).map((tool) => (
                  <li key={tool.name}>• {tool.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
