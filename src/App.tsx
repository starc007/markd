import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { Toaster } from "sonner";

function App() {
  return (
    <ErrorBoundary>
      <AppShell />
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}

export default App;
