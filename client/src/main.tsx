import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "Frosty's Ice Blasting Solutions - Management System";

createRoot(document.getElementById("root")!).render(<App />);
