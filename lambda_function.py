import json
import boto3
import pandas as pd
from io import BytesIO
import re

def lambda_handler(event, context):
    try:
        s3 = boto3.client('s3')
        
        # Assume single record for new file upload
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        print(f"Processing file: s3://{bucket}/{key}")
        
        # Download CSV with robust encoding
        obj = s3.get_object(Bucket=bucket, Key=key)
        csv_content = obj['Body'].read()
        df = pd.read_csv(BytesIO(csv_content), encoding='utf-8', errors='replace')
        input_rows = len(df)
        print(f"Loaded {input_rows} rows from {len(df.columns)} columns")
        print(f"Columns: {list(df.columns)}")
        
        if input_rows == 0:
            print("Empty file")
            return {'statusCode': 200, 'body': json.dumps('Empty file')}
        
        # Standardize column names
        price_col = None
        for col in ['selling_price', 'price', 'Cars Prices']:
            if col in df.columns:
                price_col = col
                break
        
        mileage_col = None
        for col in ['km_driven', 'mileage']:
            if col in df.columns:
                mileage_col = col
                break
        
        year_col = 'year' if 'year' in df.columns else None
        
        name_cols = []
        if 'name' in df.columns:
            name_cols = ['name']
        elif 'Cars Names' in df.columns:
            name_cols = ['Cars Names']
        elif all(c in df.columns for c in ['brand', 'model']):
            df['vehicle_name'] = df['brand'].astype(str) + ' ' + df['model'].astype(str)
            name_cols = ['vehicle_name']
        
        fuel_col = 'fuel' if 'fuel' in df.columns else ('Fuel Types' if 'Fuel Types' in df.columns else None)
        transmission_col = 'transmission' if 'transmission' in df.columns else None
        seller_type_col = 'seller_type' if 'seller_type' in df.columns else None
        owner_col = 'owner' if 'owner' in df.columns else None
        
        if not price_col:
            print("No price column found")
            return {'statusCode': 400, 'body': json.dumps('No price column found')}
        
        if not year_col:
            print("No year column found")
            return {'statusCode': 400, 'body': json.dumps('No year column found')}
        
        # Rename key columns
        df = df.rename(columns={price_col: 'price', mileage_col: 'mileage' if mileage_col else None, year_col: 'year'})
        if mileage_col:
            df = df.rename(columns={mileage_col: 'mileage'})
        
        # Clean price column
        df['price'] = df['price'].astype(str).str.replace(r'[\$,]', '', regex=True).str.strip()
        df['price'] = pd.to_numeric(df['price'], errors='coerce')
        
        # Cleaning steps
        df = df.drop_duplicates()
        print(f"After drop_duplicates: {len(df)} rows")
        
        # Drop rows with NaN in critical columns
        critical_cols = ['price', 'year']
        if 'mileage' in df.columns:
            critical_cols.append('mileage')
        df = df.dropna(subset=critical_cols)
        print(f"After dropna critical: {len(df)} rows")
        
        # Convert numerics
        df['year'] = pd.to_numeric(df['year'], errors='coerce')
        if 'mileage' in df.columns:
            df['mileage'] = pd.to_numeric(df['mileage'], errors='coerce')
        
        df = df.dropna(subset=['price', 'year'])
        print(f"After numeric conversion/dropna: {len(df)} rows")
        
        # Filter valid data
        df = df[(df['price'] > 0) & (df['year'].between(1900, 2030))]
        if 'mileage' in df.columns:
            df = df[df['mileage'] > 0]
        print(f"After value filters: {len(df)} rows")
        
        # Categorical filters if columns exist
        if fuel_col:
            valid_fuel = ['Petrol', 'Diesel', 'CNG', 'LPG', 'plug in hybrid', 'Hybrid', 'Electric', 'Petrol/Hybrid']
            df = df[df[fuel_col].astype(str).str.strip().isin(valid_fuel)]
            print(f"After fuel filter: {len(df)} rows")
        
        if transmission_col:
            valid_transmission = ['Manual', 'Automatic']
            df = df[df[transmission_col].astype(str).str.strip().isin(valid_transmission)]
            print(f"After transmission filter: {len(df)} rows")
        
        # Strip whitespace from string columns
        str_cols = []
        if name_cols:
            str_cols.extend(name_cols)
        if fuel_col:
            str_cols.append(fuel_col)
        str_cols.extend([c for c in [transmission_col, seller_type_col, owner_col] if c])
        for col in str_cols:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
        
        # Sort for consistency - use available name/year
        sort_cols = ['year']
        if name_cols:
            sort_cols = name_cols + sort_cols
        df = df.sort_values(sort_cols).reset_index(drop=True)
        
        output_rows = len(df)
        print(f"Final cleaned data: {output_rows} rows")
        
        if output_rows == 0:
            print("No data after cleaning")
            return {
                'statusCode': 200,
                'body': json.dumps('No valid data after cleaning')
            }
        
        # Output key: silver/<filename>_clean.parquet
        output_key = key.replace('bronze/', 'silver/').rpartition('.')[0] + '_clean.parquet'
        
        # Convert to parquet
        parquet_buffer = BytesIO()
        df.to_parquet(parquet_buffer, index=False)
        parquet_buffer.seek(0)
        
        # Upload
        s3.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=parquet_buffer,
            ContentType='application/octet-stream'
        )
        
        print(f"Uploaded cleaned parquet to: s3://{bucket}/{output_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'ETL completed successfully',
                'input_rows': input_rows,
                'output_rows': output_rows,
                'input_key': key,
                'output_key': output_key
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
