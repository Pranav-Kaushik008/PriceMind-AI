import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../api/client';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BatchExecutionDock } from './BatchExecutionDock';
import { CommandPalette } from '../ui/CommandPalette';
import { SKUDetailDrawer } from '../ui/SKUDetailDrawer';
import { EvidenceDrawer } from '../ui/EvidenceDrawer';

// Primary & Secondary Module Pages
import { ExecutiveOverview } from '../../pages/ExecutiveOverview';
import { PriceOptimization } from '../../pages/PriceOptimization';
import { ProductIntelligence } from '../../pages/ProductIntelligence';
import { DemandElasticity } from '../../pages/DemandElasticity';
import { RevenueOptimization } from '../../pages/RevenueOptimization';
import { Customers } from '../../pages/Customers';
import { InventoryDynamics } from '../../pages/InventoryDynamics';
import { CompetitorRadar } from '../../pages/CompetitorRadar';
import { WhatIfSimulator } from '../../pages/WhatIfSimulator';
import { AIAssistant } from '../../pages/AIAssistant';
import { ExplainableAI } from '../../pages/ExplainableAI';
import { Models } from '../../pages/Models';
import { Experiments } from '../../pages/Experiments';
import { Settings } from '../../pages/Settings';
import { AuditLogs } from '../../pages/AuditLogs';

/**
 * Enterprise Application Shell
 * Root frame managing responsive sidebar, minimal top bar, workspace routing, and drawers.
 */
export function AppShell() {
  const {
    activePage,
    setActivePage,
    selectedSkuForDrawer,
    setSelectedSkuForDrawer,
    selectedRecommendationForEvidence,
    setSelectedRecommendationForEvidence,
    currency,
  } = useAppStore();

  const [activeElasticityCurve, setActiveElasticityCurve] = useState([]);

  useEffect(() => {
    if (selectedRecommendationForEvidence) {
      apiClient.getElasticityCurve(selectedRecommendationForEvidence.skuCode).then(setActiveElasticityCurve);
    }
  }, [selectedRecommendationForEvidence]);

  const handleApproveRec = async (id) => {
    await apiClient.updateRecommendationStatus(id, 'approved');
  };

  const handleRejectRec = async (id) => {
    await apiClient.updateRecommendationStatus(id, 'rejected');
  };

  const handleSimulateSku = (sku) => {
    setActivePage('simulator');
  };

  const renderActivePage = () => {
    switch (activePage) {
      // Primary Navigation Routes
      case 'overview':
        return <ExecutiveOverview />;
      case 'pricing':
      case 'price-optimization':
        return <PriceOptimization />;
      case 'products':
      case 'product-intelligence':
        return <ProductIntelligence />;
      case 'demand':
      case 'demand-elasticity':
        return <DemandElasticity />;
      case 'revenue':
        return <RevenueOptimization />;
      case 'customers':
        return <Customers />;
      case 'inventory':
      case 'inventory-dynamics':
        return <InventoryDynamics />;
      case 'competitors':
      case 'competitor-radar':
        return <CompetitorRadar />;
      case 'simulator':
      case 'what-if-simulator':
        return <WhatIfSimulator />;
      case 'assistant':
      case 'ai-assistant':
        return <AIAssistant />;

      // Secondary Navigation Routes
      case 'models':
      case 'explainable-ai':
        return <Models />;
      case 'experiments':
        return <Experiments />;
      case 'settings':
        return <Settings />;
      case 'audit':
      case 'audit-logs':
        return <AuditLogs />;

      default:
        return <ExecutiveOverview />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-pm-bg text-pm-text antialiased">
      {/* Top Bar */}
      <Header />

      {/* Main Workspace Frame with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Institutional Sidebar */}
        <Sidebar />

        {/* Dynamic Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative pb-20 focus:outline-none">
          {renderActivePage()}
        </main>
      </div>

      {/* Batch Execution Dock for ERP Sync */}
      <BatchExecutionDock />

      {/* Global Command Palette (⌘K / Ctrl K) */}
      <CommandPalette />

      {/* SKU Deep Dive Telemetry Drawer */}
      {selectedSkuForDrawer && (
        <SKUDetailDrawer
          sku={selectedSkuForDrawer}
          currency={currency}
          onClose={() => setSelectedSkuForDrawer(null)}
          onSimulate={handleSimulateSku}
        />
      )}

      {/* AI Model Evidence / SHAP Waterfall Drawer */}
      {selectedRecommendationForEvidence && (
        <EvidenceDrawer
          recommendation={selectedRecommendationForEvidence}
          elasticityCurve={activeElasticityCurve}
          currency={currency}
          onClose={() => setSelectedRecommendationForEvidence(null)}
          onApprove={handleApproveRec}
          onReject={handleRejectRec}
        />
      )}
    </div>
  );
}

export default AppShell;
