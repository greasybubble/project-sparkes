// components/macro-trends-chart.tsx
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { G, Line, Path } from 'react-native-svg';

type Row = { date: string; calories: number }; // keep the same shape you’re already passing

type Props = {
  data: Row[];
  height?: number;

  // scaling options
  scale?: 'percentile' | 'minmax';
  lowerPct?: number;   // used when scale === 'percentile' (default 15)
  upperPct?: number;   // used when scale === 'percentile' (default 85)

  // smoothing (moving average window radius; 0/1 disables)
  smooth?: number;     // default 2 (small smoothing)

  // ticks
  tickCount?: number;  // default 4

  // NEW: rounding controls (defaults tuned for calories; override to 1 for weight)
  yRound?: number;     // default 100
  tickRound?: number;  // default 100

  // styling
  paddingH?: number;   // chart horizontal padding inside svg (default 8)
  paddingV?: number;   // chart vertical padding inside svg (default 8)
  strokeWidth?: number;// line width (default 2)
  stroke?: string;     // line colour (default uses RN text colour where you render)
  gridColor?: string;  // grid line colour (default '#e5e7eb' / slate-200-ish)
  axisLabelColor?: string; // tick label colour (default '#9ca3af')
};

export default function MacroTrendsChart({
  data,
  height = 120,
  scale = 'percentile',
  lowerPct = 15,
  upperPct = 85,
  smooth = 2,
  tickCount = 4,
  yRound = 100,
  tickRound = 100,
  paddingH = 8,
  paddingV = 8,
  strokeWidth = 2,
  stroke = '#22c55e',       // default green if caller doesn’t pass colour
  gridColor = '#e5e7eb',
  axisLabelColor = '#9ca3af',
}: Props) {
  const width = 320; // The viewBox width; the outer View will stretch it
  const vb = { w: width, h: height };

  const prepared = useMemo(() => {
    const xs = data.map((d) => Number.isFinite(d.calories) ? d.calories : 0);
    const vals = xs.length ? xs : [0];

    const smoothed = smoothValues(vals, Math.max(0, Math.floor(smooth)));
    const domainRaw = (scale === 'percentile')
      ? percentileDomain(smoothed, lowerPct, upperPct)
      : [Math.min(...smoothed), Math.max(...smoothed)];

    const domain = padAndRound(domainRaw[0], domainRaw[1], yRound);

    // ticks
    const ticks = mkTicks(domain[0], domain[1], tickCount, tickRound);

    // x scale: categorical (even spacing)
    const n = smoothed.length;
    const chartW = vb.w - paddingH * 2;
    const chartH = vb.h - paddingV * 2;
    const xAt = (i: number) =>
      paddingH + (n <= 1 ? chartW / 2 : (chartW * i) / (n - 1));
    const yAt = (v: number) => {
      if (domain[1] === domain[0]) return paddingV + chartH / 2;
      const t = (v - domain[0]) / (domain[1] - domain[0]);
      // invert y
      return paddingV + (1 - t) * chartH;
    };

    // path
    const points = smoothed.map((v, i) => [xAt(i), yAt(v)] as const);
    const d = pointsToPath(points);

    return { points, d, ticks, domain, xAt, yAt };
  }, [data, scale, lowerPct, upperPct, smooth, tickCount, yRound, tickRound, paddingH, paddingV, vb.w, vb.h]);

  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${vb.w} ${vb.h}`}>
        {/* Grid lines */}
        <G>
          {prepared.ticks.map((t, i) => {
            const y = prepared ? prepared.yAt(t) : 0;
            return (
              <Line
                key={`grid-${i}-${t}`}
                x1={0}
                x2={vb.w}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
                opacity={0.6}
              />
            );
          })}
        </G>

        {/* Trend line */}
        <Path
          d={prepared.d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>

      {/* Axis labels (overlayed below SVG for clarity) */}
      <View style={{ position: 'absolute', left: 4, top: 0, height: vb.h, width: vb.w, pointerEvents: 'none' }}>
        {prepared.ticks.map((t, i) => {
          const y = prepared.yAt(t) - 8; // shift label up slightly
          return (
            <Text
              key={`lab-${i}-${t}`}
              style={{
                position: 'absolute',
                left: 6,
                top: y,
                fontSize: 10,
                color: axisLabelColor,
              }}
            >
              {formatTick(t, tickRound)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

/* ───────────────────────────── helpers ───────────────────────────── */

function smoothValues(values: number[], radius: number) {
  if (!radius || radius < 1) return values;
  const n = values.length;
  const out = new Array(n).fill(0);
  const win = radius * 2 + 1;
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let j = i - radius; j <= i + radius; j++) {
      if (j >= 0 && j < n) { s += values[j]; c++; }
    }
    out[i] = c ? s / c : values[i];
  }
  return out;
}

function percentileDomain(values: number[], lo = 15, hi = 85): [number, number] {
  const arr = [...values].sort((a, b) => a - b);
  const q = (p: number) => {
    if (arr.length === 0) return 0;
    const idx = (p / 100) * (arr.length - 1);
    const loI = Math.floor(idx);
    const hiI = Math.ceil(idx);
    if (loI === hiI) return arr[loI];
    const w = idx - loI;
    return arr[loI] * (1 - w) + arr[hiI] * w;
  };
  return [q(lo), q(hi)];
}

function padAndRound(yminRaw: number, ymaxRaw: number, yRound: number): [number, number] {
  if (!Number.isFinite(yminRaw) || !Number.isFinite(ymaxRaw)) return [0, 1];
  // small padding
  const pad = (ymaxRaw - yminRaw) * 0.05 || yRound;
  let ymin = yminRaw - pad;
  let ymax = ymaxRaw + pad;

  // round to chosen unit (1 for kg, 100 for kcal)
  ymin = Math.floor(ymin / yRound) * yRound;
  ymax = Math.ceil(ymax / yRound) * yRound;
  if (ymin === ymax) ymax = ymin + yRound;

  return [ymin, ymax];
}

function mkTicks(ymin: number, ymax: number, tickCount: number, tickRound: number) {
  const ticks: number[] = [];
  if (tickCount < 1) return ticks;
  const step = (ymax - ymin) / tickCount;
  for (let i = 0; i <= tickCount; i++) {
    const raw = ymin + step * i;
    ticks.push(Math.round(raw / tickRound) * tickRound);
  }
  // ensure uniqueness/ordering
  return Array.from(new Set(ticks)).sort((a, b) => a - b);
}

function formatTick(v: number, unit: number) {
  // Avoid long decimals when unit is small
  if (unit >= 1) return String(v);
  return Number(v.toFixed(2)).toString();
}

// Simple path (polyline). Keep it snappy & smooth via round caps/joins.
function pointsToPath(points: readonly (readonly [number, number])[]) {
  if (!points.length) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    d += ` L ${x} ${y}`;
  }
  return d;
}
