import { OperatorFunction, catchError, of, timeout } from 'rxjs';

const REQUEST_TIMEOUT_MS = 10_000;

export function withRequestTimeout<T>(): OperatorFunction<T, T | 'error'> {
  return (source) =>
    source.pipe(
      timeout(REQUEST_TIMEOUT_MS),
      catchError(() => of('error' as const)),
    );
}
