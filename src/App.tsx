import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Form state
  const [formData, setFormData] = useState({
    units: '',
    previousReadingDate: '',
    currentReadingDate: '',
    connectionType: 'domestic',
    meterPhase: 'single'
  })

  // Bill calculation state
  const [billDetails, setBillDetails] = useState<any>(null)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  // Set current date as default for currentReadingDate
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setFormData(prevData => ({
      ...prevData,
      currentReadingDate: formattedDate
    }));
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: any = {}
    
    if (!formData.units) {
      newErrors.units = 'Units are required'
    } else if (isNaN(Number(formData.units)) || Number(formData.units) <= 0) {
      newErrors.units = 'Units must be a positive number'
    }
    
    if (!formData.previousReadingDate) {
      newErrors.previousReadingDate = 'Previous reading date is required'
    }
    
    if (!formData.currentReadingDate) {
      newErrors.currentReadingDate = 'Current reading date is required'
    }
    
    if (formData.previousReadingDate && formData.currentReadingDate) {
      const prevDate = new Date(formData.previousReadingDate)
      const currDate = new Date(formData.currentReadingDate)
      
      if (prevDate >= currDate) {
        newErrors.currentReadingDate = 'Current reading date must be after previous reading date'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Calculate bill based on Telangana electricity tariffs
  const calculateBill = () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    // Simulate API call or calculation delay
    setTimeout(() => {
      const units = parseFloat(formData.units)
      let energyCharge = 0
      let fixedCharge = 0
      let subsidy = 0
      
      // Telangana Electricity Tariff Rates (FY 2023-24)
      if (formData.connectionType === 'domestic') {
        // Domestic tariff slabs
        if (units <= 50) {
          energyCharge = units * 1.95
          fixedCharge = 10
        } else if (units <= 100) {
          energyCharge = 50 * 1.95 + (units - 50) * 3.10
          fixedCharge = 20
        } else if (units <= 200) {
          energyCharge = 50 * 1.95 + 50 * 3.10 + (units - 100) * 4.80
          fixedCharge = 30
        } else if (units <= 400) {
          energyCharge = 50 * 1.95 + 50 * 3.10 + 100 * 4.80 + (units - 200) * 7.50
          fixedCharge = 60
        } else {
          energyCharge = 50 * 1.95 + 50 * 3.10 + 100 * 4.80 + 200 * 7.50 + (units - 400) * 9.50
          fixedCharge = 90
        }
        
        // Subsidy for domestic consumers (up to 200 units)
        if (units <= 50) {
          subsidy = 25
        } else if (units <= 100) {
          subsidy = 30
        } else if (units <= 200) {
          subsidy = 40
        }
      } else {
        // Commercial tariff rates
        if (units <= 50) {
          energyCharge = units * 5.50
          fixedCharge = 30
        } else if (units <= 100) {
          energyCharge = 50 * 5.50 + (units - 50) * 6.50
          fixedCharge = 50
        } else if (units <= 200) {
          energyCharge = 50 * 5.50 + 50 * 6.50 + (units - 100) * 7.50
          fixedCharge = 70
        } else if (units <= 400) {
          energyCharge = 50 * 5.50 + 50 * 6.50 + 100 * 7.50 + (units - 200) * 8.50
          fixedCharge = 100
        } else {
          energyCharge = 50 * 5.50 + 50 * 6.50 + 100 * 7.50 + 200 * 8.50 + (units - 400) * 9.50
          fixedCharge = 150
        }
      }
      
      // Add meter phase charges
      let meterCharge = 0
      if (formData.meterPhase === 'three') {
        meterCharge = 50
      } else {
        meterCharge = 20
      }
      
      // Calculate billing period
      const prevDate = new Date(formData.previousReadingDate)
      const currDate = new Date(formData.currentReadingDate)
      const timeDiff = Math.abs(currDate.getTime() - prevDate.getTime())
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      // Calculate total amount
      const totalAmount = energyCharge + fixedCharge + meterCharge - subsidy
      
      setBillDetails({
        units: units,
        connectionType: formData.connectionType,
        meterPhase: formData.meterPhase,
        billingPeriod: daysDiff,
        energyCharge: energyCharge.toFixed(2),
        fixedCharge: fixedCharge.toFixed(2),
        meterCharge: meterCharge.toFixed(2),
        subsidy: subsidy.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      })
      
      setIsLoading(false)
    }, 1000)
  }

  // Reset form
  const resetForm = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setFormData({
      units: '',
      previousReadingDate: '',
      currentReadingDate: formattedDate,
      connectionType: 'domestic',
      meterPhase: 'single'
    })
    setBillDetails(null)
    setErrors({})
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>Electricity Bill Generator</h1>
          <p>Calculate your electricity bill based on Telangana tariffs</p>
        </header>
        
        <main>
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Calculating your bill...</p>
            </div>
          ) : !billDetails ? (
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); calculateBill(); }}>
                <div className="form-group">
                  <label htmlFor="units">Units Consumed *</label>
                  <input
                    type="number"
                    id="units"
                    name="units"
                    value={formData.units}
                    onChange={handleInputChange}
                    placeholder="Enter units consumed"
                    min="0"
                    step="0.01"
                  />
                  {errors.units && <span className="error">{errors.units}</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="previousReadingDate">Previous Reading Date *</label>
                    <input
                      type="date"
                      id="previousReadingDate"
                      name="previousReadingDate"
                      value={formData.previousReadingDate}
                      onChange={handleInputChange}
                    />
                    {errors.previousReadingDate && <span className="error">{errors.previousReadingDate}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="currentReadingDate">Current Reading Date *</label>
                    <input
                      type="date"
                      id="currentReadingDate"
                      name="currentReadingDate"
                      value={formData.currentReadingDate}
                      onChange={handleInputChange}
                    />
                    {errors.currentReadingDate && <span className="error">{errors.currentReadingDate}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="connectionType">Connection Type *</label>
                    <select
                      id="connectionType"
                      name="connectionType"
                      value={formData.connectionType}
                      onChange={handleInputChange}
                    >
                      <option value="domestic">Domestic</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="meterPhase">Meter Phase *</label>
                    <select
                      id="meterPhase"
                      name="meterPhase"
                      value={formData.meterPhase}
                      onChange={handleInputChange}
                    >
                      <option value="single">Single Phase</option>
                      <option value="three">Three Phase</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={resetForm}>Reset</button>
                  <button type="submit" className="primary">Calculate Bill</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="result-container">
              <div className="bill-summary">
                <h2>Electricity Bill Summary</h2>
                <div className="bill-details">
                  <div className="detail-row">
                    <span>Units Consumed:</span>
                    <span>{billDetails.units} kWh</span>
                  </div>
                  <div className="detail-row">
                    <span>Connection Type:</span>
                    <span>{billDetails.connectionType.charAt(0).toUpperCase() + billDetails.connectionType.slice(1)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Meter Phase:</span>
                    <span>{billDetails.meterPhase === 'single' ? 'Single Phase' : 'Three Phase'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Billing Period:</span>
                    <span>{billDetails.billingPeriod} days</span>
                  </div>
                  <div className="detail-row">
                    <span>Energy Charges:</span>
                    <span>₹{billDetails.energyCharge}</span>
                  </div>
                  <div className="detail-row">
                    <span>Fixed Charges:</span>
                    <span>₹{billDetails.fixedCharge}</span>
                  </div>
                  <div className="detail-row">
                    <span>Meter Charges:</span>
                    <span>₹{billDetails.meterCharge}</span>
                  </div>
                  {parseFloat(billDetails.subsidy) > 0 && (
                    <div className="detail-row">
                      <span>Subsidy:</span>
                      <span className="subsidy">-₹{billDetails.subsidy}</span>
                    </div>
                  )}
                  <div className="detail-row total">
                    <span>Total Amount:</span>
                    <span>₹{billDetails.totalAmount}</span>
                  </div>
                </div>
                
                <div className="disclaimer">
                  <p>These are approximate values only. Kindly contact your electricity board for accurate bill.</p>
                </div>
              </div>
              
              <div className="actions">
                <button onClick={resetForm} className="primary">Generate New Bill</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App