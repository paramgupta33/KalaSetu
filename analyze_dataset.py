import csv
import json
import math
import re
from collections import Counter, defaultdict
import statistics

csv_path = 'flipkart_com-ecommerce_sample.csv'

with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

num_rows = len(rows)
columns = list(rows[0].keys())
num_cols = len(columns)

print(f"1. Total Rows: {num_rows}, Columns: {num_cols}")
print(f"2. Column names: {columns}")

# 3 & 4. Data types, missing values
missing_counts = Counter()
empty_patterns = {"", "none", "null", "nan", "no rating available"}

for row in rows:
    for col in columns:
        val = row[col].strip()
        if not val or val.lower() in empty_patterns or val == '[]' or val == '{"product_specification"=>nil}':
            missing_counts[col] += 1

print("\n--- 3 & 4. Missing Value Counts & Detected Types ---")
for col in columns:
    # infer type
    sample_vals = [r[col].strip() for r in rows if r[col].strip()][:50]
    inferred = "string/text"
    if col in ['retail_price', 'discounted_price']:
        inferred = "numeric (float/price in INR)"
    elif col == 'crawl_timestamp':
        inferred = "datetime string"
    elif col == 'is_FK_Advantage_product':
        inferred = "boolean (string: TRUE/FALSE)"
    print(f"  {col}: type={inferred}, missing={missing_counts[col]} ({missing_counts[col]/num_rows*100:.2f}%)")

# 5. Duplicate rows
row_tuples = [tuple(r.values()) for r in rows]
unique_rows = set(row_tuples)
print(f"\n5. Duplicate full rows: {num_rows - len(unique_rows)}")

# Duplicate product names / pids
pids = [r['pid'] for r in rows if r['pid']]
print(f"   Unique pids: {len(set(pids))} out of {len(pids)}")
names = [r['product_name'].strip() for r in rows if r['product_name']]
print(f"   Unique product names: {len(set(names))} out of {len(names)}")

# 6. Unique-value counts for important categorical columns
print("\n--- 6. Categorical Column Uniques ---")
cat_cols = ['brand', 'is_FK_Advantage_product', 'product_category_tree']
for c in cat_cols:
    vals = [r[c].strip() for r in rows if r[c].strip()]
    print(f"  {c}: {len(set(vals))} unique values")

# Extract primary category from product_category_tree
primary_cats = []
for r in rows:
    tree = r['product_category_tree'].strip()
    match = re.search(r'\[\s*\"([^\">]+)', tree)
    if match:
        primary_cats.append(match.group(1).strip())
    else:
        primary_cats.append("Unknown")

cat_counts = Counter(primary_cats)
print(f"  Extracted Primary Categories: {len(cat_counts)} unique. Top 15:")
for cat, cnt in cat_counts.most_common(15):
    print(f"    - {cat}: {cnt} ({cnt/num_rows*100:.2f}%)")

# 7. Price column statistics
def parse_price(val_str):
    try:
        clean = val_str.replace(',', '').strip()
        val = float(clean)
        return val if val > 0 else None
    except:
        return None

retail_prices = [parse_price(r['retail_price']) for r in rows]
retail_prices = [p for p in retail_prices if p is not None]

disc_prices = [parse_price(r['discounted_price']) for r in rows]
disc_prices = [p for p in disc_prices if p is not None]

print("\n--- 7. Price Column Statistics ---")
print("Retail Price (INR):")
print(f"  Valid Count: {len(retail_prices)}")
print(f"  Min: {min(retail_prices):.2f}")
print(f"  Max: {max(retail_prices):.2f}")
print(f"  Mean: {statistics.mean(retail_prices):.2f}")
print(f"  Median: {statistics.median(retail_prices):.2f}")
print(f"  Std Dev: {statistics.stdev(retail_prices):.2f}")

print("\nDiscounted Price (INR):")
print(f"  Valid Count: {len(disc_prices)}")
print(f"  Min: {min(disc_prices):.2f}")
print(f"  Max: {max(disc_prices):.2f}")
print(f"  Mean: {statistics.mean(disc_prices):.2f}")
print(f"  Median: {statistics.median(disc_prices):.2f}")
print(f"  Std Dev: {statistics.stdev(disc_prices):.2f}")

# 8. Distribution / Outliers
def get_percentiles(data, percentiles):
    s = sorted(data)
    n = len(s)
    res = {}
    for p in percentiles:
        idx = int((p / 100.0) * (n - 1))
        res[p] = s[idx]
    return res

pcts = [1, 5, 10, 25, 50, 75, 90, 95, 99, 99.5, 99.9]
print("\n--- 8. Retail Price Percentiles ---")
for p, v in get_percentiles(retail_prices, pcts).items():
    print(f"  {p}%: Rs. {v:.2f}")

q25 = sorted(retail_prices)[int(0.25 * len(retail_prices))]
q75 = sorted(retail_prices)[int(0.75 * len(retail_prices))]
iqr = q75 - q25
upper_bound = q75 + 1.5 * iqr
lower_bound = max(0, q25 - 1.5 * iqr)
outliers = [p for p in retail_prices if p > upper_bound or p < lower_bound]
print(f"\n  IQR: {iqr:.2f} (Q25={q25:.2f}, Q75={q75:.2f})")
print(f"  1.5x IQR Upper Bound: Rs. {upper_bound:.2f}")
print(f"  Outliers above upper bound: {len(outliers)} ({len(outliers)/len(retail_prices)*100:.2f}%)")
print(f"  Count > Rs 10,000: {len([p for p in retail_prices if p > 10000])}")
print(f"  Count > Rs 50,000: {len([p for p in retail_prices if p > 50000])}")
print(f"  Count > Rs 100,000: {len([p for p in retail_prices if p > 100000])}")
