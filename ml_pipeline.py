"""
ml_pipeline.py — Cortexium XR Machine Learning Pipeline

This module replaces the rule-based JSON reasoning backend with a
Random Forest Classifier that learns object-surface relationships
from spatial and semantic features.

Components:
    FeatureExtractor  — Computes 13-feature vectors for (object, surface) pairs
    DataCollector     — Appends training samples to usage_data.csv
    PlacementPredictor — Loads trained model and predicts placements
    train_and_evaluate — Trains, evaluates, and saves the Random Forest model
"""

import os
import csv
import json
import math
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)


# ─────────────────────────────────────────────
# Feature Engineering
# ─────────────────────────────────────────────

# Column names for the CSV / DataFrame
FEATURE_COLUMNS = [
    "object_class",
    "surface_class",
    "object_conf",
    "object_area_ratio",
    "surface_area_ratio",
    "area_ratio",
    "overlap_ratio",
    "dx_normalized",
    "dy_normalized",
    "euclidean_dist_normalized",
    "obj_center_x_in_surface",
    "obj_center_y_in_surface",
    "vertical_position_ratio",
]

TARGET_COLUMN = "target_surface"


class FeatureExtractor:
    """Compute a feature vector describing the spatial and semantic
    relationship between a detected object and a candidate surface."""

    @staticmethod
    def compute(
        object_label: str,
        surface_label: str,
        object_box: tuple,
        surface_box: tuple,
        object_conf: float,
        frame_shape: tuple,
    ) -> dict:
        """Return a dict of features for one (object, surface) pair.

        Parameters
        ----------
        object_label : str
            YOLO class name of the detected object.
        surface_label : str
            Alias-resolved surface name (e.g. "table", "chair").
        object_box : tuple
            (x1, y1, x2, y2) bounding box of the object.
        surface_box : tuple
            (x1, y1, x2, y2) bounding box of the surface.
        object_conf : float
            YOLO confidence score for the object detection.
        frame_shape : tuple
            (height, width) of the video frame.
        """
        frame_h, frame_w = frame_shape[:2]
        frame_area = frame_h * frame_w
        frame_diag = math.sqrt(frame_h ** 2 + frame_w ** 2)

        ox1, oy1, ox2, oy2 = object_box
        sx1, sy1, sx2, sy2 = surface_box

        # Areas
        obj_area = max((ox2 - ox1) * (oy2 - oy1), 1)
        surf_area = max((sx2 - sx1) * (sy2 - sy1), 1)

        # Centers
        obj_cx = (ox1 + ox2) / 2.0
        obj_cy = (oy1 + oy2) / 2.0
        surf_cx = (sx1 + sx2) / 2.0
        surf_cy = (sy1 + sy2) / 2.0

        # Overlap (intersection over object area)
        inter_x1 = max(ox1, sx1)
        inter_y1 = max(oy1, sy1)
        inter_x2 = min(ox2, sx2)
        inter_y2 = min(oy2, sy2)
        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
        overlap = inter_area / obj_area

        # Distances
        dx = (obj_cx - surf_cx) / frame_w
        dy = (obj_cy - surf_cy) / frame_h
        euclidean = math.sqrt((obj_cx - surf_cx) ** 2 + (obj_cy - surf_cy) ** 2) / frame_diag

        # Containment flags
        cx_in = 1.0 if sx1 <= obj_cx <= sx2 else 0.0
        cy_in = 1.0 if sy1 <= obj_cy <= sy2 else 0.0

        return {
            "object_class": object_label,
            "surface_class": surface_label,
            "object_conf": round(object_conf, 4),
            "object_area_ratio": round(obj_area / frame_area, 6),
            "surface_area_ratio": round(surf_area / frame_area, 6),
            "area_ratio": round(obj_area / surf_area, 6),
            "overlap_ratio": round(overlap, 4),
            "dx_normalized": round(dx, 4),
            "dy_normalized": round(dy, 4),
            "euclidean_dist_normalized": round(euclidean, 4),
            "obj_center_x_in_surface": cx_in,
            "obj_center_y_in_surface": cy_in,
            "vertical_position_ratio": round(obj_cy / frame_h, 4),
        }


