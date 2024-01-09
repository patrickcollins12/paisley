import React, { useEffect, useState } from 'react';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
// import './patrick_tabulator.scss';

function App() {
  const [data, setData] = useState([]);

  const columns = [
    { title: "id", field: "id", resizable:true, width:10, visible:false},
    {
      title: "Date", field: "datetime", resizable: true,
      formatter: "datetime", formatterParams: {
        inputFormat: "iso",
        outputFormat: "dd/MM/yyyy",
        invalidPlaceholder: "(invalid date)",
        // timezone:"America/Los_Angeles",
      }
    },
    { title: "Description", field: "description", resizable: true, width:300, editor: "input" },
    { title: "Institution", field: "institution", resizable: true  },
    { title: "Account Name", field: "name" },
    { title: "Account Number", field: "account number" },
    { title: "Debit",   field: "debit", sorter:"number",  hozAlign: "right", formatter: "money", formatterParams: { thousand: ",", symbol: "$" } },
    { title: "Credit",  field: "credit", sorter:"number", hozAlign: "right", formatter: "money", formatterParams: { thousand: ",", symbol: "$" } },
    { title: "Balance", field: "balance",headerSort:false, hozAlign: "right", formatter: "money", formatterParams: { thousand: ",", symbol: "$" }},
    // // { title: "Currency", field: "currency" },
    { title: "Tags", field: "tags" },
    // // { title: "Type", field: "transaction_type" },
    // // { title: "Account Type", field: "account_type" }
  ];

  columns.forEach((column) => {
    column.headerFilter = true; // add header filter to every column
  });

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
        // layout={"fitData"}
        options={{
          // resizableColumnFit:true,
          pagination: "local",       //paginate the data
          paginationSize: 100,         //allow 7 rows per page of data
        }}

      />
    </div>
  );
}

export default App;
