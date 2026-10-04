import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './index.css';
import reportWebVitals from './reportWebVitals';


//Imports der einzelnen Seiten
import Navbar from "./Navbar";
import Home from "./Sites/Home"
import Game from "./Sites/Game"
import Multiplayer from "./Sites/Multiplayer"
import ApiForm from "./Sites/ApiForm";
import AddSong from "./Sites/AddSong"
import AddSongNew from "./Sites/AddSong_updated.tsx"



// SemanticUI css Einbindung
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);

export default function Routing() {
  return (       
      
    //Router für die einzelnen Elemente
   <Router>
     <Navbar />
     <hr color='#2d394d'/>
   <Routes> 
          
          <Route index element={<Home/>} />
          <Route path='/singleplayer' element={<Game />} />
          <Route path='/multiplayer' element={<Multiplayer />} />
          
          <Route path='/addgame' element={<ApiForm />}   />
          <Route path='/addsong' element={<AddSongNew />}   />
    </Routes>
   </Router>
  );
}

//Elemente werden auf html geladen
ReactDOM.render(
  <React.StrictMode>
    <Routing />
  </React.StrictMode>,
  
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
