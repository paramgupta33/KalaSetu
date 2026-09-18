"""
api.py - Isolated FastAPI Microservice for Price Prediction.
Exposes POST /predict-price independently from existing frontend and backend.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from predict import predict_price

app = FastAPI(
    title="Indian E-Commerce Price Prediction Prototype",
    description="Isolated XGBoost Pricing Service trained on Flipkart e-commerce sample. Predicts baseline retail price in INR.",
    version="1.0.0"
)

class PricePredictionRequest(BaseModel):
    product_name: str = Field(..., example="Handcrafted Brass Diya Oil Lamp Set")
    primary_category: Optional[str] = Field("Home Decor & Festive Needs", example="Home Decor & Festive Needs")
    sub_category: Optional[str] = Field("Festive Decor", example="Festive Decor")
    brand: Optional[str] = Field("Unbranded / Independent", example="Unbranded / Independent")
    description: Optional[str] = Field("", example="Traditional handmade brass oil lamp with fine engraving for puja and festive celebration.")
    spec_count: Optional[int] = Field(2, ge=0, example=3)
    image_count: Optional[int] = Field(1, ge=0, example=2)
    category_depth: Optional[int] = Field(3, ge=1, example=3)

class PricePredictionResponse(BaseModel):
    predicted_price: float
    currency: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "pricing_model"}

@app.post("/predict-price", response_model=PricePredictionResponse)
def predict_price_endpoint(payload: PricePredictionRequest):
    try:
        result = predict_price(
            product_name=payload.product_name,
            primary_category=payload.primary_category,
            sub_category=payload.sub_category,
            brand=payload.brand,
            description=payload.description,
            spec_count=payload.spec_count,
            image_count=payload.image_count,
            category_depth=payload.category_depth
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Standalone test server running on isolated port 8000
    print("Starting isolated pricing API on port 8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
