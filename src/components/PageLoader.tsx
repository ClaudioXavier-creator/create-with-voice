import React from "react";

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
    <p className="text-sm font-medium text-muted-foreground animate-pulse">
      Carregando módulo...
    </p>
  </div>
);

export default PageLoader;
