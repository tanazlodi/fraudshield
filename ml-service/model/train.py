import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix, average_precision_score
from features import preprocess


data = pd.read_csv("../data/creditcard_clean.csv")

X = data.drop("Class", axis=1)
y = data["Class"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    stratify=y,
    random_state=42
)


log_model = Pipeline([
    ("preprocess", preprocess),
    ("clf", LogisticRegression(class_weight="balanced", max_iter=1000))
])

log_model.fit(X_train, y_train)

log_pred = log_model.predict(X_test)
log_scores = log_model.predict_proba(X_test)[:, 1]


print(confusion_matrix(y_test, log_pred))
print(classification_report(y_test, log_pred))
print("PR-AUC:", average_precision_score(y_test, log_scores))

tree_model = Pipeline([
    ("preprocess", preprocess),
    ("clf", DecisionTreeClassifier(
        class_weight="balanced",
        random_state=42,
        max_depth=5
    ))
])

tree_model.fit(X_train, y_train)

tree_pred = tree_model.predict(X_test)
tree_scores = tree_model.predict_proba(X_test)[:, 1]

print(confusion_matrix(y_test, tree_pred))
print(classification_report(y_test, tree_pred))
print("PR-AUC:", average_precision_score(y_test, tree_scores))



joblib.dump(log_model, "../model/logistic_model.pkl")
joblib.dump(tree_model, "../model/tree_model.pkl")