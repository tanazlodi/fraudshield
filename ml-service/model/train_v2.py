import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import joblib
import os

# ── 1. Load synthetic data ─────────────────────────────────────
print("Loading synthetic dataset...")
df = pd.read_csv('../data/synthetic_transactions.csv')
print(f"Dataset shape: {df.shape}")
print(f"Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")

# ── 2. One-hot encode categorical columns ──────────────────────
print("\nEncoding categorical features...")
df_encoded = pd.get_dummies(df, columns=['merchant_category', 'country'])

feature_cols = [col for col in df_encoded.columns if col != 'is_fraud']
X = df_encoded[feature_cols]
y = df_encoded['is_fraud']

# ── 3. Train/test split ────────────────────────────────────────
print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── 4. Scale features ──────────────────────────────────────────
print("Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ── 5. Train ensemble model ────────────────────────────────────
# Note: no SMOTE here since 3% fraud rate isn't as severely
# imbalanced as the original 0.17% — class_weight handles it fine
print("\nTraining ensemble model...")
log_reg = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
random_forest = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42, n_jobs=-1)
xgb = XGBClassifier(random_state=42, eval_metric='logloss', scale_pos_weight=10)

ensemble = VotingClassifier(
    estimators=[('lr', log_reg), ('rf', random_forest), ('xgb', xgb)],
    voting='soft'
)

ensemble.fit(X_train_scaled, y_train)

# ── 6. Evaluate ─────────────────────────────────────────────────
print("\nEvaluating model...")
y_pred = ensemble.predict(X_test_scaled)
y_prob = ensemble.predict_proba(X_test_scaled)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Legit', 'Fraud']))
print(f"AUC-ROC Score: {roc_auc_score(y_test, y_prob):.4f}")

cm = confusion_matrix(y_test, y_pred)
print("\nConfusion Matrix:")
print(f"True Negatives:  {cm[0][0]:,}")
print(f"False Positives: {cm[0][1]:,}")
print(f"False Negatives: {cm[1][0]:,}")
print(f"True Positives:  {cm[1][1]:,}")

# ── 7. Save model artifacts ─────────────────────────────────────
print("\nSaving model and scaler...")
os.makedirs('./saved_v2', exist_ok=True)
joblib.dump(ensemble, './saved_v2/fraud_model.pkl')
joblib.dump(scaler, './saved_v2/scaler.pkl')
joblib.dump(feature_cols, './saved_v2/feature_cols.pkl')
print("✅ Model saved to ml-service/model/saved_v2/")