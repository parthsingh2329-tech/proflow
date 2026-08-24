import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers,
  HelpCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { ProjectBudget, EVMAnalytics } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EVMPerformanceDashboardProps {
  budget: ProjectBudget;
}

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  if (currency === 'INR') {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export default function EVMPerformanceDashboard({ budget }: EVMPerformanceDashboardProps) {
  const analytics: EVMAnalytics = budget.analytics || {
    totalPlannedCost: 0,
    totalCommittedCost: 0,
    totalActualCost: 0,
    remainingBudget: 0,
    projectPercentComplete: 0,
    BAC: budget.approvedBudget,
    PV: 0,
    EV: 0,
    AC: 0,
    CPI: 1.0,
    SPI: 1.0,
    EAC: budget.approvedBudget,
    ETC: 0,
    VAC: 0,
    CV: 0,
    SV: 0,
  };

  const getCpiStatus = (cpi: number) => {
    if (cpi >= 1.0) return { label: 'Under Budget (Cost Efficient)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800' };
    if (cpi >= 0.95) return { label: 'Near Budget Target', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-800' };
    return { label: 'Over Budget Alert', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' };
  };

  const getSpiStatus = (spi: number) => {
    if (spi >= 1.0) return { label: 'Ahead of Schedule', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800' };
    if (spi >= 0.95) return { label: 'On Schedule Track', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-800' };
    return { label: 'Behind Schedule Slippage', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' };
  };

  const cpiStatus = getCpiStatus(analytics.CPI);
  const spiStatus = getSpiStatus(analytics.SPI);

  // Format historical S-curve trend data for Recharts
  const sCurveData = (budget.evmSnapshots || []).map((s) => ({
    name: format(new Date(s.periodDate), 'MMM yyyy'),
    PV: s.pv,
    EV: s.ev,
    AC: s.ac,
    PV_formatted: formatCurrency(s.pv, budget.currency),
    EV_formatted: formatCurrency(s.ev, budget.currency),
    AC_formatted: formatCurrency(s.ac, budget.currency),
  }));

  return (
    <div className="space-y-6">
      {/* Top EVM Indexes (CPI & SPI Gauges) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPI Card */}
        <Card className={`p-5 shadow-sm border ${cpiStatus.bg}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cost Performance Index (CPI)
                </span>
                <span className="font-mono text-[10px] text-slate-400">EV / AC</span>
              </div>
              <div className="flex items-baseline space-x-3 mt-2">
                <h3 className={`text-4xl font-black ${cpiStatus.color}`}>
                  {analytics.CPI.toFixed(2)}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cpiStatus.bg} ${cpiStatus.color}`}>
                  {cpiStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {analytics.CPI >= 1.0
                  ? `For every ₹1.00 spent, the project delivers ₹${analytics.CPI.toFixed(2)} of earned value.`
                  : `Cost overrun: Generating only ₹${analytics.CPI.toFixed(2)} of value for every ₹1.00 spent.`}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900 shadow-sm">
              <DollarSign className={`h-7 w-7 ${cpiStatus.color}`} />
            </div>
          </div>
        </Card>

        {/* SPI Card */}
        <Card className={`p-5 shadow-sm border ${spiStatus.bg}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Schedule Performance Index (SPI)
                </span>
                <span className="font-mono text-[10px] text-slate-400">EV / PV</span>
              </div>
              <div className="flex items-baseline space-x-3 mt-2">
                <h3 className={`text-4xl font-black ${spiStatus.color}`}>
                  {analytics.SPI.toFixed(2)}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${spiStatus.bg} ${spiStatus.color}`}>
                  {spiStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {analytics.SPI >= 1.0
                  ? `Progressing at ${(analytics.SPI * 100).toFixed(0)}% of the planned schedule baseline.`
                  : `Schedule slippage: Progressing at only ${(analytics.SPI * 100).toFixed(0)}% of scheduled speed.`}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900 shadow-sm">
              <Activity className={`h-7 w-7 ${spiStatus.color}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Budget (BAC) */}
        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Approved Budget (BAC)</span>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(budget.approvedBudget, budget.currency)}
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">
            + {formatCurrency(budget.contingencyReserve, budget.currency)} Contingency Reserve
          </span>
        </Card>

        {/* Earned Value (EV) */}
        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Earned Value (EV)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(analytics.EV, budget.currency)}
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {analytics.projectPercentComplete}% Work Scope Complete
          </span>
        </Card>

        {/* Actual Cost (AC) */}
        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Actual Cost (AC)</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(analytics.totalActualCost, budget.currency)}
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Remaining: {formatCurrency(analytics.remainingBudget, budget.currency)}
          </span>
        </Card>

        {/* Forecast at Completion (EAC) */}
        <Card className="p-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Forecast Cost (EAC)</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(analytics.EAC, budget.currency)}
          </h4>
          <span className={`text-[11px] font-bold mt-1 block ${analytics.VAC >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            VAC: {analytics.VAC >= 0 ? '+' : ''}{formatCurrency(analytics.VAC, budget.currency)}
          </span>
        </Card>
      </div>

      {/* EVM S-Curve Trend Chart */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="h-4 w-4 text-indigo-600 mr-2" />
              EVM S-Curve Performance Tracking (PV vs. EV vs. AC)
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative planned spend baseline (PV) vs. actual physical scope earned (EV) vs. invoiced spend (AC).
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sCurveData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => formatCurrency(val, budget.currency)}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [formatCurrency(Number(val), budget.currency), name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="PV"
                  name="Planned Value (PV Baseline)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="EV"
                  name="Earned Value (EV Delivered)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="AC"
                  name="Actual Cost (AC Incurred)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
