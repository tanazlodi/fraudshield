from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Allow importing from model/ folder
sys.path.append(os.path.join(os.path.dirname(__file__), 'model'))
from predict import predict_fraud

app = FastAPI(title="FraudShield ML Service")

# Allow the Express server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request schema ──────────────────────────────────────────────
class TransactionInput(BaseModel):
    transaction_id: str
    amount: float
    merchant_category: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    card_last_four: str
    timestamp: Optional[str] = None


# ── Response schema ─────────────────────────────────────────────
class ScoreOutput(BaseModel):
    fraud_score: float
    is_fraud: bool


# ── Routes ───────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "FraudShield ML service is running"}


@app.post("/score", response_model=ScoreOutput)
def score_transaction(transaction: TransactionInput):
    result = predict_fraud(transaction.dict())
    return result