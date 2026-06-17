import joblib
import pandas as pd
import numpy as np
import os

# Load model artifacts once when this module is imported
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, 'saved', 'fraud_model.pkl'))
scaler = joblib.load(os.path.join(BASE_DIR, 'saved', 'scaler.pkl'))
feature_cols = joblib.load(os.path.join(BASE_DIR, 'saved', 'feature_cols.pkl'))


def predict_fraud(transaction_data: dict) -> dict:
    """
    Takes a transaction dict and returns a fraud score + prediction.

    Since our model was trained on the Kaggle dataset's anonymized
    V1-V28 features, and real transactions from our simulator won't
    have those, we generate synthetic V1-V28 values based on whether
    we want to simulate a "normal" or "suspicious" transaction pattern.
    """

    # Build a single-row dataframe matching training feature columns
    row = {}

    # Use provided amount, or default to 0
    amount = transaction_data.get('amount', 0)
    row['Amount'] = amount

    # Generate V1-V28 — in production these would come from real
    # transaction signals (device fingerprint, velocity checks, etc.)
    # Here we use small random noise centered around 0, which is
    # what legitimate transactions look like in the trained data
    seed = abs(hash(transaction_data.get('transaction_id', 'default'))) % (2**32)
    np.random.seed(seed)
    for i in range(1, 29):
        row[f'V{i}'] = np.random.normal(0, 1)

    df = pd.DataFrame([row])

    # Apply same feature engineering as training
    df['amount_log'] = np.log1p(df['Amount'])
    df['amount_squared'] = df['Amount'] ** 2

    timestamp = transaction_data.get('timestamp')
    if timestamp:
        ts = pd.to_datetime(timestamp)
        hour = ts.hour
    else:
        hour = 12  # default to noon

    df['hour_of_day'] = hour
    df['is_night'] = 1 if (hour >= 22 or hour <= 5) else 0

    # Reorder columns to match training
    df = df[feature_cols]

    # Scale and predict
    X_scaled = scaler.transform(df)
    fraud_prob = model.predict_proba(X_scaled)[0][1]
    is_fraud = bool(fraud_prob >= 0.5)

    return {
        'fraud_score': round(float(fraud_prob), 4),
        'is_fraud': is_fraud
    }