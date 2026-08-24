import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  NONE: '#94a3b8',
};

export default function TasksByPriorityChart({ data = [] }: { data: Array<{ priority: string; count: number }> }) {
  const chartData = data.length > 0 ? data : [
    { priority: 'CRITICAL', count: 1 },
    { priority: 'HIGH', count: 3 },
    { priority: 'MEDIUM', count: 4 },
    { priority: 'LOW', count: 2 },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Tasks by Priority</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="priority" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
