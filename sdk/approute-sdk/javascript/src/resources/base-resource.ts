import type { HttpTransport } from "../transport/http-transport.js";

/**
 * Base class for all API resource groups.
 * Provides access to the underlying HTTP transport.
 */
export abstract class BaseResource {
  protected readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }
}
