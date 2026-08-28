import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, []);

  const handlePay = async () => {
    setLoading(true);
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
            showToast('Payment successful! Booking confirmed.', 'success');
            navigate(`/ticket/${bookingId}`);
          } catch (err) {
            showToast(err.response?.data?.error || 'Payment verification failed.', 'error');
          }
        },
        theme: { color: '#e0263f' },
        modal: { ondismiss: () => setLoading(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to start payment.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '20px' }}>Complete Payment</h1>
      <button onClick={handlePay} disabled={loading} className="btn-primary" style={{ padding: '14px 40px', fontSize: '16px' }}>
        {loading ? 'Opening payment...' : 'Pay Now'}
      </button>
    </div>
  );
}

export default Payment;