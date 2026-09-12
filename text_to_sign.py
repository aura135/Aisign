import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "data", "sign_dictionary.json")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    SIGN_LIBRARY = json.load(f)

ALIASES = {
    "hi": "HELLO",
    "hello": "HELLO",
    "thanks": "THANK_YOU",
    "thank": "THANK_YOU",
    "thankyou": "THANK_YOU",
    "please": "PLEASE",
    "yes": "YES",
    "no": "NO",
    "help": "HELP",
    "how": "HOW",
    "you": "YOU",
    "fine": "FINE"
}


def normalize(text):
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [x for x in text.split() if x]


def text_to_sequence(text):
    words = normalize(text)
    sequence = []
    unknown = []

    for word in words:
        key = ALIASES.get(word)
        if key and key in SIGN_LIBRARY:
            sequence.append(key)
        elif word.upper() in SIGN_LIBRARY:
            sequence.append(word.upper())
        else:
            unknown.append(word)

    return sequence, unknown
