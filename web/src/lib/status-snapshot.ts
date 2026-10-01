// Explicitly illustrative incident, preserved from the retired status demo.
// This is not a monitoring feed and must never be shown as a live incident.
export const EXAMPLE_INCIDENT = {
 id: 'INC-0092',
 title: 'Hardware Boundary elevated verification latency',
 status: 'monitoring',
 started: '2026-09-29T17:12:00Z',
 updated: '2026-09-29T20:04:00Z',
 body: 'The example illustrates a verification-latency incident and a monitoring update. It is demo content, not a current service event.',
} as const;
