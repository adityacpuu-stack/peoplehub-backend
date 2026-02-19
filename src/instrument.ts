import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: 'https://7f9a3a835833047755d44f67abbebdef@o4510913967423488.ingest.us.sentry.io/4510913969192960',
  integrations: [nodeProfilingIntegration()],
  environment: process.env.NODE_ENV || 'development',
  enableLogs: true,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',
  sendDefaultPii: true,
});
