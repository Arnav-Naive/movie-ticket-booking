import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setStatus('');
    try {
      const orderRes = await api.post('/payments/create-order/', { booking_id: bookingId });
      const { order_id, amount, currency, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        order_id: order_id,
        name: 'CineMax',
        description: 'Movie ticket booking',
        handler: async function (response) {
          try {
            await api.post('/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate(`/ticket/${bookingId}`);
          } catch (err) {
            setStatus('Payment verification failed: ' + (err.response?.data?.error || err.message));
          }
        },
        theme: { color: '#e0263f' },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setStatus('Order creation failed: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '20px' }}>Complete Payment</h1>
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          background: 'var(--red)', color: 'white', padding: '14px 40px',
          borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '16px'
        }}
      >
        {loading ? 'Opening payment...' : 'Pay Now'}
      </button>
      {status && <p style={{ color: 'var(--red)', marginTop: '20px' }}>{status}</p>}
    </div>
  );
}

export default Payment;