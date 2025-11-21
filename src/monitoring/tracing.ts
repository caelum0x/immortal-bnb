/**
 * Distributed Tracing with OpenTelemetry
 * Provides request tracing across services
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { trace, context, type Span, SpanStatusCode } from '@opentelemetry/api';

// Dynamic import for Resource to avoid type-only import issues
const ResourceModule = require('@opentelemetry/resources');
const Resource = ResourceModule.Resource;

// Initialize OpenTelemetry SDK
let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 */
export function initializeTracing(): void {
  if (sdk) {
    return; // Already initialized
  }

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  sdk = new NodeSDK({
    resource: Resource.default().merge(Resource.create({
      [SemanticResourceAttributes.SERVICE_NAME]: 'immortal-ai-trading-bot',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    })),
    traceExporter: traceExporter as any,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log('🔍 OpenTelemetry tracing initialized');
}

/**
 * Create a span for an operation
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('immortal-bot');
  const span = tracer.startSpan(name);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  try {
    const result = await context.with(trace.setSpan(context.active(), span), async () => {
      return await fn(span);
    });
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: any) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set span attribute
 */
export function setSpanAttribute(key: string, value: string | number | boolean): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

/**
 * Shutdown tracing
 */
export function shutdownTracing(): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}

// Auto-initialize in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TRACING !== 'false') {
  initializeTracing();
}

