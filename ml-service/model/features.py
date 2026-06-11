from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler

preprocess = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), ["Time", "Amount"])
    ],
    remainder="passthrough"
)