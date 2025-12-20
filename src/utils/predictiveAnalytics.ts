import type { Project, RABItem, Transaction } from '../types';

export interface PredictionMetrics {
  currentProgress: number;
  plannedProgress: number;
  progressDeviation: number; // % - bisa negative (delay) atau positive (ahead)
  estimatedCompletionDate: string;
  originalEndDate: string;
  daysDelay: number; // negative = ahead, positive = delayed
  
  // Cost prediction
  totalBudget: number;
  totalSpent: number;
  totalProjected: number; // Spent + remaining projection
  costVariance: number; // % - negative = under budget, positive = over budget
  riskLevel: 'low' | 'medium' | 'high'; // Based on variance
  
  // Cash flow forecast
  weeklyForecast: WeeklyForecast[];
  recommendedActions: string[];
}

export interface WeeklyForecast {
  week: number;
  date: string;
  projectedCashOut: number;
  projectedRevenue: number;
  projectedBalance: number;
}

/**
 * Calculate current progress from RAB items
 */
export function calculateCurrentProgress(rabItems: RABItem[]): number {
  if (rabItems.length === 0) return 0;
  const totalProgress = rabItems.reduce((sum, item) => sum + item.progress, 0);
  return Math.round((totalProgress / rabItems.length) * 100) / 100;
}

/**
 * Calculate planned progress based on timeline
 */
export function calculatePlannedProgress(
  startDate: string,
  endDate: string,
  currentDate: string = new Date().toISOString().split('T')[0]
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(currentDate);
  
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.min(100, Math.round((elapsedDays / totalDays) * 100 * 100) / 100);
}

/**
 * Predict completion date based on current progress rate
 */
export function predictCompletionDate(
  startDate: string,
  currentProgress: number,
  currentDate: string = new Date().toISOString().split('T')[0]
): string {
  if (currentProgress <= 0) return new Date().toISOString().split('T')[0];
  
  const start = new Date(startDate);
  const current = new Date(currentDate);
  
  const elapsedDays = (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const remainingProgress = 100 - currentProgress;
  const progressPerDay = currentProgress / Math.max(1, elapsedDays);
  
  if (progressPerDay <= 0) return new Date(current.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const remainingDays = remainingProgress / progressPerDay;
  const completionDate = new Date(current.getTime() + remainingDays * 24 * 60 * 60 * 1000);
  
  return completionDate.toISOString().split('T')[0];
}

/**
 * Calculate cost projection based on spending pattern
 */
export function calculateCostProjection(
  budget: number,
  transactions: Transaction[],
  currentProgress: number
): { totalSpent: number; projectedTotal: number; variance: number } {
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Linear projection: if we're at X% progress with Y spent, project Z total cost
  const projectedTotal = currentProgress > 0 ? (totalSpent / currentProgress) * 100 : budget;
  const variance = projectedTotal > 0 ? ((projectedTotal - budget) / budget) * 100 : 0;
  
  return {
    totalSpent,
    projectedTotal: Math.round(projectedTotal),
    variance: Math.round(variance * 100) / 100
  };
}

/**
 * Generate risk level based on cost variance
 */
export function assessRiskLevel(costVariance: number, progressDeviation: number): 'low' | 'medium' | 'high' {
  // Risk factors:
  // 1. Cost variance > 10% = higher risk
  // 2. Progress deviation (delay) > 10% = higher risk
  
  const costRisk = Math.abs(costVariance);
  const scheduleRisk = Math.abs(progressDeviation);
  const combinedRisk = (costRisk + scheduleRisk) / 2;
  
  if (combinedRisk > 20) return 'high';
  if (combinedRisk > 10) return 'medium';
  return 'low';
}

/**
 * Generate weekly cash flow forecast (8 weeks)
 */
export function generateWeeklyCashFlowForecast(
  project: Project,
  currentDate: string = new Date().toISOString().split('T')[0]
): WeeklyForecast[] {
  const forecast: WeeklyForecast[] = [];
  const transactions = project.transactions || [];
  
  // Calculate average weekly spend
  const recentTransactions = transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const txDate = new Date(t.date);
      const sevenWeeksAgo = new Date(currentDate);
      sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);
      return txDate >= sevenWeeksAgo;
    });
  
  const avgWeeklySpend = recentTransactions.length > 0
    ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / 8
    : 0;
  
  // Calculate average weekly revenue from payment terms
  const paymentTerms = project.paymentTerms || [];
  const totalRevenue = paymentTerms.reduce((sum, term) => sum + (term.amount || 0), 0);
  const remainingDays = new Date(project.endDate).getTime() - new Date(currentDate).getTime();
  const remainingWeeks = Math.max(1, Math.ceil(remainingDays / (7 * 24 * 60 * 60 * 1000)));
  const avgWeeklyRevenue = totalRevenue / remainingWeeks;
  
  // Current balance
  const totalReceived = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  let currentBalance = totalReceived - totalSpent;
  
  // Generate 8 weeks forecast
  for (let week = 1; week <= 8; week++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(weekDate.getDate() + week * 7);
    
    const weekForecast: WeeklyForecast = {
      week,
      date: weekDate.toISOString().split('T')[0],
      projectedCashOut: Math.round(avgWeeklySpend),
      projectedRevenue: Math.round(avgWeeklyRevenue),
      projectedBalance: 0
    };
    
    currentBalance += weekForecast.projectedRevenue - weekForecast.projectedCashOut;
    weekForecast.projectedBalance = Math.round(currentBalance);
    
    forecast.push(weekForecast);
  }
  
  return forecast;
}

