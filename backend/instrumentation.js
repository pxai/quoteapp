const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const pino = require('pino');

const logger = pino();

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '(default)';
logger.info({ endpoint, service: process.env.OTEL_SERVICE_NAME || '(unset)' }, 'otel starting');

const traceExporter = new OTLPTraceExporter();
const metricExporter = new OTLPMetricExporter();

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter,
  metricExporter,
});

sdk.start();
logger.info('otel sdk started');

const shutdown = () => {
  sdk.shutdown()
    .then(() => logger.info('otel shutdown complete'))
    .catch((err) => logger.error({ err: err.message }, 'otel shutdown error'))
    .finally(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
