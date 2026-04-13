import Link from "next/link";
import { ArrowRight, Package, ShoppingCart, BarChart3, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold tracking-tight text-slate-900">InventoryForge</span>
            </div>
            <div>
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            SME Inventory Management <span className="text-blue-600">Reimagined</span>.
          </h1>
          <p className="text-lg leading-8 text-slate-600">
            A comprehensive operational hub for your business. Track product stock live, manage B2B sales cycles, and monitor supply chains natively with Server Actions.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:scale-105"
            >
              Enter Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/sales"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50"
            >
              View Sales
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Live Inventory</h3>
            <p className="mt-2 text-sm text-slate-600">Track SKUs, generate QR codes seamlessly, and monitor live stock deductions via real-time hooks.</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="h-12 w-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Sales Orders</h3>
            <p className="mt-2 text-sm text-slate-600">Manage comprehensive B2B order pipelines securely on the backend with edge-cached forms.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="h-12 w-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Analytics (Coming Soon)</h3>
            <p className="mt-2 text-sm text-slate-600">Visualize raw data into actionable manufacturing forecasts and cash influx patterns.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="h-12 w-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <Settings className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Admin Control</h3>
            <p className="mt-2 text-sm text-slate-600">Modify granular role access and export compliance reports globally.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
