import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CheckIn } from "../types";

interface EmotionChartProps {
  checkIns: CheckIn[];
}

interface DataPoint {
  date: string;
  sentiment: number;
  sadness: number;
  anxiety: number;
}

export default function EmotionChart({ checkIns }: EmotionChartProps) {
  const data: DataPoint[] = [...checkIns]
    .reverse()
    .filter((c) => c.emotion_data)
    .map((c) => ({
      date: new Date(c.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      sentiment: +(c.emotion_data!.sentiment_score * 100).toFixed(0),
      sadness: +(c.emotion_data!.distress_indicators.sadness * 100).toFixed(0),
      anxiety: +(c.emotion_data!.distress_indicators.anxiety * 100).toFixed(0),
    }));

  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No check-in data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <ReferenceLine y={65} stroke="#f87171" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Sentiment"
        />
        <Line
          type="monotone"
          dataKey="sadness"
          stroke="#f87171"
          strokeWidth={1.5}
          dot={{ r: 2 }}
          name="Sadness"
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="anxiety"
          stroke="#fb923c"
          strokeWidth={1.5}
          dot={{ r: 2 }}
          name="Anxiety"
          strokeDasharray="4 2"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
