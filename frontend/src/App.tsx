import { Route, Routes } from "react-router-dom";
import QuestionPage from "./pages/QuestionPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<QuestionPage />}></Route>
    </Routes>
  );
}

export default App;
