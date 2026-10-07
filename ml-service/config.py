import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv('PORT', 8000))
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/netshield')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
