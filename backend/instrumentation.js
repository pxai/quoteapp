const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '(default)';
console.log(`[otel] Starting OpenTelemetry. Endpoint: ${endpoint}, Service: ${process.env.OTEL_SERVICE_NAME || '(unset)'}`);

const traceExporter = new OTLPTraceExporter();
const metricExporter = new OTLPMetricExporter();

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter,
  metricExporter,
});

sdk.start();
console.log('[otel] SDK started.');

const shutdown = () => {
  sdk.shutdown()
    .then(() => console.log('[otel] Shutdown complete.'))
    .catch((err) => console.error('[otel] Shutdown error:', err))
    .finally(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
