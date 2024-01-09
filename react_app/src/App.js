import React, { useEffect, useState } from 'react';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';

function App() {
  const [data, setData] = useState([]);

  const columns = [
  { title: "id", field: "id"},
  { title: "Date", field: "date_time" },
  { title: "description", field: "description" },
  { title: "Institution", field: "institution" },
  { title: "Account Name", field: "name" },
  { title: "Account Number", field: "account number" },
  { title: "Debit", field: "debit" },
  { title: "Credit", field: "credit" },
  { title: "Balance", field: "balance" },
  { title: "Currency", field: "currency" },
  { title: "Tags", field: "tags" },
  { title: "Type", field: "transaction_type" },
  { title: "Account Type", field: "account_type" }
  ];

  useEffect(() => {
    fetch('http://localhost:4000/data')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="App">
      <ReactTabulator
        data={data} // Data passed here after fetching
        columns={columns}
        layout={"fitData"}
      />
    </div>
  );
}

export default App;
