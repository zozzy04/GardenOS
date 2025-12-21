import './SensorCard.css'

const SensorCard = ({ title, value, unit, icon, status, trend }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return '#48bb78'
      case 'warning':
        return '#ed8936'
      case 'critical':
        return '#f56565'
      default:
        return '#a0aec0'
    }
  }

  return (
    <div className="sensor-card">
      <div className="sensor-header">
        <span className="sensor-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="sensor-value">
        <span className="value">{value}</span>
        <span className="unit">{unit}</span>
      </div>
      <div className="sensor-footer">
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className="status-text">{status}</span>
        {trend && (
          <span className={`trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

export default SensorCard

