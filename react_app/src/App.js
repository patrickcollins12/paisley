import './App.css';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator_semanticui.min.css'; // theme
import { ReactTabulator } from 'react-tabulator'

const columns = [
  { title: "Name", field: "name", width: 150 },
  { title: "Age", field: "age", hozAlign: "left", formatter: "progress" },
  { title: "Favourite Color", field: "col" },
  { title: "Date Of Birth", field: "dob", hozAlign: "center" },
  { title: "Rating", field: "rating", hozAlign: "center", formatter: "star" },
  { title: "Passed?", field: "passed", hozAlign: "center", formatter: "tickCross" }
];

var data = [
  {id:1, name:"Oli Bob", age:"12", col:"red", dob:"",rating:1},
  {id:2, name:"Mary May", age:"1", col:"blue", dob:"14/05/1982",rating:1},
  {id:3, name:"Christine Lobowski", age:"42", col:"green", dob:"22/05/1982",rating:1},
  {id:4, name:"Brendon Philips", age:"125", col:"orange", dob:"01/08/1980", rating:2},
  {id:5, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999","rating":5},
];
 
function App() {
  return (
    <div className="App">
      <ReactTabulator
        data={data}
        columns={columns}
        layout={"fitData"}
      />
    </div>
  );
}

export default App;