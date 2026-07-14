import React from "react";

import { ModuleOnePage } from "./modules/module-one";
import { ModuleTwoPage } from "./modules/module-two";

const MODULE_TWO_HASH_PREFIXES = ["#module-two", "#campaign-management"] as const;

type ActiveModule = "module-one" | "module-two";

function getCurrentHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.toLowerCase();
}

function resolveActiveModule(hash: string): ActiveModule {
  return MODULE_TWO_HASH_PREFIXES.some((prefix) => hash.startsWith(prefix)) ? "module-two" : "module-one";
}

export default function App() {
  const [activeModule, setActiveModule] = React.useState<ActiveModule>(() => resolveActiveModule(getCurrentHash()));

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveModule(resolveActiveModule(getCurrentHash()));
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return activeModule === "module-two" ? <ModuleTwoPage /> : <ModuleOnePage />;
}
