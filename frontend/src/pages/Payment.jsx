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
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);

    Promise.all([
      api.get('/wallet/'),
      api.get('/bookings/my/')
    ]).then(([walletRes, bookingsRes]) => {
      setWallet(walletRes.data);
      const b = bookingsRes.data.find(x => x.id === Number(bookingId));
      setBooking(b);
    }).catch(() => {})
    .finally(() => setInitLoading(false));
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

  if (initLoading) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
      <div className="skeleton" style={{ width: '250px', height: '40px', margin: '0 auto var(--space-xl)' }}></div>
      <div className="skeleton" style={{ width: '400px', height: '250px', margin: '0 auto', borderRadius: 'var(--radius-lg)' }}></div>
    </div>
  );

  const canPayWithWallet = wallet && booking && Number(wallet.balance) >= Number(booking.total_amount);

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', maxWidth: '500px' }}>
      <div className="card" style={{ padding: 'var(--space-2xl) var(--space-xl)', textAlign: 'center' }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', background: 'rgba(224, 38, 63, 0.1)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto var(--space-md)' }}>
          💳
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Complete Payment</h1>
        
        {booking && (
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 'var(--space-xl)' }}>
            ₹{Number(booking.total_amount).toFixed(2)}
          </div>
        )}

        {wallet && (
          <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>CineRP Wallet Balance</div>
            <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '18px' }}>₹{wallet.balance}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button onClick={handlePay} disabled={loading} className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '16px', width: '100%', maxWidth: '300px' }}>
            {loading ? 'Please wait...' : 'Pay securely with Razorpay'}
          </button>

          {canPayWithWallet && (
            <button onClick={handlePayWithWallet} disabled={loading} className="btn btn-ghost" style={{ padding: '16px 40px', fontSize: '16px', width: '100%', maxWidth: '300px' }}>
              Pay with CineRP
            </button>
          )}
          
          {wallet && booking && !canPayWithWallet && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 'var(--space-sm)' }}>
              Need ₹{(Number(booking.total_amount) - Number(wallet.balance)).toFixed(2)} more CineRP to pay fully with points.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payment;