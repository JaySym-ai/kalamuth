import { NextResponse } from "next/server";
import { debug_error } from "@/utils/debug";

/**
 * Standard error response for unauthorized requests
 * Use this in API routes when authentication fails
 * 
 * @example
 * ```typescript
 * if (!user) {
 *   return unauthorizedResponse();
 * }
 * ```
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/**
 * Standard error response for bad requests (400)
 * 
 * @param message - Error message to return
 * @example
 * ```typescript
 * if (!requiredParam) {
 *   return badRequestResponse("Missing required parameter");
 * }
 * ```
 */
export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Standard error response for not found (404)
 * 
 * @param resource - Name of the resource that wasn't found
 * @example
 * ```typescript
 * if (!gladiator) {
 *   return notFoundResponse("gladiator");
 * }
 * ```
 */
export function notFoundResponse(resource: string) {
  return NextResponse.json({ error: `${resource}_not_found` }, { status: 404 });
}

/**
 * Standard error response for internal server errors (500)
 * Logs the error and returns a generic error message
 * 
 * @param error - The error that occurred
 * @param context - Context string for logging (e.g., "Failed to create ludus")
 * @example
 * ```typescript
 * } catch (error) {
 *   return internalErrorResponse(error, "Failed to create ludus");
 * }
 * ```
 */
export function internalErrorResponse(error: unknown, context: string) {
  debug_error(`${context}:`, error);
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: "internal_error" },
    { status: 500 }
  );
}

/**
 * Handle API errors with consistent error responses
 * This is a convenience function that handles both auth and internal errors
 * 
 * @param error - The error that occurred
 * @param context - Context string for logging
 * @returns Appropriate NextResponse based on error type
 * 
 * @example
 * ```typescript
 * } catch (error) {
 *   return handleAPIError(error, "Failed to fetch gladiators");
 * }
 * ```
 */
export function handleAPIError(error: unknown, context: string) {
  // Check if it's an unauthorized error from requireAuthAPI
  if (error instanceof Error && error.message === "unauthorized") {
    return unauthorizedResponse();
  }
  
  // Otherwise, treat as internal error
  return internalErrorResponse(error, context);
}

