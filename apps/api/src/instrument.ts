import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export default function instrument() {
  // Ensure to call this before importing any other modules!
  Sentry.init({
    dsn: 'https://f2ea53f41c72ce8adc8f149ea5ea86a0@o4507338997825536.ingest.de.sentry.io/4508108993855568',
    integrations: [
      // Add our Profiling integration
      nodeProfilingIntegration(),
    ],

    // Add Tracing by setting tracesSampleRate
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Set sampling rate for profiling
    // This is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    enabled: process.env.NODE_ENV === 'production',
  });
}
