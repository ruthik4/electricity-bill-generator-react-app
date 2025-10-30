import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'

function App() {
  const { t, i18n } = useTranslation()
  
  // State for sliding panel and language selection
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [showLanguageOptions, setShowLanguageOptions] = useState(false)
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false)
  const [panelOpenClass, setPanelOpenClass] = useState(false)
  
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

  // Handle panel open/close with proper animation timing
  useEffect(() => {
    let openTimer: ReturnType<typeof setTimeout>;
    let renderTimer: ReturnType<typeof setTimeout>;
    
    if (isPanelOpen) {
      setShouldRenderPanel(true);
      // Delay adding the open class to ensure the element is rendered first
      // Use a slightly longer delay for mobile devices
      const isMobile = window.innerWidth <= 768;
      const delay = isMobile ? 50 : 10;
      
      openTimer = setTimeout(() => {
        setPanelOpenClass(true);
      }, delay);
    } else {
      setPanelOpenClass(false);
      // Match CSS transition duration
      renderTimer = setTimeout(() => {
        setShouldRenderPanel(false);
      }, 300);
    }
    
    return () => {
      if (openTimer) clearTimeout(openTimer);
      if (renderTimer) clearTimeout(renderTimer);
    };
  }, [isPanelOpen]);

  // Handle language change
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setShowLanguageOptions(false)
    setIsPanelOpen(false)
  }

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
      newErrors.units = t('required')
    } else if (isNaN(Number(formData.units)) || Number(formData.units) <= 0) {
      newErrors.units = t('positiveNumber')
    }
    
    if (!formData.previousReadingDate) {
      newErrors.previousReadingDate = t('previousReadingDateRequired')
    }
    
    if (!formData.currentReadingDate) {
      newErrors.currentReadingDate = t('currentReadingDateRequired')
    }
    
    if (formData.previousReadingDate && formData.currentReadingDate) {
      const prevDate = new Date(formData.previousReadingDate)
      const currDate = new Date(formData.currentReadingDate)
      
      if (prevDate >= currDate) {
        newErrors.currentReadingDate = t('currentReadingDateAfterPrevious')
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

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isPanelOpen && !target.closest('.sliding-panel') && !target.closest('.menu-button')) {
        setIsPanelOpen(false);
        setShowLanguageOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  return (
    <div className="app">
      <div className="container">
        <header>
          <div className="header-content">
            <div>
              <h1>{t('electricityBillGenerator')}</h1>
              <p>{t('calculateBasedOnTariffs')}</p>
            </div>
            <div className="menu-container">
              <button 
                className="menu-button" 
                onClick={() => {
                  setIsPanelOpen(true);
                  setShowLanguageOptions(false);
                }}
                aria-label="Menu"
              >
                ⋮
              </button>
            </div>
          </div>
        </header>
        
        <main>
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>{t('calculatingBill')}</p>
            </div>
          ) : !billDetails ? (
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); calculateBill(); }}>
                <div className="form-group">
                  <label htmlFor="units">{t('unitsConsumed')} *</label>
                  <input
                    type="number"
                    id="units"
                    name="units"
                    value={formData.units}
                    onChange={handleInputChange}
                    placeholder={t('enterUnitsConsumed')}
                    min="0"
                    step="0.01"
                  />
                  {errors.units && <span className="error">{errors.units}</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="previousReadingDate">{t('previousReadingDate')} *</label>
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
                    <label htmlFor="currentReadingDate">{t('currentReadingDate')} *</label>
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
                    <label htmlFor="connectionType">{t('connectionType')} *</label>
                    <select
                      id="connectionType"
                      name="connectionType"
                      value={formData.connectionType}
                      onChange={handleInputChange}
                    >
                      <option value="domestic">{t('domestic')}</option>
                      <option value="commercial">{t('commercial')}</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="meterPhase">{t('meterPhase')} *</label>
                    <select
                      id="meterPhase"
                      name="meterPhase"
                      value={formData.meterPhase}
                      onChange={handleInputChange}
                    >
                      <option value="single">{t('singlePhase')}</option>
                      <option value="three">{t('threePhase')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={resetForm}>{t('reset')}</button>
                  <button type="submit" className="primary">{t('calculateBill')}</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="result-container">
              <div className="bill-summary">
                <h2>{t('billSummary')}</h2>
                <div className="bill-details">
                  <div className="detail-row">
                    <span>{t('units')}:</span>
                    <span>{billDetails.units} {t('kwh')}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('connectionType')}:</span>
                    <span>{billDetails.connectionType === 'domestic' ? t('domestic') : t('commercial')}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('meterPhase')}:</span>
                    <span>{billDetails.meterPhase === 'single' ? t('singlePhase') : t('threePhase')}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('billingPeriod')}:</span>
                    <span>{billDetails.billingPeriod} {t('days')}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('energyCharges')}:</span>
                    <span>₹{billDetails.energyCharge}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('fixedCharges')}:</span>
                    <span>₹{billDetails.fixedCharge}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('meterCharges')}:</span>
                    <span>₹{billDetails.meterCharge}</span>
                  </div>
                  {parseFloat(billDetails.subsidy) > 0 && (
                    <div className="detail-row">
                      <span>{t('subsidy')}:</span>
                      <span className="subsidy">-₹{billDetails.subsidy}</span>
                    </div>
                  )}
                  <div className="detail-row total">
                    <span>{t('totalAmount')}:</span>
                    <span>₹{billDetails.totalAmount}</span>
                  </div>
                </div>
                
                <div className="disclaimer">
                  <p>{t('disclaimer')}</p>
                </div>
              </div>
              
              <div className="actions">
                <button onClick={resetForm} className="primary">{t('generateNewBill')}</button>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Sliding Panel */}
      {shouldRenderPanel && (
        <div className={`sliding-panel-overlay ${panelOpenClass ? 'open' : ''}`}>
          <div className="sliding-panel">
            <div className="panel-header">
              <h2>{t('settings')}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setIsPanelOpen(false);
                  setShowLanguageOptions(false);
                }}
                aria-label="Close panel"
              >
                ×
              </button>
            </div>
            <div className="panel-content">
              {!showLanguageOptions ? (
                <button 
                  className="panel-option"
                  onClick={() => setShowLanguageOptions(true)}
                >
                  {t('language')}
                </button>
              ) : (
                <>
                  <button 
                    className="back-button-icon"
                    onClick={() => setShowLanguageOptions(false)}
                  >
                    ←
                  </button>
                  <button 
                    className="panel-option"
                    onClick={() => changeLanguage('en')}
                  >
                    English
                  </button>
                  <button 
                    className="panel-option"
                    onClick={() => changeLanguage('te')}
                  >
                    తెలుగు
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App