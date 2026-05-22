from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nrclex import NRCLex
import nltk
import ssl

# Fix for potential SSL certificate errors when downloading NLTK data
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Ensure punkt is downloaded for tokenization
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_emotion(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")
    
    lex = NRCLex(req.text)
    
    # Get raw emotion frequencies
    frequencies = lex.affect_frequencies
    
    # We filter out 'positive' and 'negative' and 'anticip' to focus on pure emotions
    emotions_only = {k: v for k, v in frequencies.items() if k not in ['positive', 'negative', 'anticip']}
    
    # Find the top emotion
    top_emotion = "neutral"
    max_val = 0
    for k, v in emotions_only.items():
        if v > max_val:
            max_val = v
            top_emotion = k
            
    # Determine general sentiment
    pos = frequencies.get('positive', 0)
    neg = frequencies.get('negative', 0)
    
    if pos > neg:
        sentiment = "positive"
    elif neg > pos:
        sentiment = "negative"
    else:
        sentiment = "neutral"
        
    return {
        "top_emotion": top_emotion,
        "sentiment": sentiment,
        "emotions": emotions_only,
    }

@app.get("/")
def read_root():
    return {"message": "Emotion Analysis API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
