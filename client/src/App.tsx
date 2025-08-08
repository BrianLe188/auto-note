import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/main/dashboard";
import NotFound from "@/pages/not-found";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { SocketProvider } from "./hooks/use-socket";
import { queryClient } from "./lib/queryClient";
import Login from "./pages/auth/login";
import MeetingDetail from "./pages/main/meeting-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path={"/meetings/:id"} component={MeetingDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
          <AuthProvider>
            <SocketProvider>
              <Router />
            </SocketProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
