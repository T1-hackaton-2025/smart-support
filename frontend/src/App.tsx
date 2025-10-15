import { Route, Routes } from "react-router-dom";
import QuestionPage from "./pages/QuestionsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<QuestionPage />}></Route>
    </Routes>
  );
}

export default App;
