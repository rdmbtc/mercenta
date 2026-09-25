/**
 * Test support utilities — barrel export.
 *
 * Import from `./support` (or `../support` from nested test dirs):
 * ```ts
 * import { MockTransport, successEnvelope } from "../support/index.js";
 * ```
 */
export { MockTransport } from "./mock-transport.js";
export type { RecordedCall } from "./mock-transport.js";
export { successEnvelope, errorEnvelope, validationErrorEnvelope } from "./envelope.js";
