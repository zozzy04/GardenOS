import './StatsChart.css'

const StatsChart = ({ title, data, color = '#667eea' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="stats-chart">
      <h3>{title}</h3>
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color
                }}
              />
            </div>
            <span className="chart-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsChart

