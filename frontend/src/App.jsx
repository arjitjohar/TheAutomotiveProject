import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [cars, setCars] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    fuel: '',
    transmission: '',
    seller_type: '',
    minPrice: '',
    maxPrice: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [ownerStats, setOwnerStats] = useState([])

  useEffect(() => {
    fetch('http://localhost:3001/api/cars')
      .then(res => res.json())
      .then(data => {
        setCars(data)
        setFilteredCars(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch data:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetch('http://localhost:3001/api/owner-stats')
      .then(res => res.json())
      .then(data => setOwnerStats(data))
      .catch(err => console.error('Failed to fetch owner stats:', err))
  }, [])


  useEffect(() => {
    let result = [...cars]

    if (filters.fuel) {
      result = result.filter(car => car.fuel === filters.fuel)
    }
    if (filters.transmission) {
      result = result.filter(car => car.transmission === filters.transmission)
    }
    if (filters.seller_type) {
      result = result.filter(car => car.seller_type === filters.seller_type)
    }
    if (filters.minPrice) {
      result = result.filter(car => car.selling_price >= parseInt(filters.minPrice))
    }
    if (filters.maxPrice) {
      result = result.filter(car => car.selling_price <= parseInt(filters.maxPrice))
    }

    setFilteredCars(result)
  }, [filters, cars])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getUniqueOptions = (field) => {
    return [...new Set(cars.map(car => car[field]))].sort()
  }

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentCars = filteredCars.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredCars.length / rowsPerPage);

  const rowsOptions = [10, 25, 50, 100];

  const handleRowsChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCars.length, rowsPerPage]);

  if (loading) return <div className="loading">Loading dashboard...</div>


  return (
    <div className="App">
      <h1>Car Dashboard</h1>
      
      <div className="filters">
        <h2>Filters</h2>
        <div>
          <label>Fuel: </label>
          <select value={filters.fuel} onChange={(e) => updateFilter('fuel', e.target.value)}>
            <option value="">All</option>
            {getUniqueOptions('fuel').map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Transmission: </label>
          <select value={filters.transmission} onChange={(e) => updateFilter('transmission', e.target.value)}>
            <option value="">All</option>
            {getUniqueOptions('transmission').map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Seller Type: </label>
          <select value={filters.seller_type} onChange={(e) => updateFilter('seller_type', e.target.value)}>
            <option value="">All</option>
            {getUniqueOptions('seller_type').map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Min Price: </label>
          <input type="number" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
        </div>
        <div>
          <label>Max Price: </label>
          <input type="number" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
        </div>
      </div>

      <div className="stats">
        <p>Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredCars.length)} of {filteredCars.length} cars</p>
        <div className="rows-selector">
          <label>Rows per page: </label>
          <select value={rowsPerPage} onChange={handleRowsChange}>
            {rowsOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {ownerStats.length > 0 && (
        <div className="chart-container">
          <h3>Avg KM Driven by Owner</h3>
          <div className="owner-bars">
            {ownerStats.map((stat) => {
              const maxKm = Math.max(...ownerStats.map(s => s.avg_km || 0));
              const barWidth = (stat.avg_km / maxKm) * 100;
              return (
                <div key={stat.owner} className="bar-item">
                  <span className="owner-label">{stat.owner}</span>
                  <div className="bar-background">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${barWidth}%` }}
                      title={`${stat.avg_km.toLocaleString()} km`}
                    />
                  </div>
                  <span className="km-value">{stat.avg_km.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}



      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Year</th>
              <th>Price (Rs)</th>
              <th>KM Driven</th>
              <th>Fuel</th>
              <th>Seller</th>
              <th>Transmission</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {currentCars.map((car, index) => (
              <tr key={index}>
                <td>{car.name}</td>
                <td>{car.year}</td>
                <td>{car.selling_price.toLocaleString()}</td>
                <td>{car.km_driven.toLocaleString()}</td>
                <td>{car.fuel}</td>
                <td>{car.seller_type}</td>
                <td>{car.transmission}</td>
                <td>{car.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCars.length > 0 && (
          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={nextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

export default App
