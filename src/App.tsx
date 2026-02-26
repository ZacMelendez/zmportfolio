import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "jotai";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { CursorGlow } from "./components/CursorGlow";
import { Suspense } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";

function App() {
    return (
        <Router>
            <div className="bg-gray-900 text-gray-300 lg:h-screen min-h-[600px] lg:overflow-y-scroll flex flex-col lg:flex-row w-screen">
                <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
                    <Suspense>
                        <CursorGlow />
                    </Suspense>
                    <Header />
                    <div className="mt-52 lg:mt-0 overflow-y-auto z-40 w-full flex-1">
                        <Provider>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/about" element={<About />} />
                                <Route
                                    path="/projects"
                                    element={<Projects />}
                                />
                            </Routes>
                        </Provider>
                    </div>
                </div>
                <Sidebar />
            </div>
        </Router>
    );
}

export default App;
