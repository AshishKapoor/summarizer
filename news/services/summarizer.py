import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SummaryResult:
    text: str
    model_name: str


class LocalSummarizer:
    """Lightweight wrapper that prefers local GPU (MPS) when available."""

    def __init__(self) -> None:
        self._pipeline = None
        self._model_name = "local-gpu"
        self._setup_pipeline()

    def _setup_pipeline(self) -> None:
        try:
            logger.info("Initializing local GPU summarizer...")
            import torch  # type: ignore
            from transformers import pipeline  # type: ignore
            
            # Check device availability
            if torch.backends.mps.is_available():
                device = "mps"
                logger.info("Using Apple MPS (Metal Performance Shaders) for summarization")
            elif torch.cuda.is_available():
                device = 0
                logger.info("Using CUDA GPU for summarization")
            else:
                device = -1  # CPU
                logger.info("Using CPU for summarization")
            
            # Initialize pipeline with a more efficient model
            self._pipeline = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=device,
                dtype=torch.float16 if device != -1 else torch.float32,  # Use half precision on GPU
            )
            self._model_name = f"bart-large-cnn ({device if isinstance(device, str) else 'cuda' if device >= 0 else 'cpu'})"
            logger.info("Successfully initialized transformers summarizer", extra={"device": device})
        except ImportError:
            logger.warning("torch/transformers not installed; using fallback summarizer")
            self._pipeline = None
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to init transformers summarizer; falling back", extra={"error": str(exc)})
            self._pipeline = None

    def summarize(self, text: str, max_words: int = 120) -> SummaryResult:
        if not text.strip():
            return SummaryResult(text="No content available.", model_name=self._model_name)

        if self._pipeline:
            try:
                # Truncate input to prevent token limit issues
                max_input_chars = 3000  # Roughly 750-1000 tokens
                input_text = text[:max_input_chars] if len(text) > max_input_chars else text
                
                # Calculate token lengths more conservatively
                max_length = min(142, max_words + 20)  # Add buffer for model output
                min_length = min(30, max_length // 4)
                
                output = self._pipeline(
                    input_text,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False,
                    truncation=True,
                )[0]["summary_text"]
                
                logger.info(f"Generated summary with {self._model_name}")
                return SummaryResult(text=output.strip(), model_name=self._model_name)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Summarization failed; using fallback", extra={"error": str(exc)})
                # Fall through to fallback

        # Fallback: Extract key sentences or truncate intelligently
        if not text.strip():
            return SummaryResult(text="No content available.", model_name=f"{self._model_name}-fallback")
            
        # Try to extract first few sentences up to word limit
        sentences = [s.strip() for s in text.replace('\n', ' ').split('.') if s.strip()]
        summary_parts = []
        word_count = 0
        
        for sentence in sentences:
            sentence_words = len(sentence.split())
            if word_count + sentence_words <= max_words:
                summary_parts.append(sentence)
                word_count += sentence_words
            else:
                break
        
        if summary_parts:
            fallback_text = '. '.join(summary_parts) + '.'
        else:
            # Last resort: truncate by words
            words = text.split()
            fallback_text = ' '.join(words[:max_words]) + ('...' if len(words) > max_words else '')
        
        return SummaryResult(
            text=fallback_text or "No content available.", 
            model_name=f"{self._model_name}-fallback"
        )
