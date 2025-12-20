import {
  AlertCircle, TrendingUp, Calendar, DollarSign, Zap, BarChart3, AlertTriangle, CheckCircle
} from 'lucide-react';
import type { Project } from '../types';
import {
  generatePredictions,
  formatCurrency,
  formatDate
} from '../utils/predictiveAnalytics';

interface PredictiveAnalyticsViewProps {
  project: Project | null;
}

export default function PredictiveAnalyticsView({ project }: PredictiveAnalyticsViewProps) {
  if (!project) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Pilih proyek untuk melihat prediksi</p>
      </div>
    );
  }

  const metrics = generatePredictions(project);

  return (
    <div className="space-y-6 p-6">
      {/* Title & Risk Level */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analisis Prediktif</h2>
          <p className="text-gray-600 mt-1">{project.name}</p>
        </div>
        <RiskBadge level={metrics.riskLevel} />
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Progress Realisasi"
          value={`${metrics.currentProgress}%`}
          subtitle={`Target: ${metrics.plannedProgress}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant={metrics.progressDeviation >= 0 ? 'success' : 'warning'}
          footer={
            metrics.progressDeviation >= 0
              ? `${Math.abs(metrics.progressDeviation)}% ahead`
              : `${Math.abs(metrics.progressDeviation)}% behind`
          }
        />

        <MetricCard
          title="Perkiraan Penyelesaian"
          value={formatDate(metrics.estimatedCompletionDate)}
          subtitle={`Target: ${formatDate(metrics.originalEndDate)}`}
          icon={<Calendar className="w-6 h-6" />}
          variant={metrics.daysDelay <= 0 ? 'success' : 'warning'}
          footer={
            metrics.daysDelay === 0
              ? 'On schedule'
              : metrics.daysDelay > 0
              ? `Delay ${metrics.daysDelay} hari`
              : `Ahead ${Math.abs(metrics.daysDelay)} hari`
          }
        />

        <MetricCard
          title="Varian Biaya"
          value={`${metrics.costVariance.toFixed(1)}%`}
          subtitle={`Budget: ${formatCurrency(metrics.totalBudget)}`}
          icon={<DollarSign className="w-6 h-6" />}
          variant={metrics.costVariance <= 0 ? 'success' : 'warning'}
          footer={`Proyeksi: ${formatCurrency(metrics.totalProjected)}`}
        />
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analisis Biaya
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-gray-600">Budget Kontrak</span>
            <span className="font-semibold">{formatCurrency(metrics.totalBudget)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-gray-600">Pengeluaran Actual</span>
            <span className="font-semibold">{formatCurrency(metrics.totalSpent)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-gray-600">Proyeksi Total</span>
            <span className="font-semibold text-lg">{formatCurrency(metrics.totalProjected)}</span>
          </div>
          <div className="pt-2 flex justify-between items-center bg-gray-50 p-2 rounded">
            <span className="font-semibold">Varian</span>
            <span className={`font-bold text-lg ${metrics.costVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.costVariance > 0 ? '+' : ''}{metrics.costVariance.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Prediksi Arus Kas (8 Minggu)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Minggu</th>
                <th className="text-right py-2">Cashout</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {metrics.weeklyForecast.map((week) => (
                <tr key={week.week} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <div className="font-semibold">W{week.week}</div>
                    <div className="text-xs text-gray-500">{formatDate(week.date)}</div>
                  </td>
                  <td className="text-right py-2 text-red-600">
                    -{formatCurrency(week.projectedCashOut).replace('Rp', '').trim()}
                  </td>
                  <td className="text-right py-2 text-green-600">
                    +{formatCurrency(week.projectedRevenue).replace('Rp', '').trim()}
                  </td>
                  <td className="text-right py-2">
                    <span className={week.projectedBalance < 0 ? 'text-red-600 font-semibold' : ''}>
                      {formatCurrency(week.projectedBalance).replace('Rp', '').trim()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Rekomendasi & Aksi
        </h3>
        {metrics.recommendedActions.map((action, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              action.includes('🔴')
                ? 'bg-red-50 border-red-500'
                : action.includes('🟡')
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-green-50 border-green-500'
            }`}
          >
            <p className="text-sm">{action}</p>
          </div>
        ))}
      </div>

      {/* Legend & Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">ℹ️ Catatan Prediksi</h4>
        <ul className="text-xs space-y-1 text-gray-700">
          <li>• <strong>Progress Deviation:</strong> Selisih antara progress realisasi vs rencana</li>
          <li>• <strong>Cost Variance:</strong> Persentase deviasi biaya proyeksi terhadap budget</li>
          <li>• <strong>Risk Level:</strong> Berdasarkan kombinasi delay dan cost overrun</li>
          <li>• <strong>Forecast:</strong> Proyeksi linear berdasarkan spending rate historis</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Reusable Metric Card Component
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'neutral',
  footer
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'neutral';
  footer?: string;
}) {
  const variantClasses = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    neutral: 'bg-gray-50 border-gray-200'
  };

  const iconColorClasses = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`${iconColorClasses[variant]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-600 mb-2">{subtitle}</div>}
      {footer && <div className="text-xs font-semibold text-gray-700">{footer}</div>}
    </div>
  );
}

/**
 * Risk Level Badge
 */
function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const variants = {
    low: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertTriangle className="w-4 h-4" /> },
    high: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-4 h-4" /> }
  };

  const variant = variants[level];

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${variant.bg} ${variant.text} font-semibold`}>
      {variant.icon}
      <span>Risk: {level.toUpperCase()}</span>
    </div>
  );
}