/**
 * Generate actionable recommendations
 */
export function generateRecommendations(
  progress: number,
  plannedProgress: number,
  costVariance: number,
  daysDelay: number,
  currentBalance: number
): string[] {
  const recommendations: string[] = [];
  
  // Schedule recommendations
  if (daysDelay > 14) {
    recommendations.push('⚠️ Proyek terlambat >14 hari. Pertimbangkan tambah manpower atau lembur.');
  } else if (daysDelay > 7) {
    recommendations.push('⚠️ Proyek terlambat >7 hari. Tingkatkan monitoring dan koordinasi tim.');
  } else if (progress > plannedProgress + 5) {
    recommendations.push('✅ Proyek ahead of schedule! Pertahankan momentum ini.');
  }
  
  // Cost recommendations
  if (costVariance > 15) {
    recommendations.push('🔴 Cost overrun >15%. Audit pengeluaran dan tinjau scope work.');
  } else if (costVariance > 5) {
    recommendations.push('🟡 Cost overrun 5-15%. Monitor ketat expense categories.');
  } else if (costVariance < -10) {
    recommendations.push('✅ Project under budget >10%. Pertahankan efisiensi cost.');
  }
  
  // Cash flow recommendations
  if (currentBalance < 0) {
    recommendations.push('🔴 CASH FLOW NEGATIF! Percepat invoice klien atau koordinasi pembayaran termin.');
  } else if (currentBalance < 50000000) { // Less than 50M IDR
    recommendations.push('⚠️ Cash position tight. Jaga likuiditas dan monitor outflow.');
  }
  
  // If no issues detected
  if (recommendations.length === 0) {
    recommendations.push('✅ Proyek berjalan normal. Terus monitor metrik utama.');
  }
  
  return recommendations;
}

/**
 * Main function: Generate comprehensive prediction metrics
 */
export function generatePredictions(project: Project): PredictionMetrics {
  const today = new Date().toISOString().split('T')[0];
  
  // Progress metrics
  const currentProgress = calculateCurrentProgress(project.rabItems || []);
  const plannedProgress = calculatePlannedProgress(project.startDate, project.endDate, today);
  const progressDeviation = currentProgress - plannedProgress;
  
  // Completion date prediction
  const estimatedCompletionDate = predictCompletionDate(project.startDate, currentProgress, today);
  const originalEndDate = project.endDate;
  const daysDelay = Math.round(
    (new Date(estimatedCompletionDate).getTime() - new Date(originalEndDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Cost projection
  const budget = project.contractValue || project.budgetLimit || 0;
  const costData = calculateCostProjection(budget, project.transactions || [], currentProgress);
  const costVariance = costData.variance;
  const riskLevel = assessRiskLevel(costVariance, progressDeviation);
  
  // Cash flow forecast
  const weeklyForecast = generateWeeklyCashFlowForecast(project, today);
  
  // Current balance for recommendations
  const totalReceived = (project.transactions || [])
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = costData.totalSpent;
  const currentBalance = totalReceived - totalSpent;
  
  // Recommendations
  const recommendedActions = generateRecommendations(
    currentProgress,
    plannedProgress,
    costVariance,
    daysDelay,
    currentBalance
  );
  
  return {
    currentProgress: Math.round(currentProgress * 100) / 100,
    plannedProgress: Math.round(plannedProgress * 100) / 100,
    progressDeviation: Math.round(progressDeviation * 100) / 100,
    estimatedCompletionDate,
    originalEndDate,
    daysDelay,
    
    totalBudget: budget,
    totalSpent: costData.totalSpent,
    totalProjected: costData.projectedTotal,
    costVariance,
    riskLevel,
    
    weeklyForecast,
    recommendedActions
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
