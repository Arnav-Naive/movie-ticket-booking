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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;