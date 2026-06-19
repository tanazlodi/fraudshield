import joblib
import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, 'saved_v2', 'fraud_model.pkl'))
scaler = joblib.load(os.path.join(BASE_DIR, 'saved_v2', 'scaler.pkl'))
feature_cols = joblib.load(os.path.join(BASE_DIR, 'saved_v2', 'feature_cols.pkl'))

ALL_CATEGORIES = ['grocery', 'electronics', 'restaurant', 'travel', 'online', 'atm', 'gas', 'other']
ALL_COUNTRIES = ['USA', 'UK', 'Nigeria', 'Japan', 'Russia', 'Brazil']


def predict_fraud(transaction_data: dict) -> dict:
    """
    Scores a transaction using real fields: amount, category,
    country, and time of day — no synthetic V1-V28 noise.
    """

    amount = transaction_data.get('amount', 0)
    category = transaction_data.get('merchant_category', 'other')

    # Try to infer country from location, default to USA
    location = transaction_data.get('location') or {}
    country = location.get('country', 'USA') if isinstance(location, dict) else 'USA'
    if country not in ALL_COUNTRIES:
        country = 'USA'
    if category not in ALL_CATEGORIES:
        category = 'other'

    timestamp = transaction_data.get('timestamp')
    if timestamp:
        ts = pd.to_datetime(timestamp)
        hour = ts.hour
    else:
        hour = 12

    is_night = 1 if (hour >= 22 or hour <= 5) else 0
    is_foreign = 1 if country != 'USA' else 0

    # Build a single row with the same raw columns as training
    row = {
        'amount': amount,
        'hour_of_day': hour,
        'is_night': is_night,
        'is_foreign': is_foreign,
    }

    # One-hot encode category and country manually to match training columns
    for cat in ALL_CATEGORIES:
        row[f'merchant_category_{cat}'] = 1 if category == cat else 0
    for c in ALL_COUNTRIES:
        row[f'country_{c}'] = 1 if country == c else 0

    df = pd.DataFrame([row])

    # Reorder/select columns to exactly match training feature_cols
    # Fill any missing columns with 0 (safety net)
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
    df = df[feature_cols]

    X_scaled = scaler.transform(df)
    fraud_prob = model.predict_proba(X_scaled)[0][1]
    is_fraud = bool(fraud_prob >= 0.5)

    return {
        'fraud_score': round(float(fraud_prob), 4),
        'is_fraud': is_fraud
    }