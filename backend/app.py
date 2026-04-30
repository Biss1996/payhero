from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PAYHERO_BASIC_AUTH_TOKEN = os.getenv("PAYHERO_BASIC_AUTH_TOKEN")
PAYHERO_CHANNEL_ID = os.getenv("PAYHERO_CHANNEL_ID")
PAYHERO_ACCOUNT_ID = os.getenv("PAYHERO_ACCOUNT_ID")
PAYHERO_CALLBACK_URL = os.getenv("PAYHERO_CALLBACK_URL")


@app.route("/")
def home():
    return "PayHero backend running 🚀"


def clean_reference(reference):
    if not reference:
        return "PAYMENT"

    return "".join(
        char for char in str(reference).strip()
        if char.isalnum() or char in ["-", "_"]
    )[:40]


@app.route("/payhero-payment", methods=["POST"])
def stkpush():
    data = request.json or {}

    phone = data.get("phone")
    amount = data.get("amount")
    reference = clean_reference(data.get("reference", "PAYMENT"))

    if not phone or not amount:
        return jsonify({
            "success": False,
            "message": "Phone and amount are required"
        }), 400

    payload = {
        "amount": float(amount),
        "phone_number": str(phone),
        "provider": "m-pesa",
        "network_code": "63902",
        "channel_id": int(PAYHERO_CHANNEL_ID),
        "account_id": int(PAYHERO_ACCOUNT_ID),
        "external_reference": reference,
        "callback_url": PAYHERO_CALLBACK_URL
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {PAYHERO_BASIC_AUTH_TOKEN}"
    }

    try:
        response = requests.post(
            "https://api.payhero.africa/api/v2/payments",
            json=payload,
            headers=headers,
            timeout=30
        )

        return jsonify(response.json()), response.status_code

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "STK push failed",
            "error": str(e)
        }), 500


@app.route("/payhero-webhook", methods=["POST"])
def payhero_webhook():
    data = request.json or {}

    print("PayHero webhook received:", data)

    if data.get("success") is True and data.get("status") == "success":
        print("Payment completed:", data.get("external_reference"))

    return jsonify({
        "received": True
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)