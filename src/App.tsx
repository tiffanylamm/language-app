import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import Register from "./register";
import Login from "./login";
import Conversion from "./conversion";
import SavedLists from "./savedLists";
import Scrubber from "./scrubber";
import { AuthContext } from "./contexts/AuthContext";
import Navbar from "./navbar";



const App = () => {

  const { token } = useContext(AuthContext)! ;

  return (
    <Router>
      <Navbar />
        <Routes>
          <Route path="/" element={token ? <SavedLists /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/conversion" element={<Conversion />} />
          <Route path="/saved-lists" element={<SavedLists />} />
          <Route path="/scrubber/:listId" element={<Scrubber />} />
        </Routes>
    </Router>
  )
};

export default App
