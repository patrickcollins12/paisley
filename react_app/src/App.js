import React, { useEffect, useState } from 'react';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
// import 'react-tabulator/lib/css/tabulator.min.css';
import './patrick_tabulator.scss';

function App() {
  const [data, setData] = useState([]);

  const columns = [

    // { title: "id", field: "id", resizable: true, width: 10, visible: false },


    {
      title: "Date", field: "datetime", frozen: true, resizable: true, width:200,
      formatter: "date", formatterParams: {
        inputFormat: "iso",
        // outputFormat: "dd/MM/yyyy",
        invalidPlaceholder: "(invalid date)",
        // timezone:"America/Los_Angeles",
      }
    },


    { title: "Description", field: "description", frozen: true, resizable: true, width: 300, editor: "input" },


    {
      title: "Account", field: "name", mutator: function (value, data, type, params, component) {
        return `${data.institution}  ${data.name} (... ${data["account number"]})`
      }
    },

    /// CREDIT
    {
      title: "Credit", field: "credit", sorter: "number", hozAlign: "right",
      formatter: "money", formatterParams: { thousand: ",", symbol: "$" },
      topCalc: "sum", topCalcFormatter: "money",
      topCalcFormatterParams: { thousand: ",", symbol: "$" }
    },

    /// DEBIT
    {
      title: "Debit", field: "debit", sorter: "number",
      hozAlign: "right", 
      formatter: "money", formatterParams: { thousand: ",", symbol: "$" },
      topCalc: "sum", topCalcFormatter: "money",
      topCalcFormatterParams: { thousand: ",", symbol: "$" }
    },

    /// BALANCE
    {
      title: "Balance", field: "balance", headerSort: false, hozAlign: "right",
      formatter: "money", formatterParams: { thousand: ",", symbol: "$" }
      // formatter: (cell) => this.moneyColFormatter(cell),
    },

    /// TAGS
    {
      title: "Tags", field: "tags", editor: "list",
      width: 300,
      mutator: function (value, data, type, params, component) {
        try {
          return JSON.parse(value)
        } catch(error) {
          return []
        }
      },
      editorParams: {
        clearable: true,
        autocomplete: true,
        freetext: true,
        multiselect: true,
        valuesURL: "http://localhost:4000/tags/"
      }
    },

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

  let heighty = window.innerHeight - 70;

  return (
    <div className="App">
      <ReactTabulator
        data={data} // Data passed here after fetching
        columns={columns}
        layout={"fitData"}
        options={{
          // resizableColumnFit:true,
          height: heighty,
          pagination: "local",       //paginate the data
          // paginationSize: 300,         //allow 7 rows per page of data
          movableColumns: true,
          persistence: {
            sort: true,
            filter: true,
            columns: true,
          },
          persistenceID: "examplePerststance"
        }}

      />
    </div>
  );
}

export default App;
