import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);

    api.get('/wallet/').then(res => setWallet(res.data)).catch(() => {});
    api.get('/bookings/my/').then(res => {
      const b = res.data.find(x => x.id === Number(bookingId));
      setBooking(b);
    }).catch(() => {});
  }, [bookingId]);

  const handlePay = async () => {
    setLoading(true);
    try {
      const orderRes = await api.post('/payments/create-order/', { booking_id: bookingId });
      const { order_id, amount, currency, key_id } = orderRes.data;

      const options = {
        key: key_id, amount, currency, order_id,
        name: 'CineMax', description: 'Movie ticket booking',
        handler: async function (response) {
          try {
            await api.post('/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast('Payment successful! Booking confirmed.', 'success');
            navigate(`/ticket/${bookingId}`);
          } catch (err) {
            showToast(err.response?.data?.error || 'Payment verification failed.', 'error');
          }
        },
        theme: { color: '#e0263f' },
        modal: { ondismiss: () => setLoading(false) }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to start payment.', 'error');
      setLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    setLoading(true);
    try {
      await api.post(`/bookings/${bookingId}/pay-with-wallet/`);
      showToast('Booking confirmed using CineRP!', 'success');
      navigate(`/ticket/${bookingId}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to pay with CineRP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canPayWithWallet = wallet && booking && Number(wallet.balance) >= Number(booking.total_amount);

  return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '12px' }}>Complete Payment</h1>
      {wallet && (
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '28px' }}>
          Your CineRP balance: ₹{wallet.balance}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        <button onClick={handlePay} disabled={loading} className="btn-primary" style={{ padding: '14px 40px', fontSize: '16px', width: '260px' }}>
          {loading ? 'Please wait...' : 'Pay with Razorpay'}
        </button>

        {canPayWithWallet && (
          <button onClick={handlePayWithWallet} disabled={loading} className="btn-ghost" style={{ padding: '14px 40px', fontSize: '16px', width: '260px' }}>
            Pay with CineRP (₹{booking.total_amount})
          </button>
        )}
        {wallet && booking && !canPayWithWallet && (
          <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
            Need ₹{(Number(booking.total_amount) - Number(wallet.balance)).toFixed(2)} more CineRP to pay fully with points.
          </p>
        )}
      </div>
    </div>
  );
}

export default Payment;