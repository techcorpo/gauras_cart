'use client';
import FodderShell from '../../../components/FodderShell';
import Metric from '../../../components/Metric';
import { useUI } from '../../../components/Providers';
export default function DistributorDashboard() {
  const { t } = useUI();
  return (
    <FodderShell role="distributor" title="Distributor Dashboard" description="Aggregate farmer demand and order from manufacturers.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Farmer Orders" value="—" tone="green" />
        <Metric label="Receivables" value="—" tone="blue" />
        <Metric label="Purchase Orders" value="—" tone="amber" />
        <Metric label="Payable" value="—" tone="rose" />
      </div>
    </FodderShell>
  );
}
