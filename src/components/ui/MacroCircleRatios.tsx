'use client';

import { useMemo, useRef } from 'react';
import * as d3 from 'd3';

interface MacroCircleRatiosProps {
  protein: number;
  carbs: number;
  fat: number;
  calories?: number;
  size?: 'sm' | 'md' | 'lg';
}

type DataItem = {
  name: string;
  value: number;
};

const MARGIN_X = 150;
const MARGIN_Y = 50;
const INFLEXION_PADDING = 20;

const colors = [
  '#8b5cf6', // purple for protein
  '#f59e0b', // amber for carbs
  '#3b82f6', // blue for fat
];

export default function MacroCircleRatios({
  protein,
  carbs,
  fat,
  size = 'md',
}: MacroCircleRatiosProps) {
  const ref = useRef(null);

  // Size configurations - using viewBox for responsive SVG
  const sizeConfig = {
    sm: { width: 500, height: 350, viewBox: '0 0 500 350' },
    md: { width: 600, height: 400, viewBox: '0 0 600 400' },
    lg: { width: 500, height: 300, viewBox: '0 0 500 300' },
  };

  const config = sizeConfig[size];
  const radius =
    Math.min(config.width - 2 * MARGIN_X, config.height - 2 * MARGIN_Y) / 2;
  const innerRadius = radius / 2;

  const data = useMemo(
    () => [
      { name: 'Protein', value: protein },
      { name: 'Carbs', value: carbs },
      { name: 'Fat', value: fat },
    ],
    [protein, carbs, fat],
  );

  const pie = useMemo(() => {
    const pieGenerator = d3.pie<DataItem>().value((d: DataItem) => d.value);
    return pieGenerator(data);
  }, [data]);

  const arcGenerator = d3.arc();

  const shapes = pie.map((grp: d3.PieArcDatum<DataItem>, i: number) => {
    // First arc is for the donut
    const sliceInfo = {
      innerRadius,
      outerRadius: radius,
      startAngle: grp.startAngle,
      endAngle: grp.endAngle,
    };
    const centroid = arcGenerator.centroid(sliceInfo);
    const slicePath = arcGenerator(sliceInfo);

    // Second arc is for the legend inflexion point
    const inflexionInfo = {
      innerRadius: radius + INFLEXION_PADDING,
      outerRadius: radius + INFLEXION_PADDING,
      startAngle: grp.startAngle,
      endAngle: grp.endAngle,
    };
    const inflexionPoint = arcGenerator.centroid(inflexionInfo);

    const isRightLabel = inflexionPoint[0] > 0;
    const labelPosX = inflexionPoint[0] + 15 * (isRightLabel ? 1 : -1);
    const textAnchor = isRightLabel ? 'start' : 'end';
    const percentage = ((grp.value / (protein + carbs + fat)) * 100).toFixed(0);
    const label = `${grp.data.name} (${Math.round(grp.value)}g, ${percentage}%)`;

    return (
      <g
        key={i}
        onMouseEnter={() => {
          if (ref.current) {
            (ref.current as HTMLElement).classList.add('opacity-50');
          }
        }}
        onMouseLeave={() => {
          if (ref.current) {
            (ref.current as HTMLElement).classList.remove('opacity-50');
          }
        }}
      >
        <path d={slicePath!} fill={colors[i]} />
        <circle cx={centroid[0]} cy={centroid[1]} r={2} />
        <line
          x1={centroid[0]}
          y1={centroid[1]}
          x2={inflexionPoint[0]}
          y2={inflexionPoint[1]}
          stroke={'currentColor'}
          fill={'currentColor'}
          className="text-on-surface"
        />
        <line
          x1={inflexionPoint[0]}
          y1={inflexionPoint[1]}
          x2={labelPosX}
          y2={inflexionPoint[1]}
          stroke={'currentColor'}
          fill={'currentColor'}
          className="text-on-surface"
        />
        <text
          x={labelPosX + (isRightLabel ? 2 : -2)}
          y={inflexionPoint[1]}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fontSize={16}
          fontWeight="500"
          className="text-on-surface fill-current"
        >
          {label}
        </text>
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center w-full max-w-full overflow-hidden">
        <svg
          viewBox={config.viewBox}
          className="w-full h-auto max-w-full"
          style={{ maxHeight: `${config.height}px` }}
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            transform={`translate(${config.width / 2}, ${config.height / 2})`}
            ref={ref}
          >
            {shapes}
          </g>
        </svg>
      </div>
    </div>
  );
}
