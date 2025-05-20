import React from 'react';

const Header = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'data', label: 'Base de Dados' },
    { id: 'parameters', label: 'Parâmetros' },
    { id: 'simulation', label: 'Simulação' }
  ];

  return (
    <header className="App-header">
      <h1>Dimensionamento de Picking</h1>
      <div className="nav-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </header>
  );
};

export default Header;
