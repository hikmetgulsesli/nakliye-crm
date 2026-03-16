import '@testing-library/jest-dom'

// Polyfill for Next.js 16 Request/Response
// Using native fetch globals which are available in Node.js 18+
if (!global.Request) {
  // @ts-expect-error - Request is available in Node.js 18+
  global.Request = globalThis.Request
}
if (!global.Response) {
  // @ts-expect-error - Response is available in Node.js 18+
  global.Response = globalThis.Response
}
if (!global.Headers) {
  // @ts-expect-error - Headers is available in Node.js 18+
  global.Headers = globalThis.Headers
}
