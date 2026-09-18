# Initial Indian E-Commerce Price Prediction Prototype (XGBoost)

An isolated machine learning pricing pipeline trained on the `flipkart_com-ecommerce_sample.csv` dataset.

> **Scope Note:** This is an initial Indian e-commerce baseline prototype trained strictly on general Indian e-commerce data. It is **not** an artisan-calibrated model, but establishes the machine learning feature engineering, training, serialization, and inference pipeline. It is architected to accept artisan cost and craft features (`material_cost`, `labour_hours`, etc.) in future iterations without altering upstream dependencies.

---

## 1. Directory Structure

```
pricing_model/
├── __init__.py
├── requirements.txt            # Python dependencies (xgboost, scikit-learn, etc.)
├── train.py                    # Complete training, cross-validation & evaluation script
├── predict.py                  # Standalone inference function and CLI
├── api.py                      # Optional standalone FastAPI service (POST /predict-price)
├── README.md                   # Documentation, metrics & evaluation results
├── model/
│   └── pricing_model.json      # Serialized XGBoost model (JSON format)
└── preprocessing/
    ├── preprocessor.pkl        # Serialized feature transformers & encodings
    └── schema_config.json      # Target & feature metadata, training metrics
```

---

## 2. Model & Target Definition

* **Prediction Target:** `retail_price` (MRP in INR).
* **Excluded Leaked / Post-Sale Features:**
  * `discounted_price` (Purged: causes severe data leakage when predicting retail price).
  * `product_rating` and `overall_rating` (Purged: >90% missing and post-purchase metrics).
  * `is_FK_Advantage_product` (Purged: platform-specific fulfillment feature, not available to independent artisans).
  * `uniq_id`, `pid`, `product_url`, `crawl_timestamp` (Purged: non-generalizable scrape/ID hashes).

---

## 3. Final Feature Matrix (64 Features)

1. **Category Taxonomy:**
   * `category_depth`: Integer depth of category hierarchy breadcrumbs.
   * `primary_cat_freq`: Frequency encoding of top-level category.
   * `sub_cat_freq`: Frequency encoding of second-level category.
   * `primary_cat_te`: Target-encoded primary category (smoothed in log space).
   * `sub_cat_te`: Target-encoded sub-category (smoothed in log space).
2. **Brand:**
   * `brand_freq`: Frequency encoding of brand.
   * `brand_te`: Target-encoded brand (smoothed in log space).
3. **Text Complexity:**
   * `name_length`: Character length of product title.
   * `name_word_count`: Word count of product title.
   * `description_length`: Character length of description.
   * `description_word_count`: Word count of description.
4. **Product Metadata:**
   * `spec_count`: Extracted attribute count from product specifications.
   * `image_count`: Number of catalog photos.
   * `has_image`: Binary indicator (0 or 1).
5. **Text NLP Attributes (50 Features):**
   * Top 50 TF-IDF features extracted from combined title and description text, capturing materials, pack sizes, and product attributes.

---

## 4. Test Set Evaluation Metrics

Evaluated on the strictly held-out, untouched test set (2,989 products):

* **Mean Absolute Error (MAE):** ₹853.34
* **Root Mean Squared Error (RMSE):** ₹3,508.85
* **$R^2$ Score:** 0.8024
* **Median Absolute Error:** ₹208.17
* **Median Percentage Error:** 18.87%
* **Mean Absolute Percentage Error (MAPE):** 34.17%

---

## 5. Usage

### Standalone Python Function:

```python
from pricing_model.predict import predict_price

result = predict_price(
    product_name="Handcrafted Brass Diya Oil Lamp Set",
    primary_category="Home Decor & Festive Needs",
    sub_category="Festive Decor",
    brand="Unbranded / Independent",
    description="Traditional handmade brass oil lamp with fine engraving.",
    spec_count=3,
    image_count=2,
    category_depth=3
)

print(result)
# Output: {"predicted_price": 1570.68, "currency": "INR"}
```

### Standalone FastAPI Server:

```bash
uvicorn pricing_model.api:app --host 127.0.0.1 --port 8000
```
