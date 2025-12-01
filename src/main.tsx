import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { store } from "../store.ts";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmDialogProvider } from "./Components/ConfirmDialogContext.tsx";
import { AlertDialogProvider } from "./AlertDialogContext.tsx";
const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <StrictMode>
        <ConfirmDialogProvider>
          <AlertDialogProvider>
            <App />
          </AlertDialogProvider>
        </ConfirmDialogProvider>
      </StrictMode>
    </Provider>
  </QueryClientProvider>
);
