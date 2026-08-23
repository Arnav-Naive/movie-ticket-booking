import razorpay
from decouple import config

client = razorpay.Client(auth=(config('RAZORPAY_KEY_ID'), config('RAZORPAY_KEY_SECRET')))