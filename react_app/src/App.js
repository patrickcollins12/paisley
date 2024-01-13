import React, { useEffect, useState, useRef } from 'react';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
// import 'react-tabulator/lib/css/tabulator.min.css';
import './paisley_tabulator.scss';

function App() {
  const [data, setData] = useState([]);
  let tabulatorRef = useRef(null);


  const columns = [

    // { title: "id", field: "id", resizable: true, width: 10, visible: false },


    {
      title: "Date", field: "datetime", frozen: true, resizable: true, width: 200,
      formatter: "datetime", formatterParams: {
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
        } catch (error) {
          return []
        }
      },
      editorParams: {
        // clearable: true,
        autocomplete: false,
        // freetext: true,
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

  // function clearFilter() {
  //   const tabulatorInstance = this.ref.current && this.ref.current.table;
  //   if (tabulatorInstance) {
  //     tabulatorInstance.clearFilter();
  //   } else {
  //     alert('You clicked me!' , tabulatorRef);
  //   }
    
  // }

  function handleCellEdit(cell) {
    const rowObj = cell.getRow().getData()
    var columnField = cell.getColumn().getField();
    const cellValue = cell.getValue()
    console.log('cell edited', cell, cellValue&&cellValue.toString(), rowObj.id, columnField  );
  }

  return (
    <div className="App">
      {/* <button onClick={clearFilter}>Default</button>  */}

      <ReactTabulator
        // ref={tabulatorRef}
        onRef={(r) => (tabulatorRef = r)}
        // onRef={(r) => (ref = r)}
        data={data} // Data passed here after fetching
        columns={columns}
        layout={"fitData"}

        // attach event listeners
        events={{
          cellEdited: handleCellEdit,
          cellEditing: handleCellEdit
        }}

        options={{
          // resizableColumnFit:true,
          height: heighty,
          pagination: "local",
          // paginationSize: 300,  
          movableColumns: true,
            // persistence: {
            //   sort: true,
            //   filter: true,
            //   columns: true,
            // },
            // persistenceID: "examplePerststance2"
        }}

      />
    </div>
  );
}

export default App;
