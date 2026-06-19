import pandas as pd
import numpy as np
import random

np.random.seed(42)
random.seed(42)

N = 10000

categories = ['grocery', 'electronics', 'restaurant', 'travel', 'online', 'atm', 'gas', 'other']
countries = ['USA', 'UK', 'Nigeria', 'Japan', 'Russia', 'Brazil']

rows = []

for i in range(N):
    category = random.choice(categories)
    country = random.choice(countries)
    hour = random.randint(0, 23)

    # Base "normal" amount ranges per category
    base_amount = {
        'grocery': np.random.uniform(10, 150),
        'electronics': np.random.uniform(50, 800),
        'restaurant': np.random.uniform(10, 100),
        'travel': np.random.uniform(100, 1200),
        'online': np.random.uniform(10, 300),
        'atm': np.random.uniform(20, 400),
        'gas': np.random.uniform(20, 100),
        'other': np.random.uniform(10, 200),
    }[category]

    amount = base_amount
    is_night = 1 if (hour >= 22 or hour <= 5) else 0
    is_foreign = 1 if country != 'USA' else 0

    # ── Fraud rules (ground truth labels) ──────────────────────
    fraud_score_signal = 0

    if amount > 2000:
        fraud_score_signal += 3
    elif amount > 800:
        fraud_score_signal += 1

    if is_night:
        fraud_score_signal += 1

    if is_foreign:
        fraud_score_signal += 1

    if category == 'atm' and amount > 500:
        fraud_score_signal += 2

    if category == 'online' and is_night and amount > 300:
        fraud_score_signal += 2

    # occasionally inject a high-amount fraud transaction regardless of category
    if random.random() < 0.02:
        amount = np.random.uniform(2000, 8000)
        fraud_score_signal += 3

    # Convert signal into probability, add noise, then binarize
    fraud_prob = 1 / (1 + np.exp(-(fraud_score_signal - 3)))  # sigmoid centered at 3
    is_fraud = 1 if (fraud_prob + np.random.normal(0, 0.1)) > 0.5 else 0

    rows.append({
        'amount': round(amount, 2),
        'merchant_category': category,
        'country': country,
        'hour_of_day': hour,
        'is_night': is_night,
        'is_foreign': is_foreign,
        'is_fraud': is_fraud
    })

df = pd.DataFrame(rows)
df.to_csv('../data/synthetic_transactions.csv', index=False)

print(f"Generated {len(df)} transactions")
print(f"Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")
print(df.head())