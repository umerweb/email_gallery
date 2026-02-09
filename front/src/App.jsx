import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GmailPage from './pages/gmail';
import HomePage from './pages/home';
import Gallery from './pages/gallery'
import Emailtemp from './pages/email'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/import/mail/admin" element={<GmailPage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/email/:id" element={<Emailtemp />} />
      </Routes>
    </Router>
  );
}

export default App;
