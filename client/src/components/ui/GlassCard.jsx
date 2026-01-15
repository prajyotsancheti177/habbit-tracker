import './GlassCard.css';

function GlassCard({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    hover = true,
    glow = false,
    glowColor = 'blue',
    onClick,
    ...props
}) {
    const classes = [
        'glass-card',
        `glass-card--${variant}`,
        `glass-card--padding-${padding}`,
        hover && 'glass-card--hover',
        glow && `glass-card--glow glass-card--glow-${glowColor}`,
        onClick && 'glass-card--clickable',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
}

export default GlassCard;
