// Re-exports the existing dashboard layout so Dashboard can render it via module routing.
// The actual JSX lives in Dashboard.tsx; this component is a no-op marker.
// Dashboard checks for 'overview' and renders the legacy layout directly.
export {};
