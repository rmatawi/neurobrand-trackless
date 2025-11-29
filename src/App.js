import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import LandingPage from "./components/LandingPage";
import TracklessVideoEditor from "./components/TracklessVideoEditorRefactored";
import TestDialogComponent from "./components/TestDialogComponent";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return <LandingPage />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trackless-video-editor" element={<TracklessVideoEditor />} />
          <Route path="/test-dialog" element={<TestDialogComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;