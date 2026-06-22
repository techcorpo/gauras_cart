'use client';
import FodderShell from '../../../components/FodderShell';
import Metric from '../../../components/Metric';
import { useUI } from '../../../components/Providers';
export default function ManufacturerDashboard() {
  const { t } = useUI();
  return (
    <FodderShell role="manufacturer" title="Manufacturer Dashboard" description="Track distributor orders, capacity and receivables.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Distributor Orders" value="—" tone="green" />
        <Metric label="Total PO Value" value="—" tone="blue" />
        <Metric label={t('Products')} value="—" tone="amber" />
        <Metric label="Receivables" value="—" tone="rose" />
      </div>
    </FodderShell>
  );
}
