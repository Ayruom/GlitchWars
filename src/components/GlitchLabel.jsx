// src/components/GlitchLabel.jsx
// Wraps button label text so the retro glitch-scramble hover effect (see .glitch-label
// rules in index.css) runs per letter instead of as one overlay across the whole word.
// Each character gets its own box (sized to that character) and a --char-index custom
// property that staggers its animation delay, so the ripple scales to any word length.
export function GlitchLabel({ text }) {
  return (
    <span className="glitch-label" aria-label={text}>
      {[...text].map((char, index) => (
        <span key={index} aria-hidden="true" style={{ '--char-index': index }}>
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}
