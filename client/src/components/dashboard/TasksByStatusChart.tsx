import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6', '#10b981'];

export default function TasksByStatusChart({ data = [] }: { data: Array<{ name: string; value: number }> }) {
  const chartData = data.length > 0 ? data : [
    { name: 'To Do', value: 3 },
    { name: 'In Progress', value: 2 },
    { name: 'In Review', value: 1 },
    { name: 'Done', value: 4 },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Tasks by Status</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
