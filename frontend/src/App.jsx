import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Payment from './pages/Payment';
import MovieDetails from './pages/MovieDetails';
import BookShow from './pages/BookShow';
import SeatSelection from './pages/SeatSelection';
import BookingSummary from './pages/BookingSummary';
import Ticket from './pages/Ticket';
import MyBookings from './pages/MyBookings';
import Footer from './components/Footer';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/book/:movieId" element={<BookShow />} />
          <Route path="/seats/:showId" element={<SeatSelection />} />
          <Route path="/summary/:showId" element={<BookingSummary />} />
          <Route path="/ticket/:bookingId" element={<Ticket />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;