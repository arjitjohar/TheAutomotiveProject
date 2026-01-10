# The Automotive Project 🚗📈

Bluebook car market analytics pipeline using AWS serverless + fullstack web app.

## 🏗️ Architecture
```
CSV Upload (Bronze) → Lambda ETL → Parquet (Silver) → Athena Queries → Express API → React Dashboard
```

## ✨ Features
- **ETL Pipeline**: AWS Lambda processes raw car CSV (price, mileage, year, fuel, etc.) → cleaned Parquet in S3 silver/
- **Data Cleaning**: Dedupe, NaN removal, numeric parsing, valid range filters (year 1900-2030, price >0)
- **Analytics Backend**: Athena queries (us-east-1, DB: bluebook-market-analytics-pipeline-athena-query-results)
  - `/api/cars`: Top 500 cars
  - `/api/owner-stats`: Avg km by owner type
- **Frontend**: React/Vite dashboard (localhost:5173) fetching API (backend:3001)
- **Local Tools**: `convert_to_parquet.py` for dev data prep

## 🚀 Quick Start
### Backend (Athena API)
```bash
cd backend
npm install
npm start  # http://localhost:3001/api/cars
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### AWS Deploy (Manual)
1. Upload CSVs to S3 `bronze/`
2. Deploy `lambda_function.py` to Lambda (trigger S3 bronze/)
3. Create Athena table on `silver/` Parquet (silver-layer-silver)
4. Update backend DB/WorkGroup if needed

## 📊 Sample Data
Car listings: Toyota, Honda (price, km_driven, year, fuel: Petrol/Diesel, transmission, owner)

## 🔧 Tech Stack
- Python/Pandas (ETL)
- AWS: S3, Lambda, Athena
- Node/Express/AWS-SDK (Backend)
- React/Vite (Frontend)
- GitHub: https://github.com/arjitjohar/TheAutomotiveProject
