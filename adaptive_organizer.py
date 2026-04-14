from ultralytics import YOLO
import cv2
import json

# Load YOLO model
model = YOLO("yolov8s.pt")

# Mobile camera stream
url = "http://192.168.1.107:8080/videofeed"
cap = cv2.VideoCapture(url)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Load learned rules
try:
    with open("learned_rules.json","r") as f:
        learned_rules = json.load(f)
except:
    learned_rules = {}

# Default fallback rules
default_rules = {
    "laptop": "table",
    "cell phone": "table",
    "book": "table",
    "bottle": "table",
    "cup": "table",
    "backpack": "chair",
    "handbag": "chair"
}

mode = "predict"

frame_count = 0
last_frame = None
last_surface_boxes = {}

# Draw arrow
def draw_arrow(frame, start, end, color=(0,255,0)):
    cv2.arrowedLine(frame, start, end, color, 3, tipLength=0.3)

# Check overlap
def overlap_ratio(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    inter_area = max(0, xB - xA) * max(0, yB - yA)

    boxA_area = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])

    if boxA_area == 0:
        return 0

    return inter_area / boxA_area


surface_alias = {
    "dining table": "table",
    "bench": "table",
    "couch": "sofa",
    "chair": "chair"
}

surfaces = ["dining table", "table", "chair","couch","bench", "bed"]

while True:

    ret, frame = cap.read()

    if not ret:
        break

    h, w = frame.shape[:2]
    scale = 0.7  
    frame = cv2.resize(frame, (int(w*scale), int(h*scale)))

    frame_count += 1

    key = cv2.waitKey(1) & 0xFF   # ← MOVE waitKey HERE
    # 👇 IMPORTANT: handle controls here too
    if key == ord('l'):
        mode = "learn"
        print("LEARN MODE")

    elif key == ord('p'):
        mode = "predict"
        print("PREDICT MODE")

    elif key == ord('r'):
        learned_rules = {}
        with open("learned_rules.json","w") as f:
            json.dump(learned_rules,f)
        print("RESET")
    elif key==27:
        break

    if frame_count % 4 != 0:
        if last_frame is not None:
            cv2.imshow("Adaptive Cortexium", last_frame)
        else:
            cv2.imshow("Adaptive Cortexium", frame)

        if key == 27:
            break

        continue

    results = model(frame, imgsz=320, conf=0.20)

    surface_boxes = {}

    for r in results:
        for box in r.boxes:

            cls = int(box.cls)
            label = model.names[cls]

            x1,y1,x2,y2 = map(int, box.xyxy[0])

            # Detect surfaces
            if label in surfaces:

                surface_name = surface_alias.get(label,label)
                surface_boxes[surface_name] = (x1,y1,x2,y2)
                last_surface_boxes[surface_name] = (x1,y1,x2,y2)

                cv2.rectangle(frame,(x1,y1),(x2,y2),(255,255,0),1)
                surf_text = f"[{surface_name}]"
                
                (text_width, text_height), _ = cv2.getTextSize(
                    surf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                )

                cv2.rectangle(frame,
                            (x1, y1 - text_height - 5),
                            (x1 + text_width, y1),
                            (0,0,0),
                            -1)

                cv2.putText(frame,
                            surf_text,
                            (x1, y1 - 2),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0,255,255),
                            1)

            # Detect objects
            if label not in surfaces:

                # LEARNING MODE
                if mode == "learn":

                    for s_name, s_box in surface_boxes.items():

                        if overlap_ratio((x1,y1,x2,y2), s_box) > 0.3:

                            learned_rules[label] = s_name

                            print(f"Learned: {label} -> {s_name}")

                            learn_text = f"LEARNING: {label}"

                            (text_width, text_height), _ = cv2.getTextSize(
                                learn_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                            )

                            y_text = max(y1 - 30, 10)

                            cv2.rectangle(frame,
                                        (x1, y_text),
                                        (x1 + text_width, y_text + 20),
                                        (255,255,255),
                                        -1)

                            cv2.putText(frame,
                                        learn_text,
                                        (x1, y_text + 15),
                                        cv2.FONT_HERSHEY_SIMPLEX,
                                        0.5,
                                        (0,0,0),
                                        1)

                            with open("learned_rules.json","w") as f:
                                json.dump(learned_rules,f)

                            break

                # PREDICTION MODE
                if label in learned_rules:
                    expected_surface = learned_rules[label]
                else:
                    expected_surface = None

                correct = False

                if expected_surface in surface_boxes:
                    if overlap_ratio((x1,y1,x2,y2), surface_boxes[expected_surface]) > 0.3:
                        correct = True

                if correct:
                    color = (0,255,0)
                    text = f"{label} OK"
                else:
                    if mode == "learn":
                        color = (0,165,255)   # ORANGE for learning
                    else:
                        color = (0,0,255)   # RED for incorrect
                    text = f"{label} -> {expected_surface}" if expected_surface else label

                if expected_surface in surface_boxes:
                    target_box = surface_boxes[expected_surface]

                elif expected_surface in last_surface_boxes:
                    target_box = last_surface_boxes[expected_surface]

                else:
                    target_box = None

                # draw arrow ONLY if misplaced AND valid surface
                if (not correct) and (target_box is not None) and (mode == "predict") and (expected_surface is not None):

                    sx1,sy1,sx2,sy2 = target_box

                    obj_center = ((x1+x2)//2,(y1+y2)//2)
                    surf_center = ((sx1+sx2)//2,(sy1+sy2)//2)

                    draw_arrow(frame,obj_center,surf_center,color)

                cv2.rectangle(frame,(x1,y1),(x2,y2),color,1)
                (text_width, text_height), _ = cv2.getTextSize(
                    text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                )

                cv2.rectangle(frame,
                            (x1, y2),
                            (x1 + text_width, y2 + text_height + 5),
                            (0,0,0),
                            -1)

                cv2.putText(frame,
                            text,
                            (x1, y2 + text_height + 2),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            color,
                            1)

    cv2.putText(frame,f"MODE: {mode.upper()}",
            (10,25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255,255,255),
            2)

    last_frame = frame.copy()
    cv2.imshow("Adaptive Cortexium",frame)

    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()