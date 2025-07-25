// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c2e4f74076c10c7b76ca1124addce710@o4509650891964416.ingest.de.sentry.io/4509650896552016",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Privacy configuration - only mask sensitive information on specific pages
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
      
      // Mask sensitive elements that should always be protected
      mask: [
        // Always mask password fields regardless of page
        'input[type="password"]',
        // Mask any elements with sensitive data classes
        '.sensitive-data',
        '.api-key',
        '.credit-card',
        '.ssn',
        '.personal-info'
      ],
      
      // Block sensitive elements that should never be recorded
      block: [
        // Always block password fields
        'input[type="password"]',
        // Block any elements marked as sensitive
        '[data-sentry-block]',
        '.sentry-block'
      ],
      
      // Ignore events on sensitive input fields
      ignore: [
        // Ignore events on password fields
        'input[type="password"]',
        // Ignore events on any elements marked as sensitive
        '[data-sentry-ignore]',
        '.sentry-ignore'
      ]
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;