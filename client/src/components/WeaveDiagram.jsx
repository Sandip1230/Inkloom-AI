const STAGES = [
  { label: "Understand", y: 48 },
  { label: "Position", y: 118 },
  { label: "Shape", y: 188 },
  { label: "Visualize", y: 258 },
  { label: "Challenge", y: 328 },
  { label: "Deliver", y: 398 },
];

// Each thread curves from its stage on the left into a single point on the
// right, where they interlace into a small woven mark — the finished brand.
const CONVERGE_X = 470;
const CONVERGE_Y = 223;

export default function WeaveDiagram() {
  return (
    <svg
      viewBox="0 0 560 460"
      className="h-auto w-full max-w-xl"
      role="img"
      aria-label="Six brand-building stages weaving into a single finished brand mark"
    >
      <g fill="none" strokeWidth="1.5">
        {STAGES.map((stage, i) => {
          const startX = 118;
          const cp1x = startX + 140;
          const cp2x = CONVERGE_X - 90;
          const isActive = i % 2 === 0;
          return (
            <g key={stage.label}>
              <path
                d={`M ${startX} ${stage.y} C ${cp1x} ${stage.y}, ${cp2x} ${CONVERGE_Y}, ${CONVERGE_X} ${CONVERGE_Y}`}
                stroke={isActive ? "#B8863B" : "#4A4768"}
                strokeDasharray="620"
                strokeDashoffset="620"
                opacity={isActive ? "0.9" : "0.45"}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="620"
                  to="0"
                  dur="1.4s"
                  begin={`${i * 0.12}s`}
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.22 1 0.36 1"
                  keyTimes="0;1"
                />
              </path>
              <circle cx={startX} cy={stage.y} r="3" fill="#15132C" />
              <text
                x={startX - 14}
                y={stage.y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="12"
                fill="#4A4768"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={startX - 30}
                y={stage.y + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="12"
                fill="#15132C"
              >
                {stage.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* the finished brand mark: an interlaced knot where every thread meets */}
      <g transform={`translate(${CONVERGE_X} ${CONVERGE_Y})`}>
        <circle r="26" fill="#EFEAE0" stroke="#15132C" strokeWidth="1.5" />
        <path
          d="M -12 -12 L 12 12 M -12 12 L 12 -12"
          stroke="#B8863B"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.5s"
            begin="1.5s"
            fill="freeze"
          />
        </path>
      </g>
    </svg>
  );
}