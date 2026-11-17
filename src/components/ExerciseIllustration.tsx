import React from 'react';

interface Props {
  illustrationKey: string;
  altText: string;
  className?: string;
}

export const ExerciseIllustration: React.FC<Props> = ({
  illustrationKey,
  altText,
  className = 'w-full h-44',
}) => {
  const renderPose = () => {
    switch (illustrationKey) {
      case 'squat':
        return (
          <g>
            {/* Floor */}
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            {/* Chair support */}
            <path d="M56 148 L56 84 M56 112 L84 112 L84 148" fill="none" stroke="currentColor" strokeOpacity="0.38" strokeWidth="3" strokeLinecap="round" />
            {/* Person doing quarter squat */}
            <circle cx="132" cy="52" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path
              d="M130 64 L138 96 L118 118 L124 146"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M138 96 L152 118 L148 146"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arm lightly touching chair */}
            <path
              d="M128 70 L94 84 L58 84"
              fill="none"
              className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Subtle directional cue */}
            <path d="M174 86 L174 110 M168 104 L174 110 L180 104" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'wall-pushup':
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            {/* Wall */}
            <line x1="176" y1="26" x2="176" y2="148" stroke="currentColor" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
            {/* Leaning straight torso */}
            <circle cx="122" cy="50" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path
              d="M118 62 L92 104 L74 146"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bent arm pushing wall */}
            <path
              d="M114 70 L142 86 L174 78"
              fill="none"
              className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M134 40 L152 40 M146 35 L152 40 L146 45" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'glute-bridge':
        return (
          <g>
            {/* Mat */}
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            {/* Head on mat */}
            <circle cx="58" cy="128" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            {/* Bridge line shoulders -> hip -> knee -> foot */}
            <path
              d="M74 134 L126 98 L162 96 L176 140"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arm flat on mat */}
            <path
              d="M84 128 L124 138"
              fill="none"
              className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Upward arrow at hip */}
            <path d="M126 84 L126 64 M120 70 L126 64 L132 70" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'dead-bug':
        return (
          <g>
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            <circle cx="56" cy="126" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            {/* Flat back */}
            <path d="M70 132 L134 132" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            {/* Raised arm & opposite bent knee */}
            <path d="M84 130 L84 82" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4" strokeLinecap="round" />
            <path d="M84 130 L48 106" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="3.5" strokeLinecap="round" />
            {/* Table-top leg + extending opposite leg */}
            <path d="M134 132 L134 94 L168 94" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M134 132 L188 122" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        );

      case 'side-leg-raise':
        return (
          <g>
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            <circle cx="62" cy="124" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            {/* Torso + bottom slightly bent leg */}
            <path d="M74 128 L130 128 L164 136 L190 136" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Top leg raised */}
            <path d="M130 124 L192 92" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M174 84 L174 66 M168 72 L174 66 L180 72" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'pelvic-tilt':
        return (
          <g>
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            <circle cx="56" cy="126" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M72 132 Q102 126 130 132 L154 96 L176 138" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pelvic tilt arc */}
            <path d="M114 114 Q124 104 136 114" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'knee-sway':
        return (
          <g>
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            <circle cx="62" cy="126" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M74 130 L128 130" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            {/* Knees tilted softly */}
            <path d="M128 130 L158 106 L178 136" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M128 130 L166 118 L184 138" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M148 82 Q164 74 178 86" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'hamstring-stretch':
        return (
          <g>
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            <circle cx="58" cy="126" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M72 132 L130 132" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            {/* Bent resting leg */}
            <path d="M130 132 L156 104 L178 138" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Elevated leg held gently */}
            <path d="M130 132 L126 62" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M88 128 L118 96" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        );

      case 'hip-flexor':
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <circle cx="118" cy="48" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M118 60 L118 96" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            {/* Front leg slight bend */}
            <path d="M118 96 L146 116 L144 146" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Back leg stepping behind */}
            <path d="M118 96 L88 120 L78 146" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Gentle forward pelvic cue */}
            <path d="M134 94 L152 94 M146 89 L152 94 L146 99" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'wall-chest':
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <line x1="166" y1="28" x2="166" y2="148" stroke="currentColor" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
            <circle cx="106" cy="48" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M106 60 L106 102 L96 146 M106 102 L116 146" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Forearm against wall */}
            <path d="M106 68 L144 74 L164 56" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );

      case 'lying-twist':
        return (
          <g>
            <line x1="28" y1="142" x2="212" y2="142" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" />
            <circle cx="62" cy="124" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M74 128 L128 128 L158 112 L176 134" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Open arm arc */}
            <path d="M84 126 L122 86" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4" strokeLinecap="round" />
            <path d="M88 94 Q112 72 134 90" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="4 4" />
          </g>
        );

      case 'hip-hinge':
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <circle cx="144" cy="60" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            {/* Neutral straight back tilted 35 deg */}
            <path d="M136 68 L96 98" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="5" strokeLinecap="round" />
            {/* Soft knees */}
            <path d="M96 98 L108 122 L106 146" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Hands on hips/thighs */}
            <path d="M126 74 L106 96" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M84 96 L68 96 M74 91 L68 96 L74 101" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'calf-raise':
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <line x1="168" y1="30" x2="168" y2="148" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="116" cy="44" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            {/* Upright body on toes */}
            <path d="M116 56 L116 102 L114 140 L124 146" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Hand touching wall */}
            <path d="M116 68 L148 76 L166 76" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4" strokeLinecap="round" />
            <path d="M92 136 L92 118 M87 124 L92 118 L97 124" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'single-leg-balance':
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <line x1="72" y1="30" x2="72" y2="148" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="118" cy="46" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M118 58 L118 100 L118 146" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            {/* Raised knee */}
            <path d="M118 100 L142 112 L140 130" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Hand near wall */}
            <path d="M114 68 L84 78 L74 78" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        );

      case 'lateral-march':
      default:
        return (
          <g>
            <line x1="30" y1="148" x2="210" y2="148" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <circle cx="120" cy="48" r="10" className="fill-[#1E4D3B] dark:fill-[#6EE7B7]" />
            <path d="M120 60 L120 100" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M120 100 L98 126 L94 146" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M120 100 L144 126 L150 146" fill="none" className="stroke-[#1E4D3B] dark:stroke-[#6EE7B7]" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M96 72 L120 66 L144 72" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M74 136 L58 136 M63 131 L58 136 L63 141" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
            <path d="M166 136 L182 136 M177 131 L182 136 L177 141" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl bg-[#EEF2EE] dark:bg-[#1C2622] border border-[#DCE3DD] dark:border-[#2B3832] flex items-center justify-center overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 240 168"
        className="w-full h-full max-w-[260px] text-[#28352E] dark:text-[#D9E3DD]"
        role="img"
        aria-label={altText}
      >
        <title>{altText}</title>
        {renderPose()}
      </svg>
    </div>
  );
};
