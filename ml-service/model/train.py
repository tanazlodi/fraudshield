import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import joblib
import os
from features import engineer_features, get_feature_columns

# ── 1. Load data ───────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv('../data/creditcard.csv')
print(f"Dataset shape: {df.shape}")
print(f"Fraud cases: {df['Class'].sum()} ({df['Class'].mean()*100:.2f}%)")

# ── 2. Feature engineering ─────────────────────────────────────
print("\nEngineering features...")
df = engineer_features(df)
feature_cols = get_feature_columns(df)

X = df[feature_cols]
y = df['Class']

# ── 3. Train/test split ────────────────────────────────────────
print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
# stratify=y ensures both train and test sets have the same
# 0.17% fraud ratio — important for imbalanced datasets

# ── 4. Scale features ──────────────────────────────────────────
print("Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
# fit_transform on train, transform only on test
# prevents data leakage — the scaler learns ONLY from training data

# ── 5. Handle class imbalance with SMOTE ──────────────────────
print("Applying SMOTE to handle class imbalance...")
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
print(f"After SMOTE — Fraud: {y_train_resampled.sum()}, Legit: {(y_train_resampled==0).sum()}")
# SMOTE creates synthetic fraud examples so the model sees
# equal numbers of fraud and legit transactions during training

# ── 6. Build ensemble model ────────────────────────────────────
print("\nTraining ensemble model...")
log_reg = LogisticRegression(max_iter=1000, random_state=42)
random_forest = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
xgb = XGBClassifier(random_state=42, eval_metric='logloss')

ensemble = VotingClassifier(
    estimators=[
        ('lr', log_reg),
        ('rf', random_forest),
        ('xgb', xgb)
    ],
    voting='soft'  # soft voting uses predicted probabilities, not just yes/no
)

ensemble.fit(X_train_resampled, y_train_resampled)

# ── 7. Evaluate ────────────────────────────────────────────────
print("\nEvaluating model...")
y_pred = ensemble.predict(X_test_scaled)
y_prob = ensemble.predict_proba(X_test_scaled)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Legit', 'Fraud']))

print(f"AUC-ROC Score: {roc_auc_score(y_test, y_prob):.4f}")

print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"True Negatives:  {cm[0][0]:,}  (legit correctly identified)")
print(f"False Positives: {cm[0][1]:,}  (legit wrongly flagged as fraud)")
print(f"False Negatives: {cm[1][0]:,}  (fraud missed)")
print(f"True Positives:  {cm[1][1]:,}  (fraud correctly caught)")

# ── 8. Save model and scaler ───────────────────────────────────
print("\nSaving model and scaler...")
os.makedirs('./saved', exist_ok=True)
joblib.dump(ensemble, './saved/fraud_model.pkl')
joblib.dump(scaler, './saved/scaler.pkl')
joblib.dump(feature_cols, './saved/feature_cols.pkl')
print("✅ Model saved to ml-service/model/saved/")