# ─────────────────────────────────────────────
# Data Collection
# ─────────────────────────────────────────────


class DataCollector:
    """Append training samples to a CSV file.  Never overwrites."""

    def __init__(self, csv_path: str = "usage_data.csv"):
        self.csv_path = csv_path
        self._ensure_header()

    def _ensure_header(self):
        """Write column headers if the file does not exist or is empty."""
        if not os.path.exists(self.csv_path) or os.path.getsize(self.csv_path) == 0:
            with open(self.csv_path, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(FEATURE_COLUMNS + [TARGET_COLUMN])

    def log_sample(
        self,
        object_label: str,
        surface_label: str,
        object_box: tuple,
        surface_box: tuple,
        object_conf: float,
        frame_shape: tuple,
        is_positive: bool = True,
    ):
        """Log one training sample.

        Parameters
        ----------
        is_positive : bool
            True  → the object IS correctly placed on this surface (target = surface_label).
            False → negative sample, target = "__none__" (object should NOT be on this surface).
        """
        features = FeatureExtractor.compute(
            object_label, surface_label, object_box, surface_box, object_conf, frame_shape
        )
        target = surface_label if is_positive else "__none__"

        row = [features[col] for col in FEATURE_COLUMNS] + [target]

        with open(self.csv_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(row)


# ─────────────────────────────────────────────
# Prediction
# ─────────────────────────────────────────────


class PlacementPredictor:
    """Load a trained Random Forest model and predict placements."""

    def __init__(self, model_path: str = "placement_model.pkl", encoder_path: str = "label_encoder.pkl"):
        self.model_path = model_path
        self.encoder_path = encoder_path
        self.model = None
        self.object_encoder = None
        self.surface_encoder = None
        self._loaded = False
        # Try loading on init
        self.load_model()

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def load_model(self):
        """Load model and encoders from disk.  Silently fails if files don't exist."""
        try:
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
            with open(self.encoder_path, "rb") as f:
                encoders = pickle.load(f)
            self.object_encoder = encoders["object_encoder"]
            self.surface_encoder = encoders["surface_encoder"]
            self._loaded = True
        except (FileNotFoundError, KeyError, Exception):
            self._loaded = False

    def _safe_encode(self, encoder: LabelEncoder, label: str) -> int:
        """Encode a label, returning -1 for unseen labels."""
        try:
            return int(encoder.transform([label])[0])
        except ValueError:
            return -1

    def predict(
        self,
        object_label: str,
        surface_candidates: dict,
        object_box: tuple,
        object_conf: float,
        frame_shape: tuple,
    ):
        """Predict the best surface for an object from the candidates.

        Parameters
        ----------
        object_label : str
            YOLO class name of the object.
        surface_candidates : dict
            {surface_name: (x1, y1, x2, y2)} of all currently detected surfaces.
        object_box : tuple
            (x1, y1, x2, y2) of the object.
        object_conf : float
            YOLO confidence for the object.
        frame_shape : tuple
            (height, width) of the frame.

        Returns
        -------
        (best_surface, confidence) or (None, 0.0)
        """
        if not self._loaded or not surface_candidates:
            return None, 0.0

        best_surface = None
        best_prob = 0.0

        for surf_name, surf_box in surface_candidates.items():
            features = FeatureExtractor.compute(
                object_label, surf_name, object_box, surf_box, object_conf, frame_shape
            )

            # Build numeric feature vector (encode categorical columns)
            obj_enc = self._safe_encode(self.object_encoder, features["object_class"])
            surf_enc = self._safe_encode(self.surface_encoder, features["surface_class"])

            feature_vector = [
                obj_enc,
                surf_enc,
                features["object_conf"],
                features["object_area_ratio"],
                features["surface_area_ratio"],
                features["area_ratio"],
                features["overlap_ratio"],
                features["dx_normalized"],
                features["dy_normalized"],
                features["euclidean_dist_normalized"],
                features["obj_center_x_in_surface"],
                features["obj_center_y_in_surface"],
                features["vertical_position_ratio"],
            ]

            X = np.array([feature_vector])
            proba = self.model.predict_proba(X)[0]
            classes = self.model.classes_

            # Find probabilities for this surface name
            for i, cls_label in enumerate(classes):
                if cls_label == surf_name and proba[i] > best_prob:
                    best_prob = proba[i]
                    best_surface = surf_name

            # Also check: the model's top prediction for this feature vector
            pred_idx = np.argmax(proba)
            pred_label = classes[pred_idx]
            pred_prob = proba[pred_idx]

            # If the model's top prediction matches this candidate and is higher
            if pred_label == surf_name and pred_prob > best_prob:
                best_prob = pred_prob
                best_surface = surf_name

        # Fallback: if no surface scored above 0, pick the model's overall best
        if best_surface is None and surface_candidates:
            # Just predict for the first candidate and take the model's top choice
            for surf_name, surf_box in surface_candidates.items():
                features = FeatureExtractor.compute(
                    object_label, surf_name, object_box, surf_box, object_conf, frame_shape
                )
                obj_enc = self._safe_encode(self.object_encoder, features["object_class"])
                surf_enc = self._safe_encode(self.surface_encoder, features["surface_class"])
                feature_vector = [
                    obj_enc, surf_enc,
                    features["object_conf"], features["object_area_ratio"],
                    features["surface_area_ratio"], features["area_ratio"],
                    features["overlap_ratio"], features["dx_normalized"],
                    features["dy_normalized"], features["euclidean_dist_normalized"],
                    features["obj_center_x_in_surface"], features["obj_center_y_in_surface"],
                    features["vertical_position_ratio"],
                ]
                X = np.array([feature_vector])
                pred = self.model.predict(X)[0]
                if pred in surface_candidates:
                    return pred, float(np.max(self.model.predict_proba(X)))
            # Absolute fallback
            return None, 0.0

        return best_surface, round(best_prob, 4)


# ─────────────────────────────────────────────
# Training & Evaluation
# ─────────────────────────────────────────────


def train_and_evaluate(
    data_path: str = "usage_data.csv",
    model_path: str = "placement_model.pkl",
    encoder_path: str = "label_encoder.pkl",
    metrics_path: str = "metrics.json",
) -> dict:
    """Train a Random Forest on usage_data.csv, evaluate, and save all artifacts.

    Returns
    -------
    dict
        Evaluation metrics including accuracy, precision, recall, f1,
        confusion_matrix, classification_report, cross_val_score,
        feature_importance.
    """
    # ── Load data ──
    df = pd.read_csv(data_path)

    if len(df) < 2:
        raise ValueError(f"Not enough training data ({len(df)} samples). Collect more demonstrations.")

    # ── Filter out __none__ targets if they dominate too much ──
    # Keep them for learning but ensure we have positive samples
    positive_df = df[df[TARGET_COLUMN] != "__none__"]
    if len(positive_df) == 0:
        raise ValueError("No positive training samples found. Demonstrate correct placements first.")

    # ── Encode categorical features ──
    object_encoder = LabelEncoder()
    surface_encoder = LabelEncoder()

    # Fit on all unique values in both feature and target columns
    all_surface_labels = list(set(df["surface_class"].tolist() + df[TARGET_COLUMN].tolist()))
    object_encoder.fit(df["object_class"].unique())
    surface_encoder.fit(all_surface_labels)

    df["object_class_enc"] = object_encoder.transform(df["object_class"])
    df["surface_class_enc"] = surface_encoder.transform(df["surface_class"])

    # ── Build feature matrix ──
    numeric_feature_cols = [
        "object_class_enc",
        "surface_class_enc",
        "object_conf",
        "object_area_ratio",
        "surface_area_ratio",
        "area_ratio",
        "overlap_ratio",
        "dx_normalized",
        "dy_normalized",
        "euclidean_dist_normalized",
        "obj_center_x_in_surface",
        "obj_center_y_in_surface",
        "vertical_position_ratio",
    ]

    X = df[numeric_feature_cols].values
    y = df[TARGET_COLUMN].values

    # ── Train/test split ──
    unique_classes = np.unique(y)

    if len(unique_classes) < 2 or len(df) < 4:
        # Too few samples or classes for a proper split — train on all data
        X_train, X_test, y_train, y_test = X, X, y, y
        print(f"[ML] Only {len(unique_classes)} class(es) and {len(df)} samples — training on all data (no split).")
    else:
        # Check if stratification is possible
        class_counts = pd.Series(y).value_counts()
        min_class_count = class_counts.min()

        if min_class_count >= 2:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

    # ── Train Random Forest ──
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # ── Evaluate ──
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    # Use 'weighted' average for multi-class, handle edge cases
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, zero_division=0, output_dict=True)

    # Cross-validation (only if enough data)
    if len(df) >= 10 and len(unique_classes) >= 2:
        n_splits = min(5, min(pd.Series(y).value_counts()))
        n_splits = max(2, n_splits)
        cv_scores = cross_val_score(clf, X, y, cv=n_splits, scoring="accuracy")
        cv_mean = float(cv_scores.mean())
        cv_std = float(cv_scores.std())
    else:
        cv_scores = np.array([accuracy])
        cv_mean = accuracy
        cv_std = 0.0

    # Feature importance
    feature_names = [
        "object_class", "surface_class", "object_conf",
        "object_area_ratio", "surface_area_ratio", "area_ratio",
        "overlap_ratio", "dx_normalized", "dy_normalized",
        "euclidean_dist_normalized", "obj_center_x_in_surface",
        "obj_center_y_in_surface", "vertical_position_ratio",
    ]
    importances = dict(zip(feature_names, [round(v, 4) for v in clf.feature_importances_]))

    # Average prediction confidence
    avg_confidence = float(np.mean(np.max(y_proba, axis=1)))

    # ── Save model ──
    with open(model_path, "wb") as f:
        pickle.dump(clf, f)

    # ── Save encoders ──
    with open(encoder_path, "wb") as f:
        pickle.dump({
            "object_encoder": object_encoder,
            "surface_encoder": surface_encoder,
        }, f)

    # ── Save metrics ──
    metrics = {
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "n_classes": len(unique_classes),
        "classes": list(unique_classes),
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
        "cross_val_mean": round(cv_mean, 4),
        "cross_val_std": round(cv_std, 4),
        "cross_val_scores": [round(s, 4) for s in cv_scores.tolist()],
        "feature_importance": importances,
        "avg_prediction_confidence": round(avg_confidence, 4),
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    # ── Print summary ──
    print("\n" + "=" * 60)
    print("  CORTEXIUM XR -- MODEL TRAINING REPORT")
    print("=" * 60)
    print(f"  Samples:      {len(df)} total  |  {len(X_train)} train  |  {len(X_test)} test")
    print(f"  Classes:      {len(unique_classes)}  ->  {list(unique_classes)}")
    print(f"  Accuracy:     {accuracy:.4f}")
    print(f"  Precision:    {precision:.4f}")
    print(f"  Recall:       {recall:.4f}")
    print(f"  F1 Score:     {f1:.4f}")
    print(f"  Cross-Val:    {cv_mean:.4f} +/- {cv_std:.4f}")
    print(f"  Avg Conf:     {avg_confidence:.4f}")
    print("-" * 60)
    print("  Feature Importance:")
    for name, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        bar = "#" * int(imp * 40)
        print(f"    {name:30s}  {imp:.4f}  {bar}")
    print("-" * 60)
    print(f"  Confusion Matrix:\n{cm}")
    print("=" * 60)
    print(f"  Model saved  -> {model_path}")
    print(f"  Encoders     -> {encoder_path}")
    print(f"  Metrics      -> {metrics_path}")
    print("=" * 60 + "\n")

    return metrics
