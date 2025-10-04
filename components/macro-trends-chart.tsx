// components/macro-trends-chart.tsx
import { useTheme } from '@react-navigation/native';
import * as d3 from 'd3-shape';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

export type TrendPoint = { date: string; calories?: number | null };

type Props = {
  data: TrendPoint[];
  height?: number;
  tickCount?: number;
  /** Y-axis domain method */
  scale?: 'minmax' | 'percentile';
  /** Lower/upper percentiles for scale='percentile' */
  lowerPct?: number;
  upperPct?: number;
};

export default function MacroTrendsChart({
  data,
  height = 190,
  tickCount = 4,
  scale = 'percentile',
  lowerPct = 10,
  upperPct = 90,
}: Props) {
  const { colors, dark } = useTheme();
  const [width, setWidth] = useState(0);

  const pal = useMemo(() => ({
    text: colors.text,
    grid: dark ? '#27303a' : '#e5e7eb',
    axis: dark ? '#8a919b' : '#6b7280',
    line: dark ? '#60a5fa' : '#2563eb',
  }), [colors, dark]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const LEFT = 44, RIGHT = 6, TOP = 8, BOTTOM = 10;

  const sortedSeries = useMemo(() => {
    const arr = [...data]
      .filter(d => d.date)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return { arr, xs: arr.map(d => +new Date(d.date)) };
  }, [data]);

  const values = useMemo(
    () => sortedSeries.arr.map(d => d.calories ?? null),
    [sortedSeries]
  );

  // --- Y domain ---
  const domain = useMemo(() => {
    const valid = values.filter(v => v != null) as number[];
    if (!valid.length) return { ymin: 0, ymax: 1 };

    const padAndRound = (ymin: number, ymax: number) => {
      const pad = (ymax - ymin) * 0.06;
      ymin = Math.max(0, ymin - pad);
      ymax = ymax + pad;
      // round to nearest 10
      ymin = Math.floor(ymin / 100) * 100;
      ymax = Math.ceil(ymax / 100) * 100;
      if (ymin === ymax) ymax = ymin + 100; // avoid flat domain
      return { ymin, ymax };
    };

    if (scale === 'percentile') {
      const sorted = [...valid].sort((a, b) => a - b);
      const pct = (p: number) => {
        const idx = (sorted.length - 1) * (p / 100);
        const lo = Math.floor(idx), hi = Math.ceil(idx);
        if (lo === hi) return sorted[lo];
        const t = idx - lo;
        return sorted[lo] * (1 - t) + sorted[hi] * t;
      };
      let ymin = pct(lowerPct), ymax = pct(upperPct);
      if (ymax === ymin) { ymin -= 1; ymax += 1; }
      return padAndRound(ymin, ymax);
    } else {
      let ymin = Math.min(...valid), ymax = Math.max(...valid);
      if (ymax === ymin) { ymin -= 1; ymax += 1; }
      return padAndRound(ymin, ymax);
    }
  }, [values, scale, lowerPct, upperPct]);

  // --- Path + ticks ---
  const { pathD, ticks } = useMemo(() => {
    if (!width || !sortedSeries.arr.length) return { pathD: '', ticks: [] as number[] };

    const innerW = Math.max(0, width - LEFT - RIGHT);
    const innerH = Math.max(0, height - TOP - BOTTOM);

    const x = (t: number) =>
      sortedSeries.xs[0] === sortedSeries.xs[sortedSeries.xs.length - 1]
        ? LEFT
        : LEFT + ((t - sortedSeries.xs[0]) / (sortedSeries.xs[sortedSeries.xs.length - 1] - sortedSeries.xs[0])) * innerW;

    const y = (v: number) =>
      TOP + (1 - (v - domain.ymin) / (domain.ymax - domain.ymin)) * innerH;

    const pts: [number, number][] = sortedSeries.arr
      .map((d, i) => {
        const v = values[i];
        if (v == null) return null;
        const vc = Math.max(domain.ymin, Math.min(domain.ymax, v));
        return [x(sortedSeries.xs[i]), y(vc)];
      })
      .filter(Boolean) as [number, number][];

    const line = d3.line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveMonotoneX);

    // ticks (rounded multiples of 10)
    const step = (domain.ymax - domain.ymin) / tickCount;
    const ts: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const raw = domain.ymin + step * i;
      ts.push(Math.round(raw / 100) * 100);
    }

    return { pathD: pts.length >= 2 ? (line(pts) ?? '') : '', ticks: ts };
  }, [width, height, sortedSeries, domain, tickCount, values]);

  if (!data.length) return null;

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* y-grid + labels */}
          {ticks.map((t, i) => {
            const innerH = Math.max(0, height - TOP - BOTTOM);
            const y = TOP + (1 - (t - domain.ymin) / (domain.ymax - domain.ymin)) * innerH;
            return (
              <React.Fragment key={`tick-${i}`}>
                <Line x1={LEFT} x2={width - RIGHT} y1={y} y2={y} stroke={pal.grid} strokeWidth={1} />
                <SvgText x={LEFT - 6} y={y + 4} fill={pal.axis} fontSize={11} textAnchor="end">
                  {t.toString()}
                </SvgText>
              </React.Fragment>
            );
          })}
          {/* y-axis */}
          <Line x1={LEFT} x2={LEFT} y1={TOP} y2={height - BOTTOM} stroke={pal.axis} strokeWidth={1} />
          {/* calorie line */}
          {!!pathD && <Path d={pathD} stroke={pal.line} strokeWidth={2} fill="none" />}
        </Svg>
      )}
    </View>
  );
}
