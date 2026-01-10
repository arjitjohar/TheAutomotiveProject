import { useState, useEffect } from 'react'


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

  if (loading) return <div className="flex justify-center items-center h-screen w-screen text-2xl text-gray-500">Loading dashboard...</div>


  return (
    <div className="min-h-screen w-screen p-5 flex flex-col gap-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <h1 className="text-5xl font-bold text-center text-gray-800 mb-8 drop-shadow-lg">Car Dashboard</h1>
      
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 border border-gray-200">
        <h2 className="col-span-full text-2xl font-bold text-gray-700 mb-4">Filters</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fuel:</label>
          <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={filters.fuel} onChange={(e) => updateFilter('fuel', e.target.value)}>
            <option value="">All</option>
            {getUniqueOptions('fuel').map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transmission:</label>
          <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={filters.transmission} onChange={(e) => updateFilter('transmission', e.target.value)}>
            <option value="">All</option>
            {getUniqueOptions('transmission').map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seller Type:</label>
          <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={filters.seller_type} onChange={(e) => updateFilter('seller_type', e.target.value)}>
            <option value="">All</option>
            {getUniqueOptions('seller_type').map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Min Price:</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" type="number" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Price:</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" type="number" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 text-center text-lg font-semibold text-blue-600 mb-5">
        <p className="text-xl">Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredCars.length)} of {filteredCars.length} cars</p>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Rows per page:</label>
          <select className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={rowsPerPage} onChange={handleRowsChange}>
            {rowsOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {ownerStats.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-5">Avg KM Driven by Owner</h3>
          <div className="owner-bars">
            {ownerStats.map((stat) => {
              const maxKm = Math.max(...ownerStats.map(s => s.avg_km || 0));
              const barWidth = (stat.avg_km / maxKm) * 100;
              return (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="min-w-[120px] font-medium text-gray-700 text-sm">{stat.owner}</span>
                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500" 
                      style={{ width: `${barWidth}%` }}
                      title={`${stat.avg_km.toLocaleString()} km`}
                    />
                  </div>
                  <span className="min-w-[80px] text-right font-semibold text-blue-600 text-sm">{stat.avg_km.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}



      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Year</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Price (Rs)</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">KM Driven</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Fuel</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Seller</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Transmission</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sticky top-0">Owner</th>
            </tr>
          </thead>
          <tbody>
            {currentCars.map((car, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{car.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹{car.selling_price.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.km_driven.toLocaleString()} km</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    car.fuel === 'Petrol' ? 'bg-green-100 text-green-800' :
                    car.fuel === 'Diesel' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {car.fuel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.seller_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    car.transmission === 'Manual' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {car.transmission}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{car.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filteredCars.length > 0 && (
          <div className="flex justify-center items-center gap-4 p-6 pt-0 border-t border-gray-200 bg-gray-50">
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
