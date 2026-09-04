import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
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
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminTheatres from './pages/admin/AdminTheatres';
import AdminShows from './pages/admin/AdminShows';
import AdminBookings from './pages/admin/AdminBookings';
import AdminVerify from './pages/admin/AdminVerify';
import AdminUsers from './pages/admin/AdminUsers';
import Snacks from './pages/Snacks';
import AdminSnacks from './pages/admin/AdminSnacks';
import VerifierRoute from './components/VerifierRoute';
import ScanTicket from './pages/ScanTicket';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/scan" element={<VerifierRoute><ScanTicket /></VerifierRoute>} />
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
              <Route path="/movies/:id" element={<MovieDetails />} />
              <Route path="/book/:movieId" element={<BookShow />} />
              <Route path="/seats/:showId" element={<SeatSelection />} />
              <Route path="/snacks/:showId" element={<Snacks />} />
              <Route path="/summary/:showId" element={<BookingSummary />} />
              <Route path="/ticket/:bookingId" element={<Ticket />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />

              <Route path="/admin-panel" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="movies" element={<AdminMovies />} />
                <Route path="theatres" element={<AdminTheatres />} />
                <Route path="shows" element={<AdminShows />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="verify" element={<AdminVerify />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="snacks" element={<AdminSnacks />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;