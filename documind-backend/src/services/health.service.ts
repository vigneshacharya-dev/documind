export interface HealthStatus {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

/**
 * Business logic lives in services: plain functions with no knowledge of
 * Express (no req/res). That makes them reusable and easy to unit test, and
 * it is what lets us lift them into separate microservices later.
 */
export function getHealthStatus(): HealthStatus {
  return {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
