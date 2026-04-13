import DashboardClient from "./DashboardClient";
import { getDashboardMetrics, getSmartReorderSuggestions, getStockAnalytics } from "../actions/dashboard";

export default async function DashboardRoot() {
  const [metrics, suggestions, analytics] = await Promise.all([
    getDashboardMetrics(),
    getSmartReorderSuggestions(),
    getStockAnalytics(),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening with your inventory today.</p>
      </div>

      <DashboardClient 
        metrics={metrics} 
        suggestions={suggestions} 
        analytics={analytics} 
      />
    </div>
  );
}
