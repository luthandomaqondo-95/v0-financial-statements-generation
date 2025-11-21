"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ChartData {
  type: "bar" | "line" | "pie"
  data: any[]
  xAxisKey?: string
  dataKeys: string[]
  colors?: string[]
  title?: string
  height?: number
}

interface FinancialChartProps {
  config: ChartData
}

const DEFAULT_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed"]

export function FinancialChart({ config }: FinancialChartProps) {
  const { type, data, xAxisKey = "name", dataKeys, colors = DEFAULT_COLORS, title, height = 300 } = config

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              cursor={{ fill: "transparent" }}
            />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        )
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKeys[0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
            <Legend />
          </PieChart>
        )
      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <div className="my-8 p-4 border rounded-lg bg-white shadow-sm break-inside-avoid">
      {title && <h4 className="text-center font-semibold mb-4 text-gray-700">{title}</h4>}
      <div style={{ width: "100%", height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
