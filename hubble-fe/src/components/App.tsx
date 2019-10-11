import React from 'react';
import { Route } from 'wouter';
import { AppBar } from './common';
import { GraphManagement, DataAnalyze } from './graph-management';

const App: React.FC = () => {
  return (
    <div>
      <AppBar />
      <Route
        path="/graph-management/:id/data-analyze"
        component={DataAnalyze}
      />
      <Route path="/graph-management" component={GraphManagement} />
      <Route path="/" component={GraphManagement} />
    </div>
  );
};

export default App;
