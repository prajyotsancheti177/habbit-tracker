import './ProgressRing.css';

function ProgressRing({
    progress = 0,
    size = 100,
    strokeWidth = 8,
    color = 'var(--color-accent-blue)',
    bgColor = 'var(--glass-border)',
    showLabel = true,
    label,
    className = ''
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className={`progress-ring ${className}`} style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                    className="progress-ring__bg"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className="progress-ring__progress"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%'
                    }}
                />
            </svg>
            {showLabel && (
                <div className="progress-ring__label">
                    <span className="progress-ring__value">{Math.round(progress)}%</span>
                    {label && <span className="progress-ring__text">{label}</span>}
                </div>
            )}
        </div>
    );
}

export default ProgressRing;
