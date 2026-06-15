import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ProProvider } from "@/hooks/use-pro";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import TimeCost from "@/pages/time-cost";
import WhatIf from "@/pages/what-if";
import Mood from "@/pages/mood";
import Dna from "@/pages/dna";
import Regret from "@/pages/regret";
import Settings from "@/pages/settings";
import Upgrade from "@/pages/upgrade";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/time-cost" component={TimeCost} />
        <Route path="/what-if" component={WhatIf} />
        <Route path="/mood" component={Mood} />
        <Route path="/dna" component={Dna} />
        <Route path="/regret" component={Regret} />
        <Route path="/settings" component={Settings} />
        <Route path="/upgrade" component={Upgrade} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ProProvider>
            <Router />
          </ProProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
