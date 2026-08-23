import { useState } from 'react';
import api from '../services/api';

function Payment() {
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState('');

  const handlePay = async () => {
    try {
      // Step A: create order on backend
      const orderRes = await api.post('/payments/create-order/', { booking_id: bookingId });
      const { order_id, amount, currency, key_id } = orderRes.data;

      // Step B: open Razorpay checkout
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        order_id: order_id,
        name: 'CineMax',
        description: 'Movie ticket booking',
        handler: async function (response) {
          // Step C: send payment response to backend for verification
          try {
            const verifyRes = await api.post('/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatus('Success: ' + verifyRes.data.message);
          } catch (err) {
            setStatus('Verification failed: ' + (err.response?.data?.error || err.message));
          }
        },
        theme: { color: '#e0263f' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setStatus('Order creation failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h1>Payment</h1>
      <input
        placeholder="Booking ID"
        value={bookingId}
        onChange={(e) => setBookingId(e.target.value)}
      />
      <button onClick={handlePay}>Pay Now</button>
      <p>{status}</p>
    </div>
  );
}

export default Payment;