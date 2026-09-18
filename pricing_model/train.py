"""
train.py - Isolated XGBoost Pricing Model Training Pipeline
Trained on Flipkart Indian E-Commerce dataset for retail_price (INR) prediction.
Strictly excludes post-sale, platform-specific, and target-leakage attributes.
"""

import os
import re
import json
import pickle
import ast
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

# -----------------------------------------------------------------------------
# Configuration & Paths
# -----------------------------------------------------------------------------
DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'flipkart_com-ecommerce_sample.csv')
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')
PREPROC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'preprocessing')

MODEL_PATH = os.path.join(MODEL_DIR, 'pricing_model.json')
PREPROCESSOR_PATH = os.path.join(PREPROC_DIR, 'preprocessor.pkl')
SCHEMA_PATH = os.path.join(PREPROC_DIR, 'schema_config.json')

RANDOM_STATE = 42
TARGET_COL = 'retail_price'

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(PREPROC_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# Helper Parsing Functions (Deterministic & Marketplace-Agnostic)
# -----------------------------------------------------------------------------
def parse_category_tree(tree_val):
    """
    Parses product_category_tree string e.g. ["Clothing >> Women's Clothing >> ..."]
    Returns (primary_cat, sub_cat, depth)
    """
    if not isinstance(tree_val, str) or not tree_val.strip():
        return "Unknown", "Unknown", 0
    try:
        match = re.search(r'\[\s*\"(.*)\"\s*\]', tree_val)
        path_str = match.group(1) if match else tree_val
        parts = [p.strip() for p in path_str.split('>>') if p.strip()]
        if not parts:
            return "Unknown", "Unknown", 0
        primary_cat = parts[0]
        sub_cat = parts[1] if len(parts) > 1 else "None"
        depth = len(parts)
        return primary_cat, sub_cat, depth
    except Exception:
        return "Unknown", "Unknown", 0

def parse_spec_count(spec_val):
    """
    Counts specification attributes from product_specifications.
    Avoids arbitrary code execution; uses regex key extraction.
    """
    if not isinstance(spec_val, str) or not spec_val.strip():
        return 0
    keys = re.findall(r'\"key\"=>\"([^\"]+)\"', spec_val)
    if keys:
        return len(keys)
    # Fallback to semicolon or comma if custom format
    return len([s for s in spec_val.split(',') if ':' in s or '=>' in s])

def parse_image_count(img_val):
    """
    Parses image URL count from image string array e.g. ["url1", "url2"]
    """
    if not isinstance(img_val, str) or not img_val.strip():
        return 0
    urls = re.findall(r'https?://[^\s",\]]+', img_val)
    return len(urls)

# -----------------------------------------------------------------------------
# Data Loading & Cleaning
# -----------------------------------------------------------------------------
def load_and_clean_data(csv_path):
    print(f"Loading raw data from: {csv_path}...")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Loaded {len(df)} initial rows and {len(df.columns)} columns.")

    # 1. Target Cleaning
    df[TARGET_COL] = pd.to_numeric(df[TARGET_COL].astype(str).str.replace(',', '').str.strip(), errors='coerce')
    
    # Drop rows missing retail_price or invalid price <= 0
    initial_len = len(df)
    df = df[df[TARGET_COL].notna() & (df[TARGET_COL] > 0)].copy()
    print(f"Removed {initial_len - len(df)} rows with invalid or missing {TARGET_COL}. Retained: {len(df)} rows.")

    # 2. Extract Category Features
    cat_tuples = df['product_category_tree'].apply(parse_category_tree)
    df['primary_category'] = [t[0] for t in cat_tuples]
    df['sub_category'] = [t[1] for t in cat_tuples]
    df['category_depth'] = [t[2] for t in cat_tuples]

    # 3. Clean Brand (Group empty or rare brands)
    df['brand'] = df['brand'].fillna('').astype(str).str.strip()
    df['brand'] = df['brand'].replace({'': 'Unbranded / Independent', 'nan': 'Unbranded / Independent'})

    # 4. Text Meta-Features
    df['product_name'] = df['product_name'].fillna('').astype(str).str.strip()
    df['description'] = df['description'].fillna('').astype(str).str.strip()

    df['name_length'] = df['product_name'].apply(len)
    df['name_word_count'] = df['product_name'].apply(lambda x: len(x.split()))
    df['description_length'] = df['description'].apply(len)
    df['description_word_count'] = df['description'].apply(lambda x: len(x.split()))

    # 5. Product Specifications & Image Count
    df['spec_count'] = df['product_specifications'].apply(parse_spec_count)
    df['image_count'] = df['image'].apply(parse_image_count)
    df['has_image'] = (df['image_count'] > 0).astype(int)

    # Combined text for TF-IDF
    df['clean_text'] = (df['product_name'] + ' ' + df['description']).str.lower()
    df['clean_text'] = df['clean_text'].str.replace(r'[^a-zA-Z0-9\s]', ' ', regex=True)

    return df

# -----------------------------------------------------------------------------
# Main Training Routine
# -----------------------------------------------------------------------------
def train_pipeline():
    df = load_and_clean_data(DATA_PATH)

    # Target: retail_price
    y = df[TARGET_COL].values
    y_log = np.log1p(y)  # Stabilize extreme right skewness

    # -------------------------------------------------------------------------
    # Train / Validation / Test Split (70% Train, 15% Validation, 15% Test)
    # Stratified/Controlled split. Test set is strictly held out.
    # -------------------------------------------------------------------------
    train_indices, temp_indices = train_test_split(
        np.arange(len(df)), test_size=0.30, random_state=RANDOM_STATE
    )
    val_indices, test_indices = train_test_split(
        temp_indices, test_size=0.50, random_state=RANDOM_STATE
    )

    df_train = df.iloc[train_indices].copy()
    df_val = df.iloc[val_indices].copy()
    df_test = df.iloc[test_indices].copy()

    y_train_log = y_log[train_indices]
    y_val_log = y_log[val_indices]
    y_test_raw = y[test_indices]  # Keep raw rupees for uncompromised test evaluation

    print(f"\nData Splits:")
    print(f"  Training Set:   {len(df_train)} samples")
    print(f"  Validation Set: {len(df_val)} samples")
    print(f"  Test Set:       {len(df_test)} samples (Untouched during fitting)")

    # -------------------------------------------------------------------------
    # Categorical Feature Encodings (Fitted Strictly on df_train)
    # -------------------------------------------------------------------------
    # Keep top 60 primary categories; map rest to 'Other'
    top_primary_cats = set(df_train['primary_category'].value_counts().nlargest(60).index)
    # Keep top 80 sub categories
    top_sub_cats = set(df_train['sub_category'].value_counts().nlargest(80).index)
    # Keep top 120 brands
    top_brands = set(df_train['brand'].value_counts().nlargest(120).index)

    # Frequency mappings calculated from training set
    primary_cat_freq = df_train['primary_category'].value_counts(normalize=True).to_dict()
    sub_cat_freq = df_train['sub_category'].value_counts(normalize=True).to_dict()
    brand_freq = df_train['brand'].value_counts(normalize=True).to_dict()

    # Target mean encoding in log space (with additive smoothing)
    global_mean_log = float(np.mean(y_train_log))
    smoothing = 10.0

    def calc_target_encoding(series, y_vals):
        stats = pd.DataFrame({'cat': series, 'y': y_vals}).groupby('cat')['y'].agg(['count', 'mean'])
        encoding = ((stats['count'] * stats['mean'] + smoothing * global_mean_log) / (stats['count'] + smoothing)).to_dict()
        return encoding

    primary_cat_target_enc = calc_target_encoding(df_train['primary_category'], y_train_log)
    sub_cat_target_enc = calc_target_encoding(df_train['sub_category'], y_train_log)
    brand_target_enc = calc_target_encoding(df_train['brand'], y_train_log)

    # -------------------------------------------------------------------------
    # Text Vectorization (Fitted Strictly on df_train)
    # -------------------------------------------------------------------------
    tfidf = TfidfVectorizer(max_features=50, stop_words='english', min_df=5)
    tfidf.fit(df_train['clean_text'])
    tfidf_feature_names = [f"tfidf_{name}" for name in tfidf.get_feature_names_out()]

    # -------------------------------------------------------------------------
    # Feature Transform Function
    # -------------------------------------------------------------------------
    def transform_features(sub_df):
        # 1. Base Numerics
        features = pd.DataFrame(index=sub_df.index)
        features['category_depth'] = sub_df['category_depth'].astype(float)
        features['name_length'] = sub_df['name_length'].astype(float)
        features['name_word_count'] = sub_df['name_word_count'].astype(float)
        features['description_length'] = sub_df['description_length'].astype(float)
        features['description_word_count'] = sub_df['description_word_count'].astype(float)
        features['spec_count'] = sub_df['spec_count'].astype(float)
        features['image_count'] = sub_df['image_count'].astype(float)
        features['has_image'] = sub_df['has_image'].astype(float)

        # 2. Encoded Categoricals
        features['primary_cat_freq'] = sub_df['primary_category'].map(primary_cat_freq).fillna(0.0)
        features['sub_cat_freq'] = sub_df['sub_category'].map(sub_cat_freq).fillna(0.0)
        features['brand_freq'] = sub_df['brand'].map(brand_freq).fillna(0.0)

        features['primary_cat_te'] = sub_df['primary_category'].map(primary_cat_target_enc).fillna(global_mean_log)
        features['sub_cat_te'] = sub_df['sub_category'].map(sub_cat_target_enc).fillna(global_mean_log)
        features['brand_te'] = sub_df['brand'].map(brand_target_enc).fillna(global_mean_log)

        # 3. TF-IDF Text Features
        text_matrix = tfidf.transform(sub_df['clean_text']).toarray()
        text_df = pd.DataFrame(text_matrix, columns=tfidf_feature_names, index=sub_df.index)

        full_features = pd.concat([features, text_df], axis=1)
        return full_features

    print("\nTransforming train, validation, and test matrices...")
    X_train = transform_features(df_train)
    X_val = transform_features(df_val)
    X_test = transform_features(df_test)

    feature_cols = list(X_train.columns)
    print(f"Total features created: {len(feature_cols)}")

    # -------------------------------------------------------------------------
    # Train XGBoost Regressor
    # -------------------------------------------------------------------------
    print("\nTraining XGBoost Regressor (XGBRegressor)...")
    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        gamma=0.1,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        early_stopping_rounds=30,
        eval_metric='mae'
    )

    model.fit(
        X_train, y_train_log,
        eval_set=[(X_val, y_val_log)],
        verbose=50
    )

    print(f"\nBest iteration: {model.best_iteration}")

    # -------------------------------------------------------------------------
    # Model Evaluation on Untouched Test Set
    # -------------------------------------------------------------------------
    print("\nEvaluating on untouched Test Set...")
    test_preds_log = model.predict(X_test)
    test_preds = np.expm1(test_preds_log)  # Convert back from log to raw INR
    test_preds = np.clip(test_preds, a_min=35.0, a_max=None)  # Enforce non-zero price floor

    mae = mean_absolute_error(y_test_raw, test_preds)
    rmse = np.sqrt(mean_squared_error(y_test_raw, test_preds))
    r2 = r2_score(y_test_raw, test_preds)

    # Median Absolute Error & Median Percentage Error
    abs_errors = np.abs(y_test_raw - test_preds)
    pct_errors = (abs_errors / y_test_raw) * 100
    med_ae = np.median(abs_errors)
    med_ape = np.median(pct_errors)
    mean_ape = np.mean(pct_errors)

    print("\n" + "="*50)
    print("FINAL TEST EVALUATION METRICS (Untouched Test Set)")
    print("="*50)
    print(f"Mean Absolute Error (MAE):    Rs. {mae:.2f}")
    print(f"Root Mean Squared Error (RMSE): Rs. {rmse:.2f}")
    print(f"R-squared (R2 Score):          {r2:.4f}")
    print(f"Median Absolute Error:         Rs. {med_ae:.2f}")
    print(f"Median Percentage Error:       {med_ape:.2f}%")
    print(f"Mean Absolute Percentage Error: {mean_ape:.2f}%")
    print("="*50)

    # -------------------------------------------------------------------------
    # Save 25 Test Examples for Inspection
    # -------------------------------------------------------------------------
    test_sample_df = df_test[['product_name', 'primary_category', 'brand']].copy()
    test_sample_df['Actual Price (INR)'] = y_test_raw
    test_sample_df['Predicted Price (INR)'] = test_preds
    test_sample_df['Absolute Error (INR)'] = abs_errors
    test_sample_df['Percentage Error (%)'] = pct_errors

    # -------------------------------------------------------------------------
    # Save Model Artifacts
    # -------------------------------------------------------------------------
    print(f"\nSaving model to: {MODEL_PATH}")
    model.save_model(MODEL_PATH)

    preprocessor_data = {
        'feature_cols': feature_cols,
        'top_primary_cats': list(top_primary_cats),
        'top_sub_cats': list(top_sub_cats),
        'top_brands': list(top_brands),
        'primary_cat_freq': primary_cat_freq,
        'sub_cat_freq': sub_cat_freq,
        'brand_freq': brand_freq,
        'primary_cat_target_enc': primary_cat_target_enc,
        'sub_cat_target_enc': sub_cat_target_enc,
        'brand_target_enc': brand_target_enc,
        'global_mean_log': global_mean_log,
        'tfidf_vectorizer': tfidf,
        'tfidf_feature_names': tfidf_feature_names
    }

    print(f"Saving preprocessor artifacts to: {PREPROCESSOR_PATH}")
    with open(PREPROCESSOR_PATH, 'wb') as f:
        pickle.dump(preprocessor_data, f)

    schema_data = {
        "target": TARGET_COL,
        "target_currency": "INR",
        "num_features": len(feature_cols),
        "features": feature_cols,
        "evaluation_metrics": {
            "MAE": round(float(mae), 2),
            "RMSE": round(float(rmse), 2),
            "R2": round(float(r2), 4),
            "Median_AE": round(float(med_ae), 2),
            "Median_APE_percent": round(float(med_ape), 2)
        }
    }
    with open(SCHEMA_PATH, 'w') as f:
        json.dump(schema_data, f, indent=2)

    # Return test metrics and sample rows
    return schema_data, test_sample_df

if __name__ == '__main__':
    train_pipeline()
