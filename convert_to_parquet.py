import pandas as pd
import glob
import os

os.makedirs('data', exist_ok=True)

csv_files = glob.glob('*.csv')
print(f'Found CSV files: {csv_files}')

for csv_file in csv_files:
    base_name = csv_file.rsplit('.', 1)[0]
    parquet_path = f'data/{base_name}.parquet'
    df = pd.read_csv(csv_file, encoding='utf-8', encoding_errors='replace')
    print(f'CSV {csv_file}: {len(df)} rows, columns: {list(df.columns)}')
    df.to_parquet(parquet_path, index=False)
    print(f'Created {parquet_path}')

print('All conversions complete!')
