import React from 'react';
import { AppBar } from './common';
import { GraphManagement } from './graph-management';

const App: React.FC = () => {
  return (
    <div>
      <AppBar />
      <GraphManagement />
    </div>
  );
};

export default App;
