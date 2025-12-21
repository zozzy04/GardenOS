import { useState } from 'react'
import Icon from './Icons'
import './IrrigationControl.css'

const IrrigationControl = () => {
  const [isActive, setIsActive] = useState(false)
  const [duration, setDuration] = useState(30)
  const [schedule, setSchedule] = useState({
    morning: { enabled: true, time: '06:00' },
    evening: { enabled: true, time: '18:00' }
  })

  const handleToggle = () => {
    setIsActive(!isActive)
  }

  return (
    <div className="irrigation-control">
      <div className="control-header">
        <h2>
          <Icon name="water" size={24} className="icon-inline" />
          Controllo Irrigazione
        </h2>
        <div className={`power-switch ${isActive ? 'active' : ''}`}>
          <button onClick={handleToggle} className="switch-button">
            {isActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Irrigazione Manuale</h3>
        <div className="duration-control">
          <label>Durata (minuti)</label>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={!isActive}
          />
          <span className="duration-value">{duration} min</span>
        </div>
        <button 
          className="irrigate-button"
          disabled={!isActive}
          onClick={() => alert(`Irrigazione avviata per ${duration} minuti`)}
        >
          Avvia Irrigazione
        </button>
      </div>

      <div className="control-section">
        <h3>Programmazione Automatica</h3>
        <div className="schedule-list">
          <div className="schedule-item">
            <div className="schedule-info">
              <span className="schedule-label">Mattina</span>
              <input
                type="time"
                value={schedule.morning.time}
                onChange={(e) => setSchedule({
                  ...schedule,
                  morning: { ...schedule.morning, time: e.target.value }
                })}
                disabled={!schedule.morning.enabled}
              />
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={schedule.morning.enabled}
                onChange={(e) => setSchedule({
                  ...schedule,
                  morning: { ...schedule.morning, enabled: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="schedule-item">
            <div className="schedule-info">
              <span className="schedule-label">Sera</span>
              <input
                type="time"
                value={schedule.evening.time}
                onChange={(e) => setSchedule({
                  ...schedule,
                  evening: { ...schedule.evening, time: e.target.value }
                })}
                disabled={!schedule.evening.enabled}
              />
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={schedule.evening.enabled}
                onChange={(e) => setSchedule({
                  ...schedule,
                  evening: { ...schedule.evening, enabled: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IrrigationControl

