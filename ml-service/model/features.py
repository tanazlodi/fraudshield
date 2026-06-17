import pandas as pd
import numpy as np

def engineer_features(df):
    """
    Takes a raw transaction dataframe and adds features
    the model will use to detect fraud.
    """

    # Amount-based features
    df['amount_log'] = np.log1p(df['Amount'])  # log scale reduces skew
    df['amount_squared'] = df['Amount'] ** 2

    # Time-based features
    df['hour_of_day'] = (df['Time'] % 86400) // 3600  # seconds → hour
    df['is_night'] = df['hour_of_day'].apply(lambda x: 1 if x >= 22 or x <= 5 else 0)

    # Drop original columns we've transformed
    df = df.drop(columns=['Time'])

    return df

def get_feature_columns(df):
    """
    Returns the list of columns the model trains/predicts on.
    Excludes the target column 'Class'.
    """
    exclude = ['Class']
    return [col for col in df.columns if col not in exclude]