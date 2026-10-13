import type { ErrorRequestHandler } from 'express';
import { isProduction } from '../config/env';
import { AppError } from '../utils/AppError';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * The ONE place where errors become HTTP responses.
 * Express recognises an error handler by its 4 parameters, so keep `_next`
 * even though it is unused. It must be registered LAST.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // If headers were already sent we can't change the response; let Express close it.
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) {
    ({ statusCode, code, message, details } = err);
  } else if (isBodyParserError(err)) {
    // e.g. malformed JSON body or payload too large: the client's fault, not ours.
    statusCode = err.status;
    code = err.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST';
    message = err.type === 'entity.parse.failed' ? 'Request body is not valid JSON' : err.message;
  }

  // 5xx = our bug: log loudly with the stack. 4xx = client mistake: the
  // request logger already records it as a warning, so no extra log here.
  if (statusCode >= 500) {
    req.log.error({ err }, 'Unhandled error');
  }

  const body: ErrorBody = {
    error: { code, message, requestId: String(req.id) },
  };
  if (details !== undefined) body.error.details = details;
  // Stack traces help us in development and help attackers in production.
  if (!isProduction && statusCode >= 500 && err instanceof Error) body.error.stack = err.stack;

  res.status(statusCode).json(body);
};

function isBodyParserError(err: unknown): err is { status: number; type: string; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number' &&
    'type' in err
  );
}
