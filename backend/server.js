const express = require('express');
const cors = require('cors');
const { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } = require("@aws-sdk/client-athena");

const app = express();
const PORT = 3001;

const client = new AthenaClient({ region: "us-east-1" });



app.use(cors());
app.use(express.json());

async function queryAthena(sql) {
  const startParams = {
    QueryString: sql,
    QueryExecutionContext: { Database: "bluebook-market-analytics-pipeline-athena-query-results" },
    WorkGroup: "primary"
  };


  let queryExecution = await client.send(new StartQueryExecutionCommand(startParams));
  let queryExecutionId = queryExecution.QueryExecutionId;

  // Poll for completion
  let status = 'RUNNING';
  while (status === 'RUNNING' || status === 'QUEUED') {
    const execResponse = await client.send(new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId }));
    status = execResponse.QueryExecution.Status.State;
    if (status === 'FAILED' || status === 'CANCELLED') {
      throw new Error(`Query ${status}: ${execResponse.QueryExecution.Status.StateChangeReason || 'Unknown error'}`);
    }
    if (status === 'SUCCEEDED') break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Get results
  const resultsResponse = await client.send(new GetQueryResultsCommand({ QueryExecutionId: queryExecutionId }));
  const columns = resultsResponse.ResultSet.ResultSetMetadata.ColumnInfo.map(col => col.Name);
  const rows = resultsResponse.ResultSet.Rows.slice(1); // Skip header

  const data = rows.map(row => {
    const obj = {};
    row.Data.forEach((cell, index) => {
      let value = cell.VarCharValue || null;
      const colName = columns[index];
      // Parse numerics based on expected columns
      if (['year', 'selling_price', 'km_driven', 'avg_km'].includes(colName)) {
        obj[colName] = value ? parseInt(value, 10) : null;
      } else {
        obj[colName] = value;
      }
    });
    return obj;
  });


  return data;
}

app.get('/api/cars', async (req, res) => {

  try {
    const sql = `SELECT * FROM "AwsDataCatalog"."bluebook-market-analytics-pipeline-athena-query-results"."silver-layer-silver" LIMIT 500`;
    const data = await queryAthena(sql);
    res.json(data);
  } catch (error) {
    console.error('Athena query error:', error);
    res.status(500).json({ error: 'Failed to query Athena: ' + error.message });
  }
});

app.get('/api/owner-stats', async (req, res) => {
  try {
    const sql = `SELECT owner, AVG(km_driven) as avg_km FROM "AwsDataCatalog"."bluebook-market-analytics-pipeline-athena-query-results"."silver-layer-silver" GROUP BY owner ORDER BY avg_km DESC`;
    const data = await queryAthena(sql);
    res.json(data);
  } catch (error) {
    console.error('Athena owner-stats error:', error);
    res.status(500).json({ error: 'Failed to query owner stats: ' + error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
