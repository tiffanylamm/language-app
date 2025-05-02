import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "flex-end",
      padding: "1rem",
      backgroundColor: "#f0f0f0"
    }}>
      <Link to="/login" style={{ marginLeft: "1rem" }}>Login</Link>
      <Link to="/register" style={{ marginLeft: "1rem" }}>Register</Link>
      <Link to="/conversion" style={{ marginLeft: "1rem" }}>Conversion</Link>
      <Link to="/saved-lists" style={{ marginLeft: "1rem" }}>Saved Lists</Link>
    </nav>
  );
};

export default Navbar;
