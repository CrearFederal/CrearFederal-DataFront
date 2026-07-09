import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Evaluaciones from "./pages/Evaluaciones";
import EvaluacionesDeportistas from "./pages/EvaluacionesDeportistas";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/evaluaciones" element={<Evaluaciones />} />
        <Route path="/deteccion-talentos" element={<EvaluacionesDeportistas />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